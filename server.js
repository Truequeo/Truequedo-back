require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Rutas
const authRoutes = require('./routes/auth');
const userRoute = require('./routes/user');
const articuloRoute = require('./routes/articulo');
const chatRoute = require('./routes/chats');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 

// Rutas
app.use('/auth', authRoutes);
app.use('/user', userRoute);
app.use('/articulo', articuloRoute);
app.use('/chat', chatRoute);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
