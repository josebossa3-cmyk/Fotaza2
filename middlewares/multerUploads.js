const fs = require("fs");
const path = require("path");
const multer = require("multer");

const publicRoot = path.join(__dirname, "..", "public");
const perfilDir = path.join(publicRoot, "uploads", "perfiles");
const publicacionDir = path.join(publicRoot, "uploads", "publicaciones");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(perfilDir);
ensureDir(publicacionDir);

const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes"));
  }
};

const storagePerfil = multer.diskStorage({
  destination: (req, file, cb) => cb(null, perfilDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const storagePublicacion = multer.diskStorage({
  destination: (req, file, cb) => cb(null, publicacionDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const limits = { fileSize: 10 * 1024 * 1024 };

const uploadPerfil = multer({
  storage: storagePerfil,
  limits,
  fileFilter: imageFilter,
});

const uploadPublicacion = multer({
  storage: storagePublicacion,
  limits,
  fileFilter: imageFilter,
});

module.exports = { uploadPerfil, uploadPublicacion };
