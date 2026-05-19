const IniciarSesion = require("../db/iniciarSesion");
const { crearUsuario } = require("../db/crearUsuario");
const Publicacion = require("../models/Publicacion");
const pool = require("../db/poolconnect");

function parseEtiquetas(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

exports.getLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("auth/login", {
    title: "Iniciar sesión",
    error: null,
    username: "",
    registered: req.query.registered === "true",
    loggedout: req.query.loggedout === "true",
  });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const resultado = await IniciarSesion(email, password);

    if (resultado.success) {
      req.session.token = resultado.token;
      req.session.user = resultado.usuario;
      req.session.unreadNotifications = 0;
      return res.redirect("/");
    }
    res.render("auth/login", {
      title: "Iniciar sesión",
      error: resultado.message,
      email,
      registered: false,
      loggedout: false,
    });
  } catch (error) {
    console.error("Error en el login", error);
    return res.render("auth/login", {
      title: "Iniciar sesión",
      error: "Error del servidor. Intenta de nuevo.",
      email: email,
      registered: false,
      loggedout: false,
    });
  }
};

exports.getRegister = (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("auth/register", {
    title: "Registrarse",
    error: null,
    username: "",
    email: "",
  });
};

exports.postRegister = async (req, res) => {
  const { username, email, password, confirm_password } = req.body;

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
    const resultado = await crearUsuario(username, email, password);

    if (resultado.success) {
      return res.redirect("/auth/login?registered=true");
    }
    return res.render("auth/register", {
      title: "Registrarse",
      error: "No se pudo completar el registro",
      username,
      email,
    });
  } catch (error) {
    console.error("Error en el registro", error);
    res.render("auth/register", {
      title: "Registrarse",
      error: error.message || "Error al crear el usuario. Intenta de nuevo.",
      username,
      email,
    });
  }
};

exports.getLogout = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  res.render("auth/logout", {
    title: "Cerrar sesion",
  });
};

exports.postLogout = async (req, res) => {
  try {
    if (req.session.token) {
      await pool.query("UPDATE sesiones SET activa = false WHERE token = $1", [
        req.session.token,
      ]);
    }
  } catch (error) {
    console.error("Error al desactivar sesión:", error);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/auth/login?loggedout=true");
  });
};

exports.getSubirFoto = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, titulo, descripcion, ruta_archivo AS url, create_timestamp FROM publicaciones ORDER BY create_timestamp DESC LIMIT 24"
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
};

exports.postSubirFoto = async (req, res) => {
  try {
    if (!req.file) {
      req.flash("error_msg", "Selecciona una imagen");
      return res.redirect("/auth/subirFoto");
    }

    const titulo = (req.body.titulo || "").trim() || "Sin título";
    const descripcion = (req.body.descripcion || "").trim() || null;
    const etiquetas = parseEtiquetas(req.body.etiquetas);

    await Publicacion.create({
      titulo,
      descripcion,
      nombre_archivo: req.file.originalname,
      ruta_archivo: `/uploads/publicaciones/${req.file.filename}`,
      tipo_archivo: req.file.mimetype,
      tamaño_bytes: req.file.size,
      etiquetas,
      licencia: null,
      marca_agua: false,
      usuario_id: req.session.user.id,
    });

    req.flash("success_msg", "Publicación publicada");
    return res.redirect("/publicaciones");
  } catch (e) {
    console.error("Error al crear publicación:", e);
    req.flash("error_msg", "Error al publicar. Intenta de nuevo.");
    return res.redirect("/auth/subirFoto");
  }
};
