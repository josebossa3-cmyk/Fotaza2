const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DenunciaPublicacion = sequelize.define(
  "DenunciaPublicacion",
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
    publicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "denuncias_publicacion",
    timestamps: true,
    createdAt: "fecha",
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["usuario_id", "publicacion_id"],
      },
    ],
  }
);

module.exports = DenunciaPublicacion;
