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

// Middleware 
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.unreadNotifications = 0;

  if (req.session.user) {
    try {
      const { Notificacion } = require("./models");
      const unreadCount = await Notificacion.count({
        where: { usuario_id: req.session.user.id, leida: false }
      });
      res.locals.unreadNotifications = unreadCount;
    } catch (e) {
      // Si la tabla no existe todavía no rompe nada
    }
  }

  next();
});


app.use(flash());

// Rutas
app.use("/auth", require("./routes/auth"));
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
