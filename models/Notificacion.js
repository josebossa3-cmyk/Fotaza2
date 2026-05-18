const pool = require("../db/poolconnect");

class Notificacion {

  // Crear una notificación
  static async crear(usuarioId, tipo, actorId, referenciaId = null) {
    // No notificar si el actor es el mismo usuario
    if (usuarioId === actorId) return;

    try {
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, actor_id, referencia_id)
         VALUES ($1, $2, $3, $4)`,
        [usuarioId, tipo, actorId, referenciaId]
      );
    } catch (err) {
      console.error("Error al crear notificación:", err);
    }
  }

  // Obtener notificaciones de un usuario
  static async getByUsuario(usuarioId) {
    const result = await pool.query(
      `SELECT n.*, 
              u.nombre AS actor_nombre,
              u.foto_perfil AS actor_foto
       FROM notificaciones n
       LEFT JOIN usuarios u ON u.id = n.actor_id
       WHERE n.usuario_id = $1
       ORDER BY n.fecha DESC
       LIMIT 50`,
      [usuarioId]
    );
    return result.rows;
  }

  // Marcar una notificación como leída
  static async marcarLeida(notifId, usuarioId) {
    await pool.query(
      `UPDATE notificaciones SET leida = true 
       WHERE id = $1 AND usuario_id = $2`,
      [notifId, usuarioId]
    );
  }

  // Marcar todas como leídas
  static async marcarTodasLeidas(usuarioId) {
    await pool.query(
      "UPDATE notificaciones SET leida = true WHERE usuario_id = $1",
      [usuarioId]
    );
  }
}

module.exports = Notificacion;