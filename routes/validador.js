const express = require("express");
const router = express.Router();
const { ensureRole } = require("../middlewares/auth");
const validadorController = require("../controllers/validadorController");

// Todas las rutas en este archivo requieren el rol 'validador'
router.use(ensureRole("validador"));

// Lista de trabajo del validador de contenidos
router.get("/denuncias", validadorController.getPanelDenuncias);

// Dar de baja publicación
router.post("/publicaciones/:id/bajar", validadorController.postBajarPublicacion);

// Desestimar denuncias
router.post("/publicaciones/:id/desestimar", validadorController.postDesestimarDenuncias);

module.exports = router;
