const { Usuario } = require("../models");
const bcrypt = require("bcryptjs");

const crearUsuario = async (nombre, email, contraseña) => {
  if (!nombre || !email || !contraseña) {
    throw new Error("Todos los campos son requeridos");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Email no valido");
  }

  try {
    const emailExistente = await Usuario.findOne({ where: { email } });

    if (emailExistente) {
      throw new Error("El email ya está registrado");
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      contraseña: hashedPassword,
    });

    return {
      success: true,
      message: "Usuario creado",
      usuario: nuevoUsuario,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { crearUsuario };
