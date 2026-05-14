const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fotoPerfil: { type: String },
    bio: { type: String, maxlength: 200 },
    seguidores: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    siguiendo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    guardados: [{ type: mongoose.Schema.Types.ObjectId, ref: "Publicacion" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
