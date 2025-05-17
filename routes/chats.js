const express = require("express");
const router = express.Router();
const {
  obtenerMensajes,
  enviarChat,obtenerChats
} = require("../controllers/chatController");

router.post("/mensajes", enviarChat);
router.get("/mensajes/:codarticulo/:codusuario1/:codusuario2", obtenerMensajes);
router.get("/mensajes/:codusuario", obtenerChats);

module.exports = router;
