const pool = require("../db/poolconnect");

class Usuario {
  // Buscar usuario por ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT u.*, 
        COALESCE(s.seguidores_count, 0) as seguidores_count,
        COALESCE(sig.siguiendo_count, 0) as siguiendo_count
      FROM usuarios u
      LEFT JOIN (
        SELECT seguido_id, COUNT(*) as seguidores_count
        FROM seguidores
        GROUP BY seguido_id
      ) s ON s.seguido_id = u.id
      LEFT JOIN (
        SELECT seguidor_id, COUNT(*) as siguiendo_count
        FROM seguidores
        GROUP BY seguidor_id
      ) sig ON sig.seguidor_id = u.id
      WHERE u.id = $1`,
      [id],
    );
    return result.rows[0];
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }

  // Buscar usuario por nombre
  static async findByNombre(nombre) {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE nombre = $1",
      [nombre],
    );
    return result.rows[0];
  }

  // Crear usuario
  static async create({ nombre, email, contraseña }) {
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, contraseña) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [nombre, email, contraseña],
    );
    return result.rows[0];
  }

  // Actualizar perfil
  static async update(id, { nombre, bio, foto_perfil }) {
    const result = await pool.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre),
           bio = COALESCE($2, bio),
           foto_perfil = COALESCE($3, foto_perfil)
       WHERE id = $4
       RETURNING *`,
      [nombre, bio, foto_perfil, id],
    );
    return result.rows[0];
  }

  // Verificar si un usuario sigue a otro
  static async isSiguiendo(seguidor_id, seguido_id) {
    const result = await pool.query(
      "SELECT * FROM seguidores WHERE seguidor_id = $1 AND seguido_id = $2",
      [seguidor_id, seguido_id],
    );
    return result.rows.length > 0;
  }

  // Seguir usuario
  static async seguir(seguidor_id, seguido_id) {
    try {
      await pool.query(
        "INSERT INTO seguidores (seguidor_id, seguido_id) VALUES ($1, $2)",
        [seguidor_id, seguido_id],
      );
      return true;
    } catch (error) {
      if (error.code === "23505") return false; // Ya existe
      throw error;
    }
  }

  // Dejar de seguir
  static async dejarSeguir(seguidor_id, seguido_id) {
    await pool.query(
      "DELETE FROM seguidores WHERE seguidor_id = $1 AND seguido_id = $2",
      [seguidor_id, seguido_id],
    );
    return true;
  }

  // Obtener seguidores de un usuario
  static async getSeguidores(usuario_id) {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.foto_perfil
       FROM seguidores s
       JOIN usuarios u ON u.id = s.seguidor_id
       WHERE s.seguido_id = $1`,
      [usuario_id],
    );
    return result.rows;
  }

  // Obtener usuarios que sigue un usuario
  static async getSiguiendo(usuario_id) {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.foto_perfil
       FROM seguidores s
       JOIN usuarios u ON u.id = s.seguido_id
       WHERE s.seguidor_id = $1`,
      [usuario_id],
    );
    return result.rows;
  }
}

module.exports = Usuario;
