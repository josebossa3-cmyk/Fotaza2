const { sequelize, Publicacion, Usuario, DenunciaPublicacion, DenunciaComentario, Comentario } = require("../models");

// 1. Panel principal de trabajo del Validador de Contenidos
exports.getPanelDenuncias = async (req, res) => {
  try {
    // Consulta de publicaciones denunciadas que siguen activas
    const [publicacionesRows] = await sequelize.query(
      `SELECT p.id, p.titulo, p.descripcion, p.ruta_archivo AS url, p.licencia, p.estado, p.create_timestamp,
              u.id AS autor_id, u.nombre AS autor_nombre, u.email AS autor_email, u.activo AS autor_activo,
              COUNT(d.id)::int AS denuncias_count,
              COALESCE(bajas.total_bajas, 0)::int AS autor_bajas_count
       FROM publicaciones p
       INNER JOIN denuncias_publicacion d ON d.publicacion_id = p.id
       JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN (
         SELECT usuario_id, COUNT(*)::int AS total_bajas
         FROM publicaciones
         WHERE estado = 'bajada'
         GROUP BY usuario_id
       ) bajas ON bajas.usuario_id = u.id
       WHERE p.estado = 'activa'
       GROUP BY p.id, u.id, u.nombre, u.email, u.activo, bajas.total_bajas
       ORDER BY denuncias_count DESC, p.create_timestamp DESC`
    );

    // Para cada publicación, obtener el detalle de las denuncias con nombre del denunciante
    for (const pub of publicacionesRows) {
      const [detalles] = await sequelize.query(
        `SELECT d.id, d.motivo, d.descripcion, d.fecha,
                u.id AS denunciante_id, u.nombre AS denunciante_nombre, u.email AS denunciante_email
         FROM denuncias_publicacion d
         JOIN usuarios u ON u.id = d.usuario_id
         WHERE d.publicacion_id = $1
         ORDER BY d.fecha DESC`,
        { bind: [pub.id] }
      );
      pub.detalles_denuncias = detalles;
      // Más de 3 denuncias entran con prioridad en la lista de trabajo
      pub.es_prioritaria = pub.denuncias_count > 3;
    }

    // Estadísticas generales para el validador
    const totalEnRevision = publicacionesRows.length;
    const totalPrioritarias = publicacionesRows.filter((p) => p.es_prioritaria).length;

    const [bajasStats] = await sequelize.query(
      `SELECT COUNT(*)::int AS total FROM publicaciones WHERE estado = 'bajada'`
    );
    const [usuariosInactivosStats] = await sequelize.query(
      `SELECT COUNT(*)::int AS total FROM usuarios WHERE activo = false`
    );

    res.render("validador/denuncias", {
      title: "Lista de trabajo - Validador de Contenidos",
      publicaciones: publicacionesRows,
      stats: {
        totalEnRevision,
        totalPrioritarias,
        totalBajadas: bajasStats[0]?.total || 0,
        totalInactivos: usuariosInactivosStats[0]?.total || 0,
      },
      currentUser: req.session.user,
    });
  } catch (error) {
    console.error("Error al cargar panel del validador:", error);
    req.flash("error_msg", "Error al cargar la lista de trabajo del validador.");
    res.redirect("/");
  }
};

// Acción: Dar de baja una publicación
exports.postBajarPublicacion = async (req, res) => {
  const { id } = req.params;

  try {
    const pub = await Publicacion.findByPk(id, {
      include: [{ model: Usuario, as: "autor" }],
    });

    if (!pub) {
      req.flash("error_msg", "Publicación no encontrada.");
      return res.redirect("/validador/denuncias");
    }

    // Actualizar estado a 'bajada'
    pub.estado = "bajada";
    await pub.save();

    // Contar cuántas publicaciones bajadas acumula el autor
    const totalBajadas = await Publicacion.count({
      where: {
        usuario_id: pub.usuario_id,
        estado: "bajada",
      },
    });

    
    //  3 publicaciones 'bajadas' el sistema inactiva su cuenta."
    let cuentaInactivada = false;
    if (totalBajadas >= 3) {
      await Usuario.update({ activo: false }, { where: { id: pub.usuario_id } });
      cuentaInactivada = true;
    }

    if (cuentaInactivada) {
      req.flash(
        "error_msg",
        `Publicación "${pub.titulo}" dada de baja. El autor ${pub.autor?.nombre || "Usuario"} alcanzó ${totalBajadas} publicaciones bajadas y su cuenta ha sido INACTIVADA automáticamente.`
      );
    } else {
      req.flash(
        "success_msg",
        `Publicación "${pub.titulo}" dada de baja correctamente. El autor acumula ${totalBajadas} publicación(es) bajada(s) (al llegar a 3 será inactivado).`
      );
    }

    res.redirect("/validador/denuncias");
  } catch (error) {
    console.error("Error al dar de baja publicación:", error);
    req.flash("error_msg", "Error al procesar la baja de la publicación.");
    res.redirect("/validador/denuncias");
  }
};

