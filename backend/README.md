# Rutopia Backend API

API REST para el sistema de alertas y gestión de viajes de Rutopia.

## 🚀 Características

- **Gestión de Alertas**: CRUD completo para alertas de seguridad, tráfico y fenómenos naturales
- **Geolocalización**: Búsqueda de alertas por proximidad usando coordenadas
- **Filtros Avanzados**: Por tipo, severidad, fecha y ubicación
- **Reportes**: Sistema de reportes y confirmaciones de usuarios
- **Estadísticas**: Métricas en tiempo real de las alertas

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **CORS** - Middleware para peticiones cross-origin

## 📋 Requisitos Previos

- Node.js >= 14.0.0
- MongoDB (local o Atlas)
- NPM o Yarn

## 🔧 Instalación

1. **Clonar el repositorio o navegar a la carpeta backend**:
   ```bash
   cd backend
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crear archivo `.env` en la raíz del backend:
   ```env
   MONGO_URI=mongodb://localhost:27017/rutopia
   PORT=3000
   NODE_ENV=development
   ```

4. **Iniciar el servidor**:
   ```bash
   # Modo desarrollo (con nodemon)
   npm run dev
   
   # Modo producción
   npm start
   ```

## 🌐 Endpoints de la API

### Alertas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/alertas` | Obtener todas las alertas |
| GET | `/api/alertas/:id` | Obtener alerta por ID |
| POST | `/api/alertas` | Crear nueva alerta |
| PUT | `/api/alertas/:id` | Actualizar alerta |
| DELETE | `/api/alertas/:id` | Eliminar alerta |
| GET | `/api/alertas/cercanas` | Obtener alertas cercanas |
| GET | `/api/alertas/estadisticas` | Obtener estadísticas |
| POST | `/api/alertas/:id/reportes` | Agregar reporte a alerta |

### Parámetros de Consulta

#### GET `/api/alertas`
- `tipo`: Filtrar por tipo (`traffic`, `natural`, `security`)
- `severidad`: Filtrar por severidad (`baja`, `media`, `alta`)
- `activa`: Filtrar por estado (`true`, `false`)
- `lat`, `lng`: Coordenadas para búsqueda geográfica
- `radio`: Radio de búsqueda en metros (default: 50000)
- `limit`: Límite de resultados (default: 100)
- `page`: Página para paginación (default: 1)

#### GET `/api/alertas/cercanas`
- `lat`, `lng`: Coordenadas requeridas
- `radio`: Radio en metros (default: 5000)

### Ejemplos de Uso

#### Crear una nueva alerta
```bash
curl -X POST http://localhost:3000/api/alertas \
  -H "Content-Type: application/json" \
  -H "user-id: usuario123" \
  -d '{
    "titulo": "Accidente vial",
    "descripcion": "Colisión múltiple en la autopista",
    "tipo": "traffic",
    "severidad": "alta",
    "coordenadas": [-74.0721, 4.7110],
    "direccion": "Autopista Norte Km 15"
  }'
```

#### Obtener alertas por ubicación
```bash
curl "http://localhost:3000/api/alertas?lat=4.7110&lng=-74.0721&radio=10000&tipo=traffic"
```

#### Obtener alertas cercanas
```bash
curl "http://localhost:3000/api/alertas/cercanas?lat=4.7110&lng=-74.0721&radio=5000"
```

## 📊 Modelo de Datos

### Alerta
```javascript
{
  titulo: String,           // Título de la alerta
  descripcion: String,      // Descripción detallada
  tipo: String,            // 'traffic', 'natural', 'security'
  severidad: String,       // 'baja', 'media', 'alta'
  ubicacion: {             // Coordenadas GeoJSON
    type: 'Point',
    coordinates: [lng, lat]
  },
  direccion: String,       // Dirección legible (opcional)
  activa: Boolean,         // Estado de la alerta
  fechaCreacion: Date,     // Fecha de creación
  fechaVencimiento: Date,  // Fecha de vencimiento
  usuarioCreador: String,  // UID del usuario creador
  reportes: [{             // Reportes de usuarios
    usuario: String,
    comentario: String,
    fecha: Date,
    tipo: String
  }],
  tags: [String]          // Etiquetas adicionales
}
```

## 🔐 Autenticación

La API utiliza un sistema simple de autenticación basado en headers:
- Header: `user-id` con el UID del usuario de Firebase
- Este header es requerido para operaciones POST, PUT, DELETE

## 🚀 Deployment

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Variables de Entorno para Producción
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/rutopia
PORT=3000
NODE_ENV=production
```

## 📝 Logging

El servidor registra:
- Conexión exitosa a MongoDB
- Errores de conexión
- Requests HTTP (en desarrollo)
- Errores de la aplicación

## 🧪 Testing

Para ejecutar los tests:
```bash
npm test
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte

Para soporte técnico o reportar bugs, crear un issue en el repositorio.

---

**Rutopia Backend API** - Desarrollado con ❤️ para una mejor experiencia de viaje.
