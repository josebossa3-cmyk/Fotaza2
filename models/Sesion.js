const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Sesion = sequelize.define(
  "Sesion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    fecha_expiracion: {
      type: DataTypes.DATE,
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // usuario_id se agregará en las asociaciones
  },
  {
    tableName: "sesiones",
    timestamps: false, // Las sesiones en tu tabla anterior solo tienen fecha_inicio
  }
);

module.exports = Sesion;
