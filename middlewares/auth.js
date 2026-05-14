const session = require('express-session');
const pool = require('../db/poolconnect');

const verificarToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no generado'
            });
        }

        const resultado = await pool.query(
            `SELECT u.id, u.nombre, u.email, s.fecha_expiracion
            FROM sesiones s
            JOIN usuarios u ON s.usuario_id = u.id
            WHERE s.token = $1 AND s.activa = true`,
            [token]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido'
            });
        }

        const sesion = resultado.rows[0];

        // verificar fechaExpiracion

        if (new Date(sesion.fecha_expiracion) < new Date()) {
            await pool.query(
                'UPDATE sesiones SET activa = false WHERE token = $1',
                [token]
            );

            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        req.usuario = {
            id: sesion.id,
            nombre: sesion.nombre,
            email: sesion.email
        };

        next();
    } catch (error) {
        console.error('Error al verificar token', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar autentificacion'
        });
    }
};

module.exports = { verificarToken };