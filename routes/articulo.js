const express = require('express');
const router = express.Router();
const { upload, processImages } = require("../middlewares/uploadArticulo");

const { getArticulo, createArticulo, getArticuloById,updateArticulo, getArticuloRecomendado,getArticulosCercanos } = require('../controllers/articuloController');

// Rutas
router.get('/getArticulo/:codusuario', getArticulo);
router.get('/getArticuloRecomendado/:codarticulo', getArticuloRecomendado);
router.get('/getArticulo/:id', getArticuloById); 
router.put('/updateArticulo', updateArticulo);
router.get("/getArticuloCerca", getArticulosCercanos);
router.post(
  "/createArticulo",
  upload.array("fotoarticulo", 4), 
  processImages,                   
  createArticulo                   
);
module.exports = router;
