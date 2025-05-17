const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participantes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuario", // Referencia a usuarios
    },
  ],
  articulo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "articulo", // Referencia al artículo sobre el cual se habla
  },
  mensajes: [
    {
      remitente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usuario",
      },
      texto: String,
      fecha: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Chat", chatSchema);
