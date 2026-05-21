const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    contraseña: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    foto_perfil: {
      type: DataTypes.TEXT,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    rol: {
      type: DataTypes.STRING(20),
      defaultValue: "usuario",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "usuarios",
    timestamps: true,
    createdAt: "fecha_creacion", // mapear createdAt a fecha_creacion
    updatedAt: false, // la tabla original no tenia updatedAt
  }
);

module.exports = Usuario;
