const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Comentario = sequelize.define(
  "Comentario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "comentarios",
    timestamps: true,
    createdAt: "fecha",
    updatedAt: false,
  }
);

module.exports = Comentario;
