const express = require('express');
const router = express.Router();
const upload = require("../middlewares/uploadArticulo");

const { getArticulo, createArticulo, getArticuloById,updateArticulo, getArticuloRecomendado } = require('../controllers/articuloController');

// Rutas
router.get('/getArticulo/:codusuario', getArticulo);
router.get('/getArticuloRecomendado/:codarticulo', getArticuloRecomendado);
router.get('/getArticulo/:id', getArticuloById); 
router.put('/updateArticulo', updateArticulo);
router.post("/createArticulo", upload.single("fotoarticulo"), createArticulo);

module.exports = router;
