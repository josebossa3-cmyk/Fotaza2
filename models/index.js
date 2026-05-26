const sequelize = require("../config/database");

const Usuario = require("./Usuario");
const Publicacion = require("./Publicacion");
const Comentario = require("./Comentario");
const Notificacion = require("./Notificacion");
const Valoracion = require("./Valoracion");
const Guardado = require("./Guardado");
const Seguidor = require("./Seguidor");
const Like = require("./Like");

// Relaciones Usuario - Publicacion
Usuario.hasMany(Publicacion, { foreignKey: "usuario_id", as: "publicaciones" });
Publicacion.belongsTo(Usuario, { foreignKey: "usuario_id", as: "autor" });

// Relaciones Usuario - Comentario
Usuario.hasMany(Comentario, { foreignKey: "usuario_id", as: "comentarios" });
Comentario.belongsTo(Usuario, { foreignKey: "usuario_id", as: "autor" });

// Relaciones Publicacion - Comentario
Publicacion.hasMany(Comentario, { foreignKey: "publicacion_id", as: "comentarios" });
Comentario.belongsTo(Publicacion, { foreignKey: "publicacion_id", as: "publicacion" });

// Relaciones Usuario - Notificacion
Usuario.hasMany(Notificacion, { foreignKey: "usuario_id", as: "notificaciones" });
Notificacion.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
Notificacion.belongsTo(Usuario, { foreignKey: "actor_id", as: "actor" }); 

// Relaciones Valoracion
Usuario.hasMany(Valoracion, { foreignKey: "usuario_id" });
Valoracion.belongsTo(Usuario, { foreignKey: "usuario_id" });
Publicacion.hasMany(Valoracion, { foreignKey: "publicacion_id", as: "valoraciones" });
Valoracion.belongsTo(Publicacion, { foreignKey: "publicacion_id" });

// Relaciones Guardado
Usuario.hasMany(Guardado, { foreignKey: "usuario_id" });
Guardado.belongsTo(Usuario, { foreignKey: "usuario_id" });
Publicacion.hasMany(Guardado, { foreignKey: "publicacion_id", as: "guardados" });
Guardado.belongsTo(Publicacion, { foreignKey: "publicacion_id" });

// Relaciones Like
Usuario.hasMany(Like, { foreignKey: "usuario_id" });
Like.belongsTo(Usuario, { foreignKey: "usuario_id" });
Publicacion.hasMany(Like, { foreignKey: "publicacion_id", as: "likes" });
Like.belongsTo(Publicacion, { foreignKey: "publicacion_id" });

// Relaciones Seguidores (Muchos a Muchos sobre la misma tabla Usuario)
Usuario.belongsToMany(Usuario, {
  through: Seguidor,
  as: "siguiendo",
  foreignKey: "seguidor_id",
  otherKey: "seguido_id",
});
Usuario.belongsToMany(Usuario, {
  through: Seguidor,
  as: "seguidores",
  foreignKey: "seguido_id",
  otherKey: "seguidor_id",
});

const Sesion = require("./Sesion");

// Relaciones Sesion
Usuario.hasMany(Sesion, { foreignKey: "usuario_id" });
Sesion.belongsTo(Usuario, { foreignKey: "usuario_id" });

module.exports = {
  sequelize,
  Usuario,
  Publicacion,
  Comentario,
  Notificacion,
  Valoracion,
  Guardado,
  Seguidor,
  Sesion,
  Like,
};
