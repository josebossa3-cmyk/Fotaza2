const pool = require("./poolconnect");
const bcrypt = require("bcryptjs");

// Función para crear una nueva cuenta de usuario

const crearUsuario = async (nombre, email, contraseña) => {
  if (!nombre || !email || !contraseña) {
    throw new Error("Todos los campos son requeridos");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Email no valido");
  }

  try {
    // acá reviso si el mail ya existe
    const emailExistente = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email],
    );

    if (emailExistente.rows.length > 0) {
      throw new Error("El email ya está registrado");
    }

    // hasheamos la contra
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const resultado = await pool.query(
      "INSERT INTO usuarios (nombre, email, contraseña) VALUES ($1,$2,$3) RETURNING *",
      [nombre, email, hashedPassword],
    );

    return {
      success: true,
      message: "Usuario creado",
      usuario: resultado.rows[0],
    };
  } catch (error) {
    throw error;
  }
};

// Exportar las funciones para su uso en otras partes
module.exports = { crearUsuario };
