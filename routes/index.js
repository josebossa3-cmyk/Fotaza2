const express = require("express");
const router = express.Router();
const publicacionController = require("../controllers/publicacionController");
const notificacionController = require("../controllers/notificacionController");
const seguidosController = require("../controllers/seguidosController");
const usuarioController = require("../controllers/usuarioController");
const validadorController = require("../controllers/validadorController");
const { ensureAuthenticated } = require("../middlewares/auth");

// Ruta principal
router.get("/", publicacionController.home);

const proximamente = (pageTitle) => (req, res) => {
  res.render("placeholder", {
    title: pageTitle,
    pageTitle,
  });
};

// Explorar (publicaciones)
router.get("/publicaciones", publicacionController.explorar);
router.get("/publicaciones/:id", publicacionController.ver);
router.post("/publicaciones/:id/comentar", publicacionController.comentar);
router.get("/publicaciones/:id/comentarios_api", publicacionController.getComentariosApi);
router.post("/publicaciones/:id/comentar_api", publicacionController.comentarApi);
router.post("/publicaciones/:id/like", publicacionController.like);
router.post("/publicaciones/:id/cerrar-comentarios", publicacionController.cerrarComentarios);
router.post("/publicaciones/:id/valorar", publicacionController.valorar);

// Denuncias y moderación de contenido
router.post("/publicaciones/:id/denunciar", ensureAuthenticated, validadorController.postDenunciarPublicacion);
router.post("/comentarios/:id/denunciar", ensureAuthenticated, validadorController.postDenunciarComentario);
router.post("/comentarios/:id/eliminar", ensureAuthenticated, validadorController.postEliminarComentario);

// Notificaciones
router.get("/notificaciones", notificacionController.verNotificaciones);
router.post("/notificaciones/:id/leer", notificacionController.marcarLeida);

// Seguidos
router.get("/seguidos", seguidosController.verSeguidos);

// Buscador
router.get("/buscar", usuarioController.buscarUsuarios);

// Placeholders
router.get("/favoritos", proximamente("Mis favoritos"));
router.get("/comunidad", proximamente("Comunidad"));
router.get("/privacidad", proximamente("Privacidad"));
router.get("/terminos", proximamente("Términos"));
router.get("/contacto", proximamente("Contacto"));

module.exports = router;
