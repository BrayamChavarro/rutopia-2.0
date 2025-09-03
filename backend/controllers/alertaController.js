const Alerta = require('../models/Alerta');

// Obtener todas las alertas activas
const obtenerAlertas = async (req, res) => {
  try {
    const { 
      tipo, 
      severidad, 
      activa = true, 
      lat, 
      lng, 
      radio = 50000, // Radio en metros (50km por defecto)
      limit = 100,
      page = 1 
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (tipo) {
      if (Array.isArray(tipo)) {
        filtros.tipo = { $in: tipo };
      } else {
        filtros.tipo = tipo;
      }
    }
    
    if (severidad) {
      if (Array.isArray(severidad)) {
        filtros.severidad = { $in: severidad };
      } else {
        filtros.severidad = severidad;
      }
    }

    if (activa !== undefined) {
      filtros.activa = activa === 'true';
    }

    // Filtro geográfico si se proporcionan coordenadas
    if (lat && lng) {
      filtros.ubicacion = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radio)
        }
      };
    }

    const alertas = await Alerta.find(filtros)
      .sort({ fechaCreacion: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Alerta.countDocuments(filtros);

    res.json({
      alertas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Obtener una alerta por ID
const obtenerAlertaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const alerta = await Alerta.findById(id);
    
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json(alerta);
  } catch (error) {
    console.error('Error al obtener alerta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Crear una nueva alerta
const crearAlerta = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      tipo,
      severidad,
      coordenadas, // [lng, lat]
      direccion,
      fechaVencimiento,
      tags
    } = req.body;

    // Validar datos requeridos
    if (!titulo || !descripcion || !coordenadas || !Array.isArray(coordenadas) || coordenadas.length !== 2) {
      return res.status(400).json({ 
        error: 'Datos inválidos. Se requieren titulo, descripcion y coordenadas [lng, lat]' 
      });
    }

    // Obtener usuario desde el header de autenticación (Firebase UID)
    const usuarioCreador = req.headers['user-id'] || req.body.usuarioCreador;
    
    if (!usuarioCreador) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const nuevaAlerta = new Alerta({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      tipo: tipo || 'traffic',
      severidad: severidad || 'media',
      ubicacion: {
        type: 'Point',
        coordinates: [parseFloat(coordenadas[0]), parseFloat(coordenadas[1])]
      },
      direccion: direccion?.trim(),
      usuarioCreador,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
      tags: tags || []
    });

    const alertaGuardada = await nuevaAlerta.save();
    
    res.status(201).json(alertaGuardada);
  } catch (error) {
    console.error('Error al crear alerta:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Datos de validación incorrectos',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Actualizar una alerta
const actualizarAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizaciones = req.body;
    const usuarioId = req.headers['user-id'];

    const alerta = await Alerta.findById(id);
    
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    // Verificar que el usuario es el creador de la alerta
    if (alerta.usuarioCreador !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permisos para editar esta alerta' });
    }

    // Si se actualizan las coordenadas, restructurar el objeto ubicacion
    if (actualizaciones.coordenadas) {
      actualizaciones.ubicacion = {
        type: 'Point',
        coordinates: [
          parseFloat(actualizaciones.coordenadas[0]), 
          parseFloat(actualizaciones.coordenadas[1])
        ]
      };
      delete actualizaciones.coordenadas;
    }

    const alertaActualizada = await Alerta.findByIdAndUpdate(
      id,
      actualizaciones,
      { new: true, runValidators: true }
    );

    res.json(alertaActualizada);
  } catch (error) {
    console.error('Error al actualizar alerta:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Datos de validación incorrectos',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Eliminar una alerta (marcar como inactiva)
const eliminarAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.headers['user-id'];

    const alerta = await Alerta.findById(id);
    
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    // Verificar que el usuario es el creador de la alerta
    if (alerta.usuarioCreador !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta alerta' });
    }

    // Marcar como inactiva en lugar de eliminar
    alerta.activa = false;
    await alerta.save();

    res.json({ mensaje: 'Alerta marcada como inactiva correctamente' });
  } catch (error) {
    console.error('Error al eliminar alerta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Agregar un reporte a una alerta
const agregarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, tipo = 'confirmacion' } = req.body;
    const usuarioId = req.headers['user-id'];

    if (!comentario || !usuarioId) {
      return res.status(400).json({ error: 'Se requiere comentario y usuario' });
    }

    const alerta = await Alerta.findById(id);
    
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    await alerta.agregarReporte(usuarioId, comentario.trim(), tipo);

    res.json({ mensaje: 'Reporte agregado correctamente', alerta });
  } catch (error) {
    console.error('Error al agregar reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Obtener alertas cercanas a una ubicación
const obtenerAlertasCercanas = async (req, res) => {
  try {
    const { lat, lng, radio = 5000 } = req.query; // Radio en metros

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Se requieren coordenadas lat y lng' });
    }

    const alertas = await Alerta.find({
      activa: true,
      ubicacion: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radio)
        }
      }
    }).sort({ fechaCreacion: -1 }).limit(50);

    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas cercanas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Obtener estadísticas de alertas
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Alerta.aggregate([
      { $match: { activa: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          porTipo: {
            $push: {
              tipo: '$tipo',
              severidad: '$severidad'
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          traffic: {
            $size: {
              $filter: {
                input: '$porTipo',
                cond: { $eq: ['$$this.tipo', 'traffic'] }
              }
            }
          },
          natural: {
            $size: {
              $filter: {
                input: '$porTipo',
                cond: { $eq: ['$$this.tipo', 'natural'] }
              }
            }
          },
          security: {
            $size: {
              $filter: {
                input: '$porTipo',
                cond: { $eq: ['$$this.tipo', 'security'] }
              }
            }
          },
          alta: {
            $size: {
              $filter: {
                input: '$porTipo',
                cond: { $eq: ['$$this.severidad', 'alta'] }
              }
            }
          },
          media: {
            $size: {
              $filter: {
                input: '$porTipo',
                cond: { $eq: ['$$this.severidad', 'media'] }
              }
            }
          },
          baja: {
            $size: {
              $filter: {
                input: '$porTipo',
                cond: { $eq: ['$$this.severidad', 'baja'] }
              }
            }
          }
        }
      }
    ]);

    res.json(estadisticas[0] || {
      total: 0,
      traffic: 0,
      natural: 0,
      security: 0,
      alta: 0,
      media: 0,
      baja: 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

module.exports = {
  obtenerAlertas,
  obtenerAlertaPorId,
  crearAlerta,
  actualizarAlerta,
  eliminarAlerta,
  agregarReporte,
  obtenerAlertasCercanas,
  obtenerEstadisticas
};