//Accion Desestimar denuncias
exports.postDesestimarDenuncias = async (req, res) => {
  const { id } = req.params;

  try {
    const pub = await Publicacion.findByPk(id);

    if (!pub) {
      req.flash("error_msg", "Publicación no encontrada.");
      return res.redirect("/validador/denuncias");
    }

    // Eliminar las denuncias acumuladas para que vuelva a estar limpia
    await DenunciaPublicacion.destroy({
      where: { publicacion_id: id },
    });

    req.flash(
      "success_msg",
      `Las denuncias de la publicación "${pub.titulo}" fueron desestimadas. La publicación permanece activa.`
    );
    res.redirect("/validador/denuncias");
  } catch (error) {
    console.error("Error al desestimar denuncias:", error);
    req.flash("error_msg", "Error al desestimar las denuncias.");
    res.redirect("/validador/denuncias");
  }
};

// 4. Denunciar una publicación (para cualquier usuario registrado)
exports.postDenunciarPublicacion = async (req, res) => {
  const { id } = req.params;
  const { motivo, descripcion } = req.body;
  const usuarioId = req.session.user.id;

  if (typeof motivo !== "string" || !motivo.trim()) {
    return res.status(400).json({ success: false, message: "Debes seleccionar un motivo para la denuncia." });
  }

  if (typeof descripcion !== "string" || !descripcion.trim()) {
    return res.status(400).json({ success: false, message: "Debes explicar el motivo de la denuncia." });
  }

  try {
    const pub = await Publicacion.findByPk(id);
    if (!pub) {
      return res.status(404).json({ success: false, message: "Publicación no encontrada." });
    }

    // El autor no puede denunciar su propia publicación
    if (pub.usuario_id === usuarioId) {
      return res.status(403).json({ success: false, message: "No puedes denunciar tu propia publicación." });
    }

    // Crear la denuncia evitando duplicados del mismo usuario
    const [denuncia, created] = await DenunciaPublicacion.findOrCreate({
      where: {
        usuario_id: usuarioId,
        publicacion_id: id,
      },
      defaults: {
        motivo: motivo.trim(),
        descripcion: (descripcion || "").trim(),
      },
    });

    if (!created) {
      return res.status(400).json({ success: false, message: "Ya has denunciado esta publicación previamente." });
    }

    // Contar cuántas denuncias acumula
    const totalDenuncias = await DenunciaPublicacion.count({
      where: { publicacion_id: id },
    });

    return res.json({
      success: true,
      message: "Denuncia registrada correctamente. Será revisada por el equipo de moderación.",
      totalDenuncias,
    });
  } catch (error) {
    console.error("Error al registrar denuncia de publicación:", error);
    return res.status(500).json({ success: false, message: "Error interno al procesar la denuncia." });
  }
};

// 5. Denunciar un comentario
exports.postDenunciarComentario = async (req, res) => {
  const { id } = req.params;
  const { motivo, descripcion } = req.body;
  const usuarioId = req.session.user.id;

  if (!motivo || !motivo.trim()) {
    return res.status(400).json({ success: false, message: "Debes indicar un motivo de denuncia." });
  }

  try {
    const comentario = await Comentario.findByPk(id);
    if (!comentario) {
      return res.status(404).json({ success: false, message: "Comentario no encontrado." });
    }

    // Los comentarios que no son del autor pueden ser denunciados
    if (comentario.usuario_id === usuarioId) {
      return res.status(403).json({ success: false, message: "No puedes denunciar tu propio comentario." });
    }

    const [denuncia, created] = await DenunciaComentario.findOrCreate({
      where: {
        usuario_id: usuarioId,
        comentario_id: id,
      },
      defaults: {
        motivo: motivo.trim(),
        descripcion: (descripcion || "").trim(),
      },
    });

    if (!created) {
      return res.status(400).json({ success: false, message: "Ya has denunciado este comentario." });
    }

    return res.json({
      success: true,
      message: "Comentario denunciado. El autor de la publicación podrá revisarlo.",
    });
  } catch (error) {
    console.error("Error al denunciar comentario:", error);
    return res.status(500).json({ success: false, message: "Error al denunciar el comentario." });
  }
};

// 6. Eliminar un comentario 
exports.postEliminarComentario = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.session.user.id;

  try {
    const comentario = await Comentario.findByPk(id, {
      include: [{ model: Publicacion, as: "publicacion" }],
    });

    if (!comentario) {
      return res.status(404).json({ success: false, message: "Comentario no encontrado." });
    }

    // Permitido si es el autor de la publicación contenedora o el autor del comentario
    const esAutorPost = comentario.publicacion && comentario.publicacion.usuario_id === usuarioId;
    const esAutorComentario = comentario.usuario_id === usuarioId;

    if (!esAutorPost && !esAutorComentario) {
      return res.status(403).json({ success: false, message: "No tienes permiso para eliminar este comentario." });
    }

    // Borrado lógico o físico
    comentario.activo = false;
    await comentario.save();

    return res.json({ success: true, message: "Comentario eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    return res.status(500).json({ success: false, message: "Error al eliminar el comentario." });
  }
};
