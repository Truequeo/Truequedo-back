const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

const {
  getUsuarios,
  createUsuario,
  getUsuarioById,
  updateUsuario,
  createRating,
} = require("../controllers/userController");


// Rutas
router.get("/getUser", getUsuarios);
router.get("/getUser/:id", getUsuarioById);
router.post("/createUser", upload.single("fotoperfil"), createUsuario);
router.put("/updateUser", upload.single("fotoperfil"), updateUsuario);
router.post("/createRating", createRating);

module.exports = router;
