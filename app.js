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

// Middleware
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

// Middleware del currentUser
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.unreadNotifications = 0;

  if (req.session.user) {
    try {
      const pool = require("./db/poolconnect");
      const result = await pool.query(
        "SELECT COUNT(*)::int AS count FROM notificaciones WHERE usuario_id = $1 AND leida = false",
        [req.session.user.id]
      );
      res.locals.unreadNotifications = result.rows[0].count;
    } catch (e) {
      // Si la tabla no existe todavía no rompe nada
    }
  }

  next();
});

// Después de la configuración de sesión
app.use(flash());

// Rutas
app.use("/auth", require("./routes/auth"));
app.use("/", require("./routes/index"));
app.use("/usuarios", usuarioRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render("404");
});

const inicializarAPP = async () => {
  try {
    const { createTable } = require("./db/initDB");
    await createTable();
    console.log("Base de datos inicializada");

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar la aplicacion:", error);
    process.exit(1);
  }
};

inicializarAPP();
