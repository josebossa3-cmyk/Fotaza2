const { sequelize, Publicacion, Notificacion, Comentario, Valoracion } = require("../models");

const EXPLORAR_DEMOS = [
  {
    id: "demo-1",
    titulo: "Estudio en luz natural",
    descripcion: "Luz suave y sombras limpias.",
    url: "https://picsum.photos/seed/fotazaexp1/480/640",
    autor: "Lucía M.",
    etiquetaKey: "fotografía",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "fotografía",
  },
  {
    id: "demo-2",
    titulo: "Identidad visual",
    descripcion: "Paleta y tipografía para marca.",
    url: "https://picsum.photos/seed/fotazaexp2/480/520",
    autor: "Marco D.",
    etiquetaKey: "diseño",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "diseño",
  },
  {
    id: "demo-3",
    titulo: "Fachada contemporánea",
    descripcion: "Líneas y cristal en fachada urbana.",
    url: "https://picsum.photos/seed/fotazaexp3/480/720",
    autor: "Elena V.",
    etiquetaKey: "arquitectura",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "arquitectura",
  },
  {
    id: "demo-4",
    titulo: "Tipografía y color",
    descripcion: "Estudio de contraste cromático.",
    url: "https://picsum.photos/seed/fotazaexp4/480/560",
    autor: "Marco D.",
    etiquetaKey: "diseño",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "diseño,tipografía",
  },
  {
    id: "demo-5",
    titulo: "Atardecer urbano",
    descripcion: "Horizonte y reflejos al anochecer.",
    url: "https://picsum.photos/seed/fotazaexp5/480/600",
    autor: "Lucía M.",
    etiquetaKey: "fotografía",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "fotografía,urbano",
  },
  {
    id: "demo-6",
    titulo: "Espacio interior",
    descripcion: "Volumen y materiales en interior.",
    url: "https://picsum.photos/seed/fotazaexp6/480/680",
    autor: "Elena V.",
    etiquetaKey: "arquitectura",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "arquitectura,interior",
  },
  {
    id: "demo-7",
    titulo: "Branding editorial",
    descripcion: "Maquetación y ritmo visual.",
    url: "https://picsum.photos/seed/fotazaexp7/480/540",
    autor: "Ana R.",
    etiquetaKey: "diseño",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "diseño,editorial",
  },
  {
    id: "demo-8",
    titulo: "Retrato en exterior",
    descripcion: "Luz natural y fondo desenfocado.",
    url: "https://picsum.photos/seed/fotazaexp8/480/760",
    autor: "Ana R.",
    etiquetaKey: "fotografía",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "fotografía,retrato",
  },
];

