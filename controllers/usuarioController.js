const Usuario = require("../models/Usuario");
const Publicacion = require("../models/Publicacion");
const Notificacion = require("../models/Notificacion");

exports.getEditar = (req, res) => {
  res.render("usuarios/editar", {
    title: "Editar Perfil",
    currentUser: req.session.user,
  });
};

exports.postEditar = async (req, res) => {
  try {
    const { nombre, bio } = req.body;
    const usuarioId = req.session.user.id;

    let foto_perfil = req.session.user.foto_perfil;
    if (req.file) {
      foto_perfil = `/uploads/perfiles/${req.file.filename}`;
    }

    const usuarioActualizado = await Usuario.update(usuarioId, {
      nombre,
      bio,
      foto_perfil,
    });

    req.session.user = { ...req.session.user, ...usuarioActualizado };
    req.session.save((err) => {
      if (err) console.error(err);
      res.redirect(`/usuarios/${usuarioId}`);
    });
  } catch (error) {
    console.error(error);
    res.render("usuarios/editar", {
      title: "Editar Perfil",
      currentUser: req.session.user,
      error: "Error al actualizar el perfil",
    });
  }
};

exports.verPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      req.flash("error_msg", "Usuario no encontrado");
      return res.redirect("/");
    }

    // Obtener publicaciones del usuario
    const currentUserId = req.session.user ? req.session.user.id : -1;
    const publicaciones = await Publicacion.findByUsuario(usuario.id, currentUserId);

    // Verificar si el usuario actual sigue a este usuario
    let siguiendo = false;
    if (req.session.user) {
      siguiendo = await Usuario.isSiguiendo(req.session.user.id, usuario.id);
    }

    // Obtener publicaciones guardadas (solo para el propio usuario)
    let guardados = [];
    if (req.session.user && req.session.user.id === usuario.id) {
      guardados = await Publicacion.getGuardados(req.session.user.id);
    }

    res.render("usuarios/perfil", {
      title: `Perfil de ${usuario.nombre}`,
      usuario,
      publicaciones,
      guardados,
      siguiendo,
      currentUser: req.session.user,
    });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Error al cargar el perfil");
    res.redirect("/");
  }
};

exports.seguir = async (req, res) => {
  try {
    const seguidorId = req.session.user.id;
    const seguidoId = parseInt(req.params.id, 10);
    if (seguidorId === seguidoId) {
      return res.status(400).json({ success: false, message: "No válido" });
    }
    await Usuario.seguir(seguidorId, seguidoId);
    
    // Notificar al usuario seguido
    await Notificacion.crear(seguidoId, 'nuevo_seguidor', seguidorId, null);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al seguir usuario" });
  }
};

exports.dejarSeguir = async (req, res) => {
  try {
    const seguidorId = req.session.user.id;
    const seguidoId = parseInt(req.params.id, 10);
    await Usuario.dejarSeguir(seguidorId, seguidoId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al dejar de seguir" });
  }
};
