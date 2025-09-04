# Rutopia 2.0 - Configuración del Mapa

## Problema: El mapa no se muestra en la página de alertas

### Solución:

El mapa requiere un token de acceso válido de Mapbox. Sigue estos pasos para configurarlo:

## 1. Obtener Token de Mapbox

1. Ve a [Mapbox](https://account.mapbox.com/access-tokens/)
2. Crea una cuenta gratuita si no tienes una
3. Copia tu token de acceso público (Public Token)

## 2. Configurar Token en el Proyecto

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza `pk.eyJ1IjoicnV0b3BpYSIsImEiOiJjbTBkZmx0cnUwMTZtMmpvcnFwbGdpY3BoIn0.sample_token_replace_with_real` con tu token real de Mapbox

Ejemplo:
```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoidHVfdXN1YXJpbyIsImEiOiJjbGFiY2RlZiJ9.tu_token_real_aqui
```

## 3. Reiniciar el Servidor

Después de configurar el token, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## 4. Verificar que Funciona

1. Ve a http://localhost:5173/alertas.html
2. El mapa debería cargar correctamente
3. Si ves un mensaje de error, verifica que el token esté correctamente configurado

## Archivos Involucrados

- `.env` - Variables de entorno (incluyendo el token de Mapbox)
- `js/alertas-map.js` - Lógica del mapa
- `css/alertas-map.css` - Estilos del mapa
- `alertas.html` - Página principal de alertas con el mapa

## Funcionalidades del Mapa

Una vez configurado, el mapa incluye:

- ✅ Visualización de alertas por tipo (Tráfico, Fenómenos Naturales, Seguridad)
- ✅ Filtros por tipo de alerta
- ✅ Diferentes colores según severidad (Alta: Rojo, Media: Naranja, Baja: Verde)
- ✅ Popups informativos al hacer clic en las alertas
- ✅ Botón para centrar en ubicación actual
- ✅ Buscador de ubicaciones
- ✅ Controles de navegación (zoom, rotación)

## Token Temporal para Pruebas

Si necesitas un token temporal para probar rápidamente, puedes usar este token público de demostración (limitado):

```
pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA
```

**⚠️ Importante:** Este token es solo para pruebas. Para producción, usa tu propio token de Mapbox.
