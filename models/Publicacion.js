const pool = require("../db/poolconnect");

class Publicacion {
  // Obtener publicaciones de un usuario
  static async findByUsuario(usuario_id, limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT p.*,
      COALESCE(l.likes_count, 0) as likes_count,
      COALESCE(c.comentarios_count, 0) as comentarios_count
    FROM publicaciones p
    LEFT JOIN (
      SELECT publicacion_id, COUNT(*) as likes_count
      FROM likes
      GROUP BY publicacion_id
    ) l ON l.publicacion_id = p.id
    LEFT JOIN (
      SELECT publicacion_id, COUNT(*) as comentarios_count
      FROM comentarios
      GROUP BY publicacion_id
    ) c ON c.publicacion_id = p.id
    WHERE p.usuario_id = $1
    ORDER BY p.create_timestamp DESC
    LIMIT $2 OFFSET $3`,
      [usuario_id, limit, offset],
    );
    return result.rows;
  }

  // Obtener publicaciones guardadas de un usuario
  static async getGuardados(usuario_id) {
    const result = await pool.query(
      `SELECT p.*
      FROM guardados g
      JOIN publicaciones p ON p.id = g.publicacion_id
      WHERE g.usuario_id = $1
      ORDER BY g.fecha DESC`,
      [usuario_id],
    );
    return result.rows;
  }

  // Guardar publicación
  static async guardarPublicacion(usuario_id, publicacion_id) {
    try {
      await pool.query(
        "INSERT INTO guardados (usuario_id, publicacion_id) VALUES ($1, $2)",
        [usuario_id, publicacion_id],
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Crear publicación
  static async create(publicacion) {
    const {
      titulo,
      descripcion,
      nombre_archivo,
      ruta_archivo,
      tipo_archivo,
      tamaño_bytes,
      etiquetas,
      licencia,
      marca_agua,
      usuario_id,
    } = publicacion;
    const result = await pool.query(
      `INSERT INTO publicaciones 
        (titulo, descripcion, nombre_archivo, ruta_archivo, tipo_archivo, tamaño_bytes, etiquetas, licencia, marca_agua, usuario_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        titulo,
        descripcion,
        nombre_archivo,
        ruta_archivo,
        tipo_archivo,
        tamaño_bytes,
        etiquetas,
        licencia,
        marca_agua,
        usuario_id,
      ],
    );
    return result.rows[0];
  }
}

module.exports = Publicacion;
