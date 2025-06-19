const express = require("express");
const router = express.Router();
const {
  obtenerMensajes,
  enviarChat,obtenerChats,
  marcarComoLeido
} = require("../controllers/chatController");

router.post("/mensajes", enviarChat);
router.get("/mensajes/:codarticulo1/:codarticulo2/:codusuario1/:codusuario2", obtenerMensajes);
router.get("/mensajes/:codusuario", obtenerChats);
router.post("/mensajes/leido", marcarComoLeido);

module.exports = router;
