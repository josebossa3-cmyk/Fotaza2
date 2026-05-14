const pool = require('./poolconnect');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const generarToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const IniciarSesion = async (email, contraseña) => {

    if (!email || !contraseña) {
        return {
            success: false,
            message: "Email y contraseña son requeridos"
        };
    }

    if (!validarEmail(email)) {
        return {
            success: false,
            message: "Email no es válido"
        };
    }

    try {
        const resultado = await pool.query(
        "SELECT * FROM usuarios WHERE email = $1",
        [email]
        );

        if (resultado.rows.length === 0) {
            return {
                success: false,
                message: "Usuario no encontrado"
            };
        }

        const usuario = resultado.rows[0];

        const contraseñaValida = await bcrypt.compare(
        contraseña,
        usuario.contraseña
        );

        if (!contraseñaValida) {
            return {
                success: false,
                message: "Contraseña incorrecta"
            };
        }

        const token = generarToken();
        const fechaExpiracion = new Date();
        fechaExpiracion.setHours(fechaExpiracion.getHours() + 24);

        await pool.query(
          `INSERT INTO sesiones (usuario_id, token, fecha_expiracion)
            VALUES ($1, $2, $3)`,
            [usuario.id, token, fechaExpiracion]
        );

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
            }
        };
    } catch (error) {
        console.log('Error en inicio de sesion:', error);
        return {
            success: false,
            message: "Error al iniciar sesión"
        };
    }
};
module.exports = IniciarSesion;
