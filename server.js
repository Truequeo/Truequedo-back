require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Server } = require("socket.io");
const http = require("http");

// Rutas
const authRoutes = require('./routes/auth');
const userRoute = require('./routes/user');
const articuloRoute = require('./routes/articulo');
const chatRoute = require('./routes/chats');
const matchRoute = require('./routes/truequeo')
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 
const server = http.createServer(app);

// Rutas
app.use('/auth', authRoutes);
app.use('/user', userRoute);
app.use('/articulo', articuloRoute);
app.use('/chat', chatRoute);
app.use('/match', matchRoute);
app.use("/uploads", express.static("uploads"));

const io = new Server(server, {
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

server.listen(3000, () => {
  console.log("🚀 Servidor escuchando en el puerto 3000");
});