const { Usuario, Publicacion, Notificacion, Seguidor, Guardado } = require("../models");
const { Op } = require("sequelize");

exports.getEditar = (req, res) => {
  res.render("usuarios/editar", {
    title: "Editar Perfil",
    currentUser: req.session.user,
  });
};

exports.postEditar = async (req, res) => {
  try {
    const { nombre, bio } = req.body;
    const usuarioId = req.session.user.id;

    let foto_perfil = req.session.user.foto_perfil;
    if (req.file) {
      foto_perfil = `/uploads/perfiles/${req.file.filename}`;
    }

    await Usuario.update(
      { nombre, bio, foto_perfil },
      { where: { id: usuarioId } }
    );

    const usuarioActualizado = await Usuario.findByPk(usuarioId, { raw: true });

    req.session.user = { ...req.session.user, ...usuarioActualizado };
    req.session.save((err) => {
      if (err) console.error(err);
      res.redirect(`/usuarios/${usuarioId}`);
    });
  } catch (error) {
    console.error(error);
    res.render("usuarios/editar", {
      title: "Editar Perfil",
      currentUser: req.session.user,
      error: "Error al actualizar el perfil",
    });
  }
};

exports.verPerfil = async (req, res) => {
  try {
    const usuarioModel = await Usuario.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: "seguidores", attributes: ["id"], through: { attributes: [] } },
        { model: Usuario, as: "siguiendo", attributes: ["id"], through: { attributes: [] } },
      ],
    });

    if (!usuarioModel) {
      req.flash("error_msg", "Usuario no encontrado");
      return res.redirect("/");
    }

    const usuario = usuarioModel.get({ plain: true });
    usuario.seguidores_count = usuario.seguidores.length;
    usuario.siguiendo_count = usuario.siguiendo.length;

    // Obtener publicaciones del usuario
    const currentUserId = req.session.user ? req.session.user.id : -1;
    
    const publicaciones = await Publicacion.findAll({
      where: { usuario_id: usuario.id },
      order: [["create_timestamp", "DESC"]],
      raw: true
    });

    // Verificar si el usuario actual sigue a este usuario
    let siguiendo = false;
    if (req.session.user) {
      const existeSeguidor = await Seguidor.findOne({
        where: { seguidor_id: req.session.user.id, seguido_id: usuario.id }
      });
      siguiendo = !!existeSeguidor;
    }

    // Obtener publicaciones guardadas
    let guardados = [];
    if (req.session.user && req.session.user.id === usuario.id) {
      const guardadosModel = await Guardado.findAll({
        where: { usuario_id: req.session.user.id },
        include: [{ model: Publicacion }]
      });
      guardados = guardadosModel.map(g => g.Publicacion);
    }

    res.render("usuarios/perfil", {
      title: `Perfil de ${usuario.nombre}`,
      usuario,
      publicaciones,
      guardados,
      siguiendo,
      currentUser: req.session.user,
    });
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Error al cargar el perfil");
    res.redirect("/");
  }
};

exports.seguir = async (req, res) => {
  try {
    const seguidorId = req.session.user.id;
    const seguidoId = parseInt(req.params.id, 10);
    if (seguidorId === seguidoId) {
      return res.status(400).json({ success: false, message: "No válido" });
    }
    
    const [seguidor, created] = await Seguidor.findOrCreate({
      where: { seguidor_id: seguidorId, seguido_id: seguidoId }
    });

    if (created) {
      await Notificacion.create({
        usuario_id: seguidoId,
        actor_id: seguidorId,
        tipo: 'nuevo_seguidor',
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al seguir usuario" });
  }
};

exports.dejarSeguir = async (req, res) => {
  try {
    const seguidorId = req.session.user.id;
    const seguidoId = parseInt(req.params.id, 10);
    
    await Seguidor.destroy({
      where: { seguidor_id: seguidorId, seguido_id: seguidoId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al dejar de seguir" });
  }
};

exports.buscarUsuarios = async (req, res) => {
  try {
    const query = req.query.q || '';
    let usuarios = [];
    if (query) {
      usuarios = await Usuario.findAll({
        where: {
          nombre: { [Op.iLike]: `%${query}%` }
        },
        attributes: ['id', 'nombre', 'foto_perfil', 'bio'],
        raw: true
      });
    }
    res.render("usuarios/buscar", {
      title: "Buscar Usuarios",
      query,
      usuarios,
      currentUser: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.render("usuarios/buscar", {
      title: "Buscar Usuarios",
      query: req.query.q || '',
      usuarios: [],
      error: "Error al buscar usuarios",
      currentUser: req.session.user,
    });
  }
};