exports.explorar = async (req, res) => {
  try {
    const userId = req.session.user ? req.session.user.id : -1;
    const { q, licencia, orden } = req.query;

    // Construir condiciones dinámicas
    const condiciones = ["p.estado = 'activa'"];
    const valores = [userId];
    let paramIndex = 2;

    if (q && q.trim()) {
      condiciones.push(
        `(p.titulo ILIKE $${paramIndex} OR p.descripcion ILIKE $${paramIndex} OR EXISTS (
          SELECT 1 FROM unnest(p.etiquetas) tag WHERE tag ILIKE $${paramIndex}
        ))`
      );
      valores.push(`%${q.trim()}%`);
      paramIndex++;
    }

    if (licencia && (licencia === "libre" || licencia === "copyright")) {
      condiciones.push(`p.licencia = $${paramIndex}`);
      valores.push(licencia);
      paramIndex++;
    }

    // Ordenamiento
    let orderBy = "p.create_timestamp DESC";
    if (orden === "valoracion") {
      orderBy = "valoracion_promedio DESC NULLS LAST, p.create_timestamp DESC";
    } else if (orden === "comentarios") {
      orderBy = "comentarios_count DESC, p.create_timestamp DESC";
    }

    const whereClause = condiciones.join(" AND ");

    const [rows] = await sequelize.query(
      `SELECT p.id, p.titulo, p.descripcion, p.ruta_archivo AS url, p.etiquetas, p.licencia,
              COALESCE(u.nombre, 'Usuario') AS autor,
              u.id AS autor_id,
              COALESCE(l.likes_count, 0)::int AS likes_count,
              COALESCE(c.comentarios_count, 0)::int AS comentarios_count,
              COALESCE(v.valoracion_promedio, 0)::numeric(3,1) AS valoracion_promedio,
              EXISTS(SELECT 1 FROM valoraciones ul WHERE ul.publicacion_id = p.id AND ul.usuario_id = $1) AS user_liked
       FROM publicaciones p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS likes_count
         FROM valoraciones GROUP BY publicacion_id
       ) l ON l.publicacion_id = p.id
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS comentarios_count
         FROM comentarios WHERE activo = true GROUP BY publicacion_id
       ) c ON c.publicacion_id = p.id
       LEFT JOIN (
         SELECT publicacion_id, AVG(puntaje)::numeric(3,1) AS valoracion_promedio
         FROM valoraciones GROUP BY publicacion_id
       ) v ON v.publicacion_id = p.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT 60`,
      { bind: valores }
    );

    const publicaciones = rows.map((row) => {
      const tags = row.etiquetas;
      let first = "";
      if (Array.isArray(tags) && tags.length) {
        first = String(tags[0] || "");
      } else if (tags != null) {
        first = String(tags);
      }
      const etiquetaKey = first.trim().toLowerCase() || "sin-etiqueta";
      let tagsCsv = "";
      if (Array.isArray(tags) && tags.length) {
        tagsCsv = tags.map((t) => String(t || "").trim()).filter(Boolean).join(",");
      }
      return { ...row, etiquetaKey, tagsCsv };
    });

    const usarDemos = publicaciones.length === 0 && !q && !licencia && !orden;

    res.render("auth/explorar", {
      title: "Explorar",
      publicaciones: usarDemos ? EXPLORAR_DEMOS : publicaciones,
      demosPlaceholder: usarDemos,
      totalResultados: publicaciones.length,
      q: q || "",
      licencia: licencia || "",
      orden: orden || "reciente",
    });
  } catch (err) {
    console.error("Error al cargar publicaciones:", err);
    res.render("auth/explorar", {
      title: "Explorar",
      publicaciones: [],
      loadError: true,
      q: "",
      licencia: "",
      orden: "reciente",
    });
  }
};

exports.ver = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await sequelize.query(
      `SELECT p.*,
              u.nombre AS autor_nombre,
              u.foto_perfil AS autor_foto,
              u.id AS autor_id,
              COALESCE(AVG(v.puntaje), 0)::numeric(3,1) AS valoracion_promedio,
              COUNT(DISTINCT v.id)::int AS valoracion_cantidad,
              COUNT(DISTINCT c.id)::int AS comentarios_count
       FROM publicaciones p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN valoraciones v ON v.publicacion_id = p.id
       LEFT JOIN comentarios c ON c.publicacion_id = p.id AND c.activo = true
       WHERE p.id = $1 AND p.estado = 'activa'
       GROUP BY p.id, u.nombre, u.foto_perfil, u.id`,
      { bind: [id] }
    );

    if (rows.length === 0) {
      return res.status(404).render("404");
    }

    const publicacion = rows[0];

    const [comentariosRows] = await sequelize.query(
      `SELECT c.*, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
       FROM comentarios c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.publicacion_id = $1 AND c.activo = true
       ORDER BY c.fecha ASC`,
      { bind: [id] }
    );

    let yaValoro = false;
    let miValoracion = null;
    if (req.session.user) {
      const [votoRows] = await sequelize.query(
        `SELECT puntaje FROM valoraciones 
        WHERE publicacion_id = $1 AND usuario_id = $2`,
        { bind: [id, req.session.user.id] }
      );
      if (votoRows.length > 0) {
        yaValoro = true;
        miValoracion = votoRows[0].puntaje;
      }
    }

    res.render("publicaciones/ver", {
      title: publicacion.titulo,
      publicacion,
      comentarios: comentariosRows,
      yaValoro,
      miValoracion,
      user: req.session.user || null,
    });

  } catch (err) {
    console.error("Error al cargar publicación:", err);
    res.status(500).render("404");
  }
};

exports.comentar = async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  const { id } = req.params;
  const { contenido } = req.body;

  try {
    const pub = await Publicacion.findByPk(id);

    if (pub && pub.comentarios_abiertos) {
      await Comentario.create({
        contenido,
        usuario_id: req.session.user.id,
        publicacion_id: id
      });
      
      if (pub.usuario_id) {
        await Notificacion.create({
          usuario_id: pub.usuario_id,
          actor_id: req.session.user.id,
          tipo: 'comentario',
          referencia_id: parseInt(id)
        });
      }
    }
  } catch (err) {
    console.error("Error al comentar:", err);
  }

  res.redirect(`/publicaciones/${id}`);
};

