const mongoose = require('mongoose');

// Esquema para las alertas de seguridad
const alertaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  tipo: {
    type: String,
    required: true,
    enum: ['traffic', 'natural', 'security'], // Solo permite estos tipos
    default: 'traffic'
  },
  severidad: {
    type: String,
    required: true,
    enum: ['baja', 'media', 'alta'], // Solo permite estos niveles
    default: 'media'
  },
  ubicacion: {
    type: {
      type: String,
      enum: ['Point'], // Especifica que es un punto geográfico
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // Longitud válida
                 coords[1] >= -90 && coords[1] <= 90;     // Latitud válida
        },
        message: 'Las coordenadas deben ser [longitud, latitud] válidas'
      }
    }
  },
  direccion: {
    type: String,
    trim: true,
    maxlength: 200
  },
  activa: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaVencimiento: {
    type: Date,
    default: function() {
      // Por defecto las alertas vencen en 24 horas
      const fecha = new Date();
      fecha.setHours(fecha.getHours() + 24);
      return fecha;
    }
  },
  usuarioCreador: {
    type: String, // UID del usuario de Firebase
    required: true
  },
  reportes: [{
    usuario: String,
    comentario: String,
    fecha: {
      type: Date,
      default: Date.now
    },
    tipo: {
      type: String,
      enum: ['confirmacion', 'actualizacion', 'resolucion'],
      default: 'confirmacion'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índice geoespacial para consultas de ubicación
alertaSchema.index({ ubicacion: '2dsphere' });

// Índice para consultas por tipo y severidad
alertaSchema.index({ tipo: 1, severidad: 1 });

// Índice para consultas por fecha
alertaSchema.index({ fechaCreacion: -1 });

// Índice para alertas activas
alertaSchema.index({ activa: 1 });

// Método para verificar si la alerta está vencida
alertaSchema.methods.estaVencida = function() {
  return this.fechaVencimiento < new Date();
};

// Método para obtener el tiempo restante en minutos
alertaSchema.methods.tiempoRestante = function() {
  const ahora = new Date();
  const diferencia = this.fechaVencimiento - ahora;
  return Math.max(0, Math.floor(diferencia / (1000 * 60))); // En minutos
};

// Método para agregar un reporte
alertaSchema.methods.agregarReporte = function(usuario, comentario, tipo = 'confirmacion') {
  this.reportes.push({
    usuario,
    comentario,
    tipo
  });
  return this.save();
};

// Método virtual para obtener el tiempo transcurrido
alertaSchema.virtual('tiempoTranscurrido').get(function() {
  const ahora = new Date();
  const diferencia = ahora - this.fechaCreacion;
  const minutos = Math.floor(diferencia / (1000 * 60));
  
  if (minutos < 60) {
    return `Hace ${minutos} min`;
  } else if (minutos < 1440) { // 24 horas
    const horas = Math.floor(minutos / 60);
    return `Hace ${horas}h`;
  } else {
    const dias = Math.floor(minutos / 1440);
    return `Hace ${dias}d`;
  }
});

// Middleware para marcar como inactivas las alertas vencidas
alertaSchema.pre('find', function() {
  // Actualizar alertas vencidas a inactivas
  this.model.updateMany(
    { 
      fechaVencimiento: { $lt: new Date() },
      activa: true 
    },
    { activa: false }
  ).exec();
});

alertaSchema.pre('findOne', function() {
  this.model.updateMany(
    { 
      fechaVencimiento: { $lt: new Date() },
      activa: true 
    },
    { activa: false }
  ).exec();
});

// Configurar opciones de JSON
alertaSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Alerta', alertaSchema);
