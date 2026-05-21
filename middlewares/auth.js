const { Sesion, Usuario } = require("../models");

const verificarToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no generado'
            });
        }

        const sesion = await Sesion.findOne({
            where: { token, activa: true },
            include: [{ model: Usuario }]
        });

        if (!sesion) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido'
            });
        }

        if (new Date(sesion.fecha_expiracion) < new Date()) {
            await Sesion.update({ activa: false }, { where: { token } });

            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        req.usuario = {
            id: sesion.Usuario.id,
            nombre: sesion.Usuario.nombre,
            email: sesion.Usuario.email
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