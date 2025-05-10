require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Rutas
const authRoutes = require('./routes/auth');
const userRoute = require('./routes/user');
const articuloRoute = require('./routes/articulo');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use('/auth', authRoutes);
app.use('/user', userRoute);
app.use('/articulo', articuloRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
