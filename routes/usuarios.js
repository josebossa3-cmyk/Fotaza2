const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuario");
const Publicacion = require("../models/Publicacion");
const { uploadPerfil } = require("../middlewares/multerUploads");

// Middleware para verificar autenticación
const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash("error_msg", "Debes iniciar sesión para acceder a esta página");
  res.redirect("/auth/login");
};

// GET para mostrar la página de edición
router.get("/editar", ensureAuthenticated, (req, res) => {
  res.render("usuarios/editar", {
    title: "Editar Perfil",
    currentUser: req.session.user,
  });
});

// POST para guardar los cambios
router.post(
  "/editar",
  ensureAuthenticated,
  uploadPerfil.single("foto_perfil"),
  async (req, res) => {
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
  },
);

// Ruta para ver perfil de usuario
router.get("/:id", ensureAuthenticated, async (req, res) => {
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
});

// Ruta para seguir usuario
router.post("/:id/seguir", ensureAuthenticated, async (req, res) => {
  try {
    const seguidorId = req.session.user.id;
    const seguidoId = parseInt(req.params.id, 10);
    if (seguidorId === seguidoId) {
      return res.status(400).json({ success: false, message: "No válido" });
    }
    await Usuario.seguir(seguidorId, seguidoId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al seguir usuario" });
  }
});

// Ruta para dejar de seguir
router.post("/:id/dejar-seguir", ensureAuthenticated, async (req, res) => {
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
});

module.exports = router;
