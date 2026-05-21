const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Guardado = sequelize.define(
  "Guardado",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "guardados",
    timestamps: true,
    createdAt: "fecha",
    updatedAt: false,
  }
);

module.exports = Guardado;
