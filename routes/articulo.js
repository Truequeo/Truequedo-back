const express = require('express');
const router = express.Router();
const { getArticulo, createArticulo, getArticuloById } = require('../controllers/articuloController');

// Rutas
router.get('/getArticulo', getArticulo);
router.get('/getArticulo/:id', getArticuloById); 
router.post('/createArticulo', createArticulo);

module.exports = router;
