require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const usuarioRoutes = require("./routes/usuarios");
const flash = require("express-flash");

const app = express();

// Configuración de vistas (Pug)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tu-clave-secreta",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

// sesión y notificaciones
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.unreadNotifications = 0;

  if (req.session.user) {
    const { Usuario, Notificacion } = require("./models");
    let dbUser;
    try {
      dbUser = await Usuario.findByPk(req.session.user.id, {
        attributes: ["id", "nombre", "email", "rol", "activo", "foto_perfil"],
      });
    } catch (error) {
      console.error("Error al verificar la sesion:", error);
      return res.status(503).send("No se pudo verificar el estado de la cuenta. Intenta nuevamente.");
    }

    if (!dbUser || !dbUser.activo) {
      return req.session.destroy(() => {
        res.locals.currentUser = null;
        res.clearCookie("connect.sid");
        res.redirect("/auth/login?error=inactiva");
      });
    }

    req.session.user.rol = dbUser.rol;
    req.session.user.nombre = dbUser.nombre;
    req.session.user.foto_perfil = dbUser.foto_perfil;
    req.session.user.activo = dbUser.activo;
    res.locals.currentUser = req.session.user;

    try {
      res.locals.unreadNotifications = await Notificacion.count({
        where: { usuario_id: req.session.user.id, leida: false },
      });
    } catch (error) {
      console.error("Error al cargar el contador de notificaciones:", error);
    }
  }

  next();
});

app.use(flash());

// Rutas
app.use("/auth", require("./routes/auth"));
app.use("/validador", require("./routes/validador"));
app.use("/", require("./routes/index"));
app.use("/usuarios", usuarioRoutes);


app.use((req, res) => {
  res.status(404).render("404");
});

const inicializarAPP = async () => {
  try {
    const { sequelize } = require("./models");
    await sequelize.sync({ alter: true });
    console.log("Base de datos sincronizada ");

    const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar la aplicacion:", error);
    process.exit(1);
  }
};

inicializarAPP();
