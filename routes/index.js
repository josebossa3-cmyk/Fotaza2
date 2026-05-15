const express = require("express");
const pool = require("../db/poolconnect");
const router = express.Router();

/** Tarjetas de ejemplo cuando aún no hay publicaciones (misma forma que las reales). */
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

// Ruta principal
router.get("/", (req, res) => {
  res.render("home", {
    title: "Inicio",
    user: req.session.user || null,
  });
});

// Explorar (publicaciones)
router.get("/publicaciones", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.titulo, p.descripcion, p.ruta_archivo AS url, p.etiquetas,
              COALESCE(u.nombre, 'Usuario') AS autor,
              COALESCE(l.likes_count, 0)::int AS likes_count,
              COALESCE(c.comentarios_count, 0)::int AS comentarios_count
       FROM publicaciones p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS likes_count
         FROM likes GROUP BY publicacion_id
       ) l ON l.publicacion_id = p.id
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS comentarios_count
         FROM comentarios GROUP BY publicacion_id
       ) c ON c.publicacion_id = p.id
       ORDER BY p.create_timestamp DESC`
    );

    const publicaciones = result.rows.map((row) => {
      const tags = row.etiquetas;
      let first = "";
      if (Array.isArray(tags) && tags.length) {
        first = String(tags[0] || "");
      } else if (tags != null) {
        first = String(tags);
      }
      const etiquetaKey =
        first.trim().toLowerCase() || "sin-etiqueta";
      let tagsCsv = "";
      if (Array.isArray(tags) && tags.length) {
        tagsCsv = tags
          .map((t) => String(t || "").trim())
          .filter(Boolean)
          .join(",");
      } else if (tags != null && typeof tags === "string" && tags.trim()) {
        tagsCsv = tags
          .split(/[,;]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .join(",");
      }
      return { ...row, etiquetaKey, tagsCsv };
    });

    const usarDemos = publicaciones.length === 0;
    res.render("auth/explorar", {
      title: "Explorar",
      publicaciones: usarDemos ? EXPLORAR_DEMOS : publicaciones,
      demosPlaceholder: usarDemos,
    });
  } catch (err) {
    console.error("Error al cargar publicaciones:", err);
    res.render("auth/explorar", {
      title: "Explorar",
      publicaciones: [],
      loadError: true,
    });
  }
});

const proximamente = (pageTitle) => (req, res) => {
  res.render("placeholder", {
    title: pageTitle,
    pageTitle,
  });
};

router.get("/publicaciones/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Traer la publicación con datos del autor y promedio de valoraciones
    const result = await pool.query(
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
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).render("404");
    }

    const publicacion = result.rows[0];

    // Traer comentarios activos con nombre del autor
    const comentariosResult = await pool.query(
      `SELECT c.*, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
       FROM comentarios c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.publicacion_id = $1 AND c.activo = true
       ORDER BY c.fecha ASC`,
      [id]
    );

    // Si hay usuario logueado, verificar si ya valoró
    let yaValoro = false;
    let miValoracion = null;
    if (req.session.user) {
      const votoResult = await pool.query(
        `SELECT puntaje FROM valoraciones 
        WHERE publicacion_id = $1 AND usuario_id = $2`,
        [id, req.session.user.id]
      );
      if (votoResult.rows.length > 0) {
        yaValoro = true;
        miValoracion = votoResult.rows[0].puntaje;
      }
    }

    res.render("publicaciones/ver", {
      title: publicacion.titulo,
      publicacion,
      comentarios: comentariosResult.rows,
      yaValoro,
      miValoracion,
      user: req.session.user || null,
    });

  } catch (err) {
    console.error("Error al cargar publicación:", err);
    res.status(500).render("404");
  }
});


// Comentar publicación
router.post("/publicaciones/:id/comentar", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  const { id } = req.params;
  const { contenido } = req.body;

  try {
    // Verificar que los comentarios estén abiertos
    const pub = await pool.query(
      "SELECT comentarios_abiertos FROM publicaciones WHERE id = $1",
      [id]
    );

    if (pub.rows[0]?.comentarios_abiertos) {
      await pool.query(
        `INSERT INTO comentarios (contenido, usuario_id, publicacion_id)
         VALUES ($1, $2, $3)`,
        [contenido, req.session.user.id, id]
      );
    }
  } catch (err) {
    console.error("Error al comentar:", err);
  }

  res.redirect(`/publicaciones/${id}`);
});

// Cerrar comentarios (solo el autor)
router.post("/publicaciones/:id/cerrar-comentarios", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  const { id } = req.params;

  try {
    // Verificar que sea el autor
    const pub = await pool.query(
      "SELECT usuario_id, comentarios_abiertos FROM publicaciones WHERE id = $1",
      [id]
    );

    if (pub.rows[0]?.usuario_id === req.session.user.id) {
      const nuevoEstado = !pub.rows[0].comentarios_abiertos;
      await pool.query(
        "UPDATE publicaciones SET comentarios_abiertos = $1 WHERE id = $2",
        [nuevoEstado, id]
      );
    }
  } catch (err) {
    console.error("Error al cerrar comentarios:", err);
  }

  res.redirect(`/publicaciones/${id}`);
});

// Valorar imagen (devuelve JSON para el fetch del frontend)
router.post("/publicaciones/:id/valorar", async (req, res) => {
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
    // Verificar que no sea el autor
    const pub = await pool.query(
      "SELECT usuario_id FROM publicaciones WHERE id = $1",
      [id]
    );

    if (pub.rows[0]?.usuario_id === req.session.user.id) {
      return res.status(403).json({ error: "No podés valorar tu propia publicación" });
    }

    // Insertar valoración
    await pool.query(
      `INSERT INTO valoraciones (usuario_id, publicacion_id, puntaje)
       VALUES ($1, $2, $3)`,
      [req.session.user.id, id, puntajeNum]
    );

    // Devolver nuevo promedio
    const promResult = await pool.query(
      `SELECT COALESCE(AVG(puntaje), 0)::numeric(3,1) AS promedio,
              COUNT(*)::int AS cantidad
       FROM valoraciones WHERE publicacion_id = $1`,
      [id]
    );

    res.json({
      ok: true,
      promedio: promResult.rows[0].promedio,
      cantidad: promResult.rows[0].cantidad,
    });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ya valoraste esta publicación" });
    }
    console.error("Error al valorar:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/buscar", proximamente("Buscar"));
router.get("/notificaciones", proximamente("Notificaciones"));
router.get("/favoritos", proximamente("Mis favoritos"));
router.get("/seguidos", proximamente("Usuarios que sigo"));
router.get("/comunidad", proximamente("Comunidad"));
router.get("/privacidad", proximamente("Privacidad"));
router.get("/terminos", proximamente("Términos"));
router.get("/contacto", proximamente("Contacto"));

module.exports = router;
