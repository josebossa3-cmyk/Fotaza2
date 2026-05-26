const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Like = sequelize.define(
  "Like",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "likes",
    timestamps: true,
    createdAt: "fecha",
    updatedAt: false,
  }
);

module.exports = Like;
