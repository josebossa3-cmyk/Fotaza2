const { Sesion, Usuario } = require("../models");

// verifica que el usuario esté autenticado mediante sesión
const ensureAuthenticated = async (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash("error_msg", "Debes iniciar sesión para acceder a esta página.");
        return res.redirect("/auth/login");
    }

    try {
        // Verificar en la BD que la cuenta siga activa
        const usuario = await Usuario.findByPk(req.session.user.id, {
            attributes: ["id", "activo", "rol"]
        });

        if (!usuario || !usuario.activo) {
            req.session.destroy(() => {
                res.clearCookie("connect.sid");
                return res.redirect("/auth/login?error=inactiva");
            });
            return;
        }

        
        req.session.user.rol = usuario.rol;
        next();
    } catch (error) {
        console.error("Error al verificar estado de usuario:", error);
        next();
    }
};

// restringir a usuarios ya logueados 
const ensureGuest = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect("/");
    }
    next();
};

const ensureRole = (rolRequerido) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            req.flash("error_msg", "Debes iniciar sesión.");
            return res.redirect("/auth/login");
        }
        if (req.session.user.rol !== rolRequerido) {
            req.flash("error_msg", "No tienes permisos para acceder a esta sección.");
            return res.redirect("/");
        }
        next();
    };
};

// verificar token Bearer (API)
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

        if (!sesion.Usuario || !sesion.Usuario.activo) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta inactiva'
            });
        }

        req.usuario = {
            id: sesion.Usuario.id,
            nombre: sesion.Usuario.nombre,
            email: sesion.Usuario.email,
            rol: sesion.Usuario.rol
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

module.exports = {
    ensureAuthenticated,
    ensureGuest,
    ensureRole,
    verificarToken
};
