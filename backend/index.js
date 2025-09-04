// Importación de módulos necesarios
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const express = require('express'); // Framework web para Node.js
const mongoose = require('mongoose'); // ODM para MongoDB
const cors = require('cors'); // Middleware para habilitar CORS

// Importar rutas
const alertaRoutes = require('./routes/alertaRoutes'); // Rutas para alertas

// Creación de la aplicación Express
const app = express();

// Middlewares
app.use(cors()); // Habilita CORS para permitir solicitudes desde diferentes dominios
app.use(express.json()); // Habilita el parseo de JSON en las solicitudes entrantes

// Conexión a la base de datos MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rutopia')
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Rutas
app.use('/api/alertas', alertaRoutes); // Define las rutas bajo el prefijo /api/alertas

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Puerto en el que se ejecutará el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📍 API disponible en: http://localhost:${PORT}/api`);
});
