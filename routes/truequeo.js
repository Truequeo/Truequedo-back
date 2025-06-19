const express = require("express");
const router = express.Router();
const {
  modificarEstado,
} = require("../controllers/truequeoController");

router.post("/", modificarEstado);

module.exports = router;
