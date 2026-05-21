const { Usuario, Sesion } = require("../models");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const generarToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const IniciarSesion = async (email, contraseña) => {
  if (!email || !contraseña) {
    return {
      success: false,
      message: "Email y contraseña son requeridos",
    };
  }

  if (!validarEmail(email)) {
    return {
      success: false,
      message: "Email no es válido",
    };
  }

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return {
        success: false,
        message: "Usuario no encontrado",
      };
    }

    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!contraseñaValida) {
      return {
        success: false,
        message: "Contraseña incorrecta",
      };
    }

    const token = generarToken();
    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);

    await Sesion.create({
      usuario_id: usuario.id,
      token,
      fecha_expiracion: fechaExpiracion,
    });

    return {
      success: true,
      message: "Sesión iniciada correctamente",
      token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        foto_perfil: usuario.foto_perfil || null,
        bio: usuario.bio || null,
      },
    };
  } catch (error) {
    console.log("Error en inicio de sesion:", error);
    return {
      success: false,
      message: "Error al iniciar sesión",
    };
  }
};
module.exports = IniciarSesion;
