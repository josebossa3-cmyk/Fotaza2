const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DenunciaComentario = sequelize.define(
  "DenunciaComentario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    motivo: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comentario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "denuncias_comentario",
    timestamps: true,
    createdAt: "fecha",
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["usuario_id", "comentario_id"],
      },
    ],
  }
);

module.exports = DenunciaComentario;
