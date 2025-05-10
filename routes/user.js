const express = require('express');
const router = express.Router();
const { getUsuarios, createUsuario, getUsuarioById } = require('../controllers/userController');

// Rutas
router.get('/getUser', getUsuarios);
router.get('/getUser/:id', getUsuarioById); 
router.post('/createUser', createUsuario);

module.exports = router;
