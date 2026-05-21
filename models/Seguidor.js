const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Seguidor = sequelize.define(
  "Seguidor",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "seguidores",
    timestamps: true,
    createdAt: "fecha",
    updatedAt: false,
  }
);

module.exports = Seguidor;
