const express = require('express');
const router = express.Router();
const {
  enviarCodigo,
  verificarCodigo,
  google,
} = require('../controllers/authController');

router.post('/enviarCodigo/:phone', enviarCodigo);

router.post('/verificarCodigo', verificarCodigo);

router.post('/google', google);

module.exports = router;
