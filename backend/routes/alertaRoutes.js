const express = require('express');
const router = express.Router();
const {
  obtenerAlertas,
  obtenerAlertaPorId,
  crearAlerta,
  actualizarAlerta,
  eliminarAlerta,
  agregarReporte,
  obtenerAlertasCercanas,
  obtenerEstadisticas
} = require('../controllers/alertaController');

// Middleware simple para validar que existe un usuario en los headers
const validarUsuario = (req, res, next) => {
  const userId = req.headers['user-id'] || req.body.usuarioCreador;
  if (!userId && req.method !== 'GET') {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  next();
};

// GET /api/alertas - Obtener todas las alertas (con filtros opcionales)
// Query params: tipo, severidad, activa, lat, lng, radio, limit, page
router.get('/', obtenerAlertas);

// GET /api/alertas/estadisticas - Obtener estadísticas de alertas
router.get('/estadisticas', obtenerEstadisticas);

// GET /api/alertas/cercanas - Obtener alertas cercanas a una ubicación
// Query params: lat, lng, radio (metros)
router.get('/cercanas', obtenerAlertasCercanas);

// GET /api/alertas/:id - Obtener una alerta específica por ID
router.get('/:id', obtenerAlertaPorId);

// POST /api/alertas - Crear una nueva alerta
// Body: { titulo, descripcion, tipo, severidad, coordenadas, direccion, fechaVencimiento, tags }
// Headers: user-id (Firebase UID)
router.post('/', validarUsuario, crearAlerta);

// PUT /api/alertas/:id - Actualizar una alerta existente
// Solo el creador puede actualizar la alerta
// Headers: user-id (Firebase UID)
router.put('/:id', validarUsuario, actualizarAlerta);

// DELETE /api/alertas/:id - Marcar una alerta como inactiva
// Solo el creador puede eliminar la alerta
// Headers: user-id (Firebase UID)
router.delete('/:id', validarUsuario, eliminarAlerta);

// POST /api/alertas/:id/reportes - Agregar un reporte a una alerta
// Body: { comentario, tipo }
// Headers: user-id (Firebase UID)
router.post('/:id/reportes', validarUsuario, agregarReporte);

module.exports = router;
