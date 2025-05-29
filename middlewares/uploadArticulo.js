const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const storage = multer.memoryStorage(); 

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes"));
    }
  },
});

const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  const codarticulo = req.body.codarticulo || "temp";
  const dir = path.join(__dirname, "../uploads/articulo", codarticulo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const outputPath = path.join(dir, `${i + 1}.jpeg`);
      await sharp(file.buffer)
        .jpeg({ quality: 90 })
        .toFile(outputPath);
    }

    req.savedImagePaths = req.files.map((_, i) =>
      path.join("uploads/articulo", codarticulo, `${i + 1}.jpeg`)
    );

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  processImages,
};
