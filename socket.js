// socket.js
let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Nuevo cliente conectado");

    socket.on("enviarMensaje", (mensaje) => {
      console.log("📤 Mensaje recibido del cliente:", mensaje);
      io.emit("nuevoMensaje", mensaje);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Cliente desconectado");
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado.");
  }
  return io;
};

module.exports = { initSocket, getIO };
