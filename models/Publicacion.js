const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Publicacion = sequelize.define(
  "Publicacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
    },
    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ruta_archivo: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    tipo_archivo: {
      type: DataTypes.STRING(50),
    },
    tamaño_bytes: {
      type: DataTypes.BIGINT,
    },
    etiquetas: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
    },
    licencia: {
      type: DataTypes.STRING(20),
      defaultValue: "libre",
    },
    marca_agua: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    texto_marca: {
      type: DataTypes.STRING(100),
    },
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: "activa",
    },
    comentarios_abiertos: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // usuario_id será agregado por las asociaciones en index.js
  },
  {
    tableName: "publicaciones",
    timestamps: true,
    createdAt: "create_timestamp",
    updatedAt: false,
  }
);

module.exports = Publicacion;
