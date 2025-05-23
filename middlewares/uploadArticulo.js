const multer = require("multer");
const path = require("path");
const fs = require("fs");

const userUploadPath = path.join(__dirname, "../uploads/articulo");
if (!fs.existsSync(userUploadPath)) {
  fs.mkdirSync(userUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const codarticulo = req.body.codarticulo || "temp";
    const dir = path.join(__dirname, "../uploads/articulo", codarticulo);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const index = req.fileIndex || 0;
    req.fileIndex = index + 1; 
    const ext = path.extname(file.originalname);
    cb(null, `${req.fileIndex}${ext}`);
  },
});

const upload = multer({ storage });
module.exports = upload;
