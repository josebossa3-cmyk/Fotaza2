const { sequelize, Usuario, Seguidor } = require("../models");

exports.verSeguidos = async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  try {
    const userId = req.session.user.id;

    //publicaciones de usuarios que sigo
    const [result] = await sequelize.query(
      `SELECT p.id, p.titulo, p.descripcion, p.ruta_archivo AS url, p.etiquetas,
              COALESCE(u.nombre, 'Usuario') AS autor,
              u.id AS autor_id,
              COALESCE(l.likes_count, 0)::int AS likes_count,
              COALESCE(c.comentarios_count, 0)::int AS comentarios_count,
              EXISTS(SELECT 1 FROM likes ul WHERE ul.publicacion_id = p.id AND ul.usuario_id = $1) AS user_liked
       FROM publicaciones p
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN seguidores s ON s.seguido_id = p.usuario_id AND s.seguidor_id = $1
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS likes_count
         FROM likes GROUP BY publicacion_id
       ) l ON l.publicacion_id = p.id
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS comentarios_count
         FROM comentarios WHERE activo = true GROUP BY publicacion_id
       ) c ON c.publicacion_id = p.id
       WHERE p.estado = 'activa'
       ORDER BY p.create_timestamp DESC
       LIMIT 60`,
       { bind: [userId] }
    );

    // lista de usuarios seguidos
    const seguidosRecords = await Seguidor.findAll({
      where: { seguidor_id: userId }
    });
    const seguidosIds = seguidosRecords.map(s => s.seguido_id);
    const seguidos = await Usuario.findAll({
      where: { id: seguidosIds },
      raw: true
    });

    const publicaciones = result.map((row) => {
      const tags = row.etiquetas;
      const etiquetaKey = Array.isArray(tags) && tags.length
        ? String(tags[0]).trim().toLowerCase()
        : "sin-etiqueta";
      const tagsCsv = Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean).join(",")
        : "";
      return { ...row, etiquetaKey, tagsCsv };
    });

    res.render("seguidos/index", {
      title: "Publicaciones que sigo",
      publicaciones,
      seguidos,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error al cargar seguidos:", err);
    res.redirect("/");
  }
};
