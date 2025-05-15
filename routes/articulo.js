const express = require('express');
const router = express.Router();
const { getArticulo, createArticulo, getArticuloById,updateArticulo } = require('../controllers/articuloController');

// Rutas
router.get('/getArticulo', getArticulo);
router.get('/getArticulo/:id', getArticuloById); 
router.post('/createArticulo', createArticulo);
router.put('/updateArticulo', updateArticulo);

module.exports = router;
