const express = require("express");
const { uploadPublicacion } = require("../middlewares/multerUploads");
const authController = require("../controllers/authController");
const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash("error_msg", "Debes iniciar sesión");
    return res.redirect("/auth/login");
  }
  next();
}

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);

router.get("/register", authController.getRegister);
router.post("/register", authController.postRegister);

router.get("/logout", authController.getLogout);
router.post("/logout", authController.postLogout);

router.get("/subirFoto", requireLogin, authController.getSubirFoto);
router.post(
  "/subirFoto",
  requireLogin,
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