exports.getComentariosApi = async (req, res) => {
  const { id } = req.params;
  try {
    const [comentariosRows] = await sequelize.query(
      `SELECT c.*, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
       FROM comentarios c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.publicacion_id = $1 AND c.activo = true
       ORDER BY c.fecha ASC`,
      { bind: [id] }
    );
    res.json({ ok: true, comentarios: comentariosRows });
  } catch (err) {
    console.error("Error al obtener comentarios:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.comentarApi = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const { id } = req.params;
  const { contenido } = req.body;
  if (!contenido || !contenido.trim()) {
    return res.status(400).json({ error: "Comentario vacío" });
  }

  try {
    const pub = await Publicacion.findByPk(id);

    const result = await Comentario.create({
      contenido: contenido.trim(),
      usuario_id: req.session.user.id,
      publicacion_id: id
    });

    if (pub && pub.usuario_id) {
      await Notificacion.create({
        usuario_id: pub.usuario_id,
        actor_id: req.session.user.id,
        tipo: 'comentario',
        referencia_id: parseInt(id)
      });
    }

    res.json({
      ok: true,
      comentario: {
        id: result.id,
        contenido: result.contenido,
        autor: req.session.user.nombre || 'Tú'
      }
    });
  } catch (err) {
    console.error("Error al comentar API:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.like = async (req, res) => {
  // En Fotaza2, 'likes' aparentemente es un comportamiento guardado en valoraciones
  if (!req.session.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const { id } = req.params;
  const usuario_id = req.session.user.id;

  try {
    // Verificamos si ya dio like (usamos la tabla valoraciones como sustituto según el esquema de initDB)
    const result = await Valoracion.findOne({
      where: { publicacion_id: id, usuario_id: usuario_id }
    });

    let liked = false;
    if (result) {
      await Valoracion.destroy({
        where: { publicacion_id: id, usuario_id: usuario_id }
      });
    } else {
      await Valoracion.create({
        publicacion_id: id,
        usuario_id: usuario_id,
        puntaje: 5 // Like = 5 estrellas
      });
      liked = true;

      const pub = await Publicacion.findByPk(id);
      if (pub && pub.usuario_id) {
        await Notificacion.create({
          usuario_id: pub.usuario_id,
          actor_id: usuario_id,
          tipo: 'like',
          referencia_id: parseInt(id)
        });
      }
    }

    const countResult = await Valoracion.count({
      where: { publicacion_id: id }
    });

    res.json({
      ok: true,
      liked: liked,
      likes_count: countResult
    });

  } catch (err) {
    console.error("Error al dar like:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};

exports.cerrarComentarios = async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  const { id } = req.params;

  try {
    const pub = await Publicacion.findByPk(id);

    if (pub && pub.usuario_id === req.session.user.id) {
      pub.comentarios_abiertos = !pub.comentarios_abiertos;
      await pub.save();
    }
  } catch (err) {
    console.error("Error al cerrar comentarios:", err);
  }

  res.redirect(`/publicaciones/${id}`);
};

exports.valorar = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const { id } = req.params;
  const { puntaje } = req.body;
  const puntajeNum = parseInt(puntaje);

  if (puntajeNum < 1 || puntajeNum > 5) {
    return res.status(400).json({ error: "Puntaje inválido" });
  }

  try {
    const pub = await Publicacion.findByPk(id);

    if (pub && pub.usuario_id === req.session.user.id) {
      return res.status(403).json({ error: "No podés valorar tu propia publicación" });
    }

    const [valoracion, created] = await Valoracion.findOrCreate({
      where: { usuario_id: req.session.user.id, publicacion_id: id },
      defaults: { puntaje: puntajeNum }
    });

    if (!created) {
       return res.status(400).json({ error: "Ya valoraste esta publicación" });
    }

    if (pub && pub.usuario_id) {
      await Notificacion.create({
        usuario_id: pub.usuario_id,
        actor_id: req.session.user.id,
        tipo: 'valoracion',
        referencia_id: parseInt(id)
      });
    }

    const promResult = await sequelize.query(
      `SELECT COALESCE(AVG(puntaje), 0)::numeric(3,1) AS promedio,
              COUNT(*)::int AS cantidad
       FROM valoraciones WHERE publicacion_id = $1`,
      { bind: [id] }
    );

    res.json({
      ok: true,
      promedio: promResult[0][0].promedio,
      cantidad: promResult[0][0].cantidad,
    });

  } catch (err) {
    console.error("Error al valorar:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
};
