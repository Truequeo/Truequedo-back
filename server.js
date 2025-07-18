require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

// Rutas
const authRoutes = require('./routes/auth');
const userRoute = require('./routes/user');
const articuloRoute = require('./routes/articulo');
const chatRoute = require('./routes/chats');
const matchRoute = require('./routes/truequeo');

// Socket.IO
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
initSocket(server); // Inicializa Socket.IO

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);
app.use('/user', userRoute);
app.use('/articulo', articuloRoute);
app.use('/chat', chatRoute);
app.use('/match', matchRoute);
app.use('/uploads', express.static('uploads'));

server.listen(3000, () => {
  console.log("🚀 Servidor escuchando en el puerto 3000");
});
