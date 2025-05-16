const multer = require("multer");
const path = require("path");
const fs = require("fs");

const userUploadPath = path.join(__dirname, "../uploads/articulo");
if (!fs.existsSync(userUploadPath)) {
  fs.mkdirSync(userUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, userUploadPath); 
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const codusuario = req.body.codarticulo || "imagen_" + Date.now();
    const fileName = `${codusuario}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });
module.exports = upload;
