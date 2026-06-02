const multer = require("multer");


const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  cb(null, allowedMimes.includes(file.mimetype));
};

const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

const uploadPerfil = multer({ storage, limits, fileFilter: imageFilter });
const uploadPublicacion = multer({ storage, limits, fileFilter: imageFilter });

module.exports = { uploadPerfil, uploadPublicacion };
