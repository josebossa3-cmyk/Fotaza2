require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, Usuario } = require("../models");

const inicializar = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Tablas creadas/sincronizadas correctamente");


    const usuariosPrueba = [
      {
        nombre: "Usuario Test",
        email: "prueba123@gmail.com",
        contraseña: await bcrypt.hash("admin1234", 10),
        rol: "usuario",
        activo: true,
      },
      {
        nombre: "Validador Test",
        email: "prueba1234@gmail.com",
        contraseña: await bcrypt.hash("admin1234", 10),
        rol: "validador",
        activo: true,
      },
    ];

    for (const datos of usuariosPrueba) {
      const [usuario, creado] = await Usuario.findOrCreate({
        where: { email: datos.email },
        defaults: datos,
      });
      if (creado) {
        console.log(`Usuario creado: ${datos.email}`);
      } else {
        console.log(`Usuario ya existe: ${datos.email}`);
      }
    }

    console.log("Base de datos inicializada correctamente");
    console.log("\nUsuarios de prueba:");
    console.log("  Usuario:    prueba123@gmail.com  / admin1234");
    console.log("  Validador:  prueba1234@gmail.com / admin1234");
    process.exit(0);
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    process.exit(1);
  }
};

inicializar();  