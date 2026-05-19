const Notificacion = require("../models/Notificacion");

exports.verNotificaciones = async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  try {
    const notificaciones = await Notificacion.getByUsuario(req.session.user.id);
    await Notificacion.marcarTodasLeidas(req.session.user.id);

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
    await Notificacion.marcarLeida(req.params.id, req.session.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
};
