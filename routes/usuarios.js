const express = require("express");
const router = express.Router();
const { uploadPerfil } = require("../middlewares/multerUploads");
const usuarioController = require("../controllers/usuarioController");

// Middleware para verificar autenticación
const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash("error_msg", "Debes iniciar sesión para acceder a esta página");
  res.redirect("/auth/login");
};

// GET para mostrar la página de edición
router.get("/editar", ensureAuthenticated, usuarioController.getEditar);

// POST para guardar los cambios
router.post(
  "/editar",
  ensureAuthenticated,
  uploadPerfil.single("foto_perfil"),
  usuarioController.postEditar
);

// Ruta para ver perfil de usuario
router.get("/:id", ensureAuthenticated, usuarioController.verPerfil);

// Ruta para seguir usuario
router.post("/:id/seguir", ensureAuthenticated, usuarioController.seguir);

// Ruta para dejar de seguir
router.post("/:id/dejar-seguir", ensureAuthenticated, usuarioController.dejarSeguir);

module.exports = router;
