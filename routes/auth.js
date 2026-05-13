const express = require("express");
const IniciarSesion = require("../db/iniciarSesion");
const { crearUsuario } = require("../db/crearUsuario");
const { route } = require("express/lib/application");
const router = express.Router();
const pool = require("../db/poolconnect");

// Demo modal de publicación (vista autónoma, sin layout)
router.get("/modal-demo", (req, res) => {
  res.render("auth/modal");
});

// GET login
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("auth/login", {
    title: "Iniciar sesión",
    error: null,
    username: "",
      registered: req.query.registered === 'true',
    loggedout: req.query.loggedout === 'true'
  });
});

// POST login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Logeado como : ", { email });
  try {
    const resultado = await IniciarSesion(email, password);

    if (resultado.success) {
      req.session.token = resultado.token;
        req.session.user = resultado.usuario;
        req.session.unreadNotifications = 0;
      return res.redirect("/");
    } else {
      res.render("auth/login", {
        title: "Iniciar sesión",
        error: resultado.message,
        email,
        registered: false,
        loggedout: false
      });
    }
  } catch (error) {
    console.error("Error en el login", error);
      return res.render("auth/login", {
        title: "Iniciar sesión",
        error: "Error del servidor. Intenta de nuevo.",
        email: email,
        registered: false,
        loggedout: false
    });
  }
});

// GET registro

router.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("auth/register", {
    title: "Registrarse",
    error: null,
    username: "",
    email: "",
  });
});

// POST registro

router.post("/register", async (req, res) => {
  const { username, email, password, confirm_password } = req.body;

  //validar
  if (!username || !email || !password || !confirm_password) {
    return res.render("auth/register", {
      title: "Registrarse",
      error: "Todos los campos son requeridos",
      username,
      email,
    });
  }

  if (password !== confirm_password) {
    return res.render("auth/register", {
      title: "Registrarse",
      error: "Las contraseñas no coinciden",
      username,
      email,
    });
  }

  if (password.length < 6) {
    return res.render("auth/register", {
      title: "Registrarse",
      error: "La contraseña debe tener al menos 6 caracteres",
      username,
      email,
    });
  }

  try {
    //solo pasamos los 3 argunentos: nombre, email, contra

    const resultado = await crearUsuario(username, email, password);

    if (resultado.success) {
      res.redirect("/auth/login?registered=true");
    }
  } catch (error) {
    console.error("Error en el registro", error);
    res.render("auth/register", {
      title: "Registrarse",
      error: error.message || "Error al crear el usuario. Intenta de nuevo.",
      username,
      email,
    });
  }
});

// GET cerrar sesion
router.get("/logout", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  res.render("auth/logout", {
    title: "Cerrar sesion",
  });
});

// POST cerrar sesion
router.post("/logout", async (req, res) => {
  try {
    if (req.session.token) {
      await pool.query("UPDATE sesiones SET activa = false WHERE token = $1", [
        req.session.token,
      ]);
    }
  } catch (error) {
    console.error("Error al desactivar sesión:", error);
  }

  // Destruir sesión
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/auth/login?loggedout=true");
  });
});

//subir foto

router.get("/subirFoto", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  try {
    // Consulta a la tabla publicaciones
    const result = await pool.query(
      "SELECT id, titulo, descripcion, ruta_archivo AS url, create_timestamp FROM publicaciones ORDER BY create_timestamp DESC"
    );

    res.render("auth/subirFoto", {
      fotos: result.rows, 
      title: "Subir Foto",
      currentUser: req.session.user,
    });
  } catch (err) {
    console.error("Error al obtener fotos:", err);
    res.render("auth/subirFoto", {
      fotos: [],
      title: "Subir Foto",
      currentUser: req.session.user,
    });
  }
});

// Exportar el router como middleware principal para `app.use('/auth', ...)`
module.exports = router;

// También exportar el helper ensureAuthenticated si otros módulos lo requieren
module.exports.ensureAuthenticated = function (req, res, next) {
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
    return next();
  }
  if (typeof req.flash === 'function') {
    req.flash('error_msg', 'Tenes que iniciar sesión');
  }
  res.redirect('/auth/login');
};
