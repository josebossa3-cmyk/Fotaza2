const express = require("express");
const { uploadPublicacion } = require("../middlewares/multerUploads");
const { ensureAuthenticated, ensureGuest } = require("../middlewares/auth");
const authController = require("../controllers/authController");
const router = express.Router();

router.get("/login", ensureGuest, authController.getLogin);
router.post("/login", ensureGuest, authController.postLogin);

router.get("/register", ensureGuest, authController.getRegister);
router.post("/register", ensureGuest, authController.postRegister);

router.get("/logout", authController.getLogout);
router.post("/logout", authController.postLogout);

router.get("/subirFoto", ensureAuthenticated, authController.getSubirFoto);
router.post(
  "/subirFoto",
  ensureAuthenticated,
  (req, res, next) => {
    uploadPublicacion.single("imagen")(req, res, (err) => {
      if (err) {
        req.flash("error_msg", err.message || "No se pudo subir la imagen");
        return res.redirect("/auth/subirFoto");
      }
      next();
    });
  },
  authController.postSubirFoto
);

module.exports = router;
