const { Notificacion, Usuario } = require("../models");

exports.verNotificaciones = async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  try {
    const notificaciones = await Notificacion.findAll({
      where: { usuario_id: req.session.user.id },
      include: [
        { model: Usuario, as: "actor", attributes: ["id", "nombre", "foto_perfil"] }
      ],
      order: [["fecha", "DESC"]],
    });

    await Notificacion.update(
      { leida: true },
      { where: { usuario_id: req.session.user.id, leida: false } }
    );

    res.render("notificaciones/index", {
      title: "Notificaciones",
      notificaciones,
    });
  } catch (err) {
    console.error("Error al cargar notificaciones:", err);
    res.redirect("/");
  }
};

exports.marcarLeida = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "No autenticado" });

  try {
    await Notificacion.update(
      { leida: true },
      { where: { id: req.params.id, usuario_id: req.session.user.id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
};
