const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Valoracion = sequelize.define(
  "Valoracion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    puntaje: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },
  {
    tableName: "valoraciones",
    timestamps: true,
    createdAt: "fecha",
    updatedAt: false,
  }
);

module.exports = Valoracion;
