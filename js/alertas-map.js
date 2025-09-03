// Mapa de alertas usando Mapbox
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Configurar token de acceso de Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

class AlertasMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
        this.alertas = [];
        
        // Guardar instancia globalmente para acceso desde popups
        window.alertasMapInstance = this;
        
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container || !mapboxgl.accessToken) {
            console.error('No se pudo inicializar el mapa. Verifica el contenedor y el token de Mapbox.');
            return;
        }

        // Crear el mapa
        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: 'mapbox://styles/mapbox/dark-v11', // Tema oscuro para combinar con el diseño
            center: [-74.06, 4.65], // Bogotá, Colombia como centro inicial
            zoom: 11
        });

        // Agregar controles de navegación
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Agregar buscador
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            placeholder: "Buscar ubicación...",
            countries: "co", // Limitar a Colombia
            language: "es",
            proximity: { longitude: -74.1, latitude: 4.7 }, // Centrar en Bogotá
            types: "address,place,poi",
            zoom: 14,
            marker: false, // No mostrar marcador automático
            limit: 5
        });

        this.map.addControl(geocoder, 'top-left');

        // Evento cuando se carga el mapa
        this.map.on('load', () => {
            this.setupMapLayers();
            this.loadAlertas();
        });

        // Agregar evento de clic en el mapa
        this.map.on('click', (e) => {
            this.handleMapClick(e);
        });
    }

    setupMapLayers() {
        // Agregar fuente de datos para las alertas
        this.map.addSource('alertas', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        // Agregar capa de círculos para las alertas
        this.map.addLayer({
            id: 'alertas-circles',
            type: 'circle',
            source: 'alertas',
            paint: {
                'circle-radius': [
                    'case',
                    ['==', ['get', 'severidad'], 'alta'], 20,
                    ['==', ['get', 'severidad'], 'media'], 15,
                    12 // baja
                ],
                'circle-color': [
                    'case',
                    // Severidad alta - siempre rojo intenso
                    ['==', ['get', 'severidad'], 'alta'], '#dc2626',
                    // Severidad media - colores por tipo
                    [
                        'all',
                        ['==', ['get', 'severidad'], 'media'],
                        ['==', ['get', 'tipo'], 'traffic']
                    ], '#f59e0b', // amarillo/naranja para tráfico medio
                    [
                        'all',
                        ['==', ['get', 'severidad'], 'media'],
                        ['==', ['get', 'tipo'], 'natural']
                    ], '#ef4444', // rojo para natural medio
                    [
                        'all',
                        ['==', ['get', 'severidad'], 'media'],
                        ['==', ['get', 'tipo'], 'security']
                    ], '#f97316', // naranja para seguridad medio
                    // Severidad baja - colores más suaves
                    [
                        'all',
                        ['==', ['get', 'severidad'], 'baja'],
                        ['==', ['get', 'tipo'], 'traffic']
                    ], '#22c55e', // verde para tráfico bajo
                    [
                        'all',
                        ['==', ['get', 'severidad'], 'baja'],
                        ['==', ['get', 'tipo'], 'natural']
                    ], '#3b82f6', // azul para natural bajo
                    [
                        'all',
                        ['==', ['get', 'severidad'], 'baja'],
                        ['==', ['get', 'tipo'], 'security']
                    ], '#8b5cf6', // morado para seguridad bajo
                    '#6b7280' // gris por defecto
                ],
                'circle-opacity': 0.8,
                'circle-stroke-width': [
                    'case',
                    ['==', ['get', 'severidad'], 'alta'], 3,
                    ['==', ['get', 'severidad'], 'media'], 2,
                    1 // baja
                ],
                'circle-stroke-color': '#ffffff'
            }
        });

        // Agregar evento de clic en las alertas
        this.map.on('click', 'alertas-circles', (e) => {
            this.showAlertaPopup(e);
        });

        // Cambiar cursor cuando se pasa sobre una alerta
        this.map.on('mouseenter', 'alertas-circles', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'alertas-circles', () => {
            this.map.getCanvas().style.cursor = '';
        });
    }

    loadAlertas() {
        // Cargar alertas desde la API
        this.fetchAlertasFromAPI();
    }

    async fetchAlertasFromAPI() {
        try {
            const response = await fetch('http://localhost:3000/api/alertas?activa=true&limit=100');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.alertas = data.alertas || [];
            this.updateAlertasOnMap();
        } catch (error) {
            console.error('Error cargando alertas desde API:', error);
            // Usar datos de ejemplo si falla la API
            this.loadAlertasEjemplo();
        }
    }

    loadAlertasEjemplo() {
        // Datos de ejemplo para las alertas (fallback)
        this.alertas = [
            {
                id: 1,
                tipo: 'traffic',
                titulo: 'Congestión Vial',
                ubicacion: 'Centro Histórico, Bogotá',
                descripcion: 'Tráfico pesado en Carrera 7 debido a manifestación',
                severidad: 'media',
                coordenadas: [-74.075, 4.598],
                tiempo: 'Hace 15 min'
            },
            {
                id: 2,
                tipo: 'natural',
                titulo: 'Alerta Sísmica',
                ubicacion: 'Zona Metropolitana',
                descripcion: 'Sismo de 4.2 grados detectado en la región',
                severidad: 'alta',
                coordenadas: [-74.06, 4.65],
                tiempo: 'Hace 5 min'
            },
            {
                id: 3,
                tipo: 'security',
                titulo: 'Zona de Riesgo',
                ubicacion: 'Localidad de Ciudad Bolívar',
                descripcion: 'Reportes de actividad sospechosa en la zona',
                severidad: 'alta',
                coordenadas: [-74.18, 4.57],
                tiempo: 'Hace 30 min'
            },
            {
                id: 4,
                tipo: 'traffic',
                titulo: 'Accidente Vial',
                ubicacion: 'Autopista Norte',
                descripcion: 'Colisión múltiple, vía parcialmente cerrada',
                severidad: 'alta',
                coordenadas: [-74.04, 4.75],
                tiempo: 'Hace 10 min'
            },
            {
                id: 5,
                tipo: 'natural',
                titulo: 'Lluvia Intensa',
                ubicacion: 'Zona Sur',
                descripcion: 'Precipitaciones fuertes, posible inundación',
                severidad: 'media',
                coordenadas: [-74.12, 4.55],
                tiempo: 'Hace 25 min'
            },
            {
                id: 6,
                tipo: 'traffic',
                titulo: 'Vía Cerrada',
                ubicacion: 'Calle 26',
                descripcion: 'Mantenimiento vial programado',
                severidad: 'baja',
                coordenadas: [-74.08, 4.62],
                tiempo: 'Hace 1h'
            },
            {
                id: 7,
                tipo: 'security',
                titulo: 'Zona Segura',
                ubicacion: 'Zona Rosa',
                descripcion: 'Presencia policial incrementada',
                severidad: 'baja',
                coordenadas: [-74.06, 4.66],
                tiempo: 'Hace 2h'
            },
            {
                id: 8,
                tipo: 'natural',
                titulo: 'Llovizna',
                ubicacion: 'Norte de Bogotá',
                descripcion: 'Precipitaciones leves',
                severidad: 'baja',
                coordenadas: [-74.05, 4.70],
                tiempo: 'Hace 45 min'
            }
        ];

        this.updateAlertasOnMap();
    }

    updateAlertasOnMap() {
        // Convertir alertas a formato GeoJSON
        const features = this.alertas.map(alerta => {
            // Manejar diferentes formatos de coordenadas
            let coordenadas;
            if (alerta.ubicacion && alerta.ubicacion.coordinates) {
                coordenadas = alerta.ubicacion.coordinates;
            } else if (alerta.coordenadas) {
                coordenadas = alerta.coordenadas;
            } else {
                console.warn('Alerta sin coordenadas válidas:', alerta);
                return null;
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordenadas
                },
                properties: {
                    id: alerta.id || alerta._id,
                    tipo: alerta.tipo,
                    titulo: alerta.titulo,
                    ubicacion: alerta.ubicacion || alerta.direccion,
                    descripcion: alerta.descripcion,
                    severidad: alerta.severidad,
                    tiempo: alerta.tiempoTranscurrido || alerta.tiempo || 'Reciente'
                }
            };
        }).filter(feature => feature !== null);

        // Actualizar la fuente de datos
        this.map.getSource('alertas').setData({
            type: 'FeatureCollection',
            features: features
        });
    }

    showAlertaPopup(e) {
        const properties = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();

        // Crear contenido del popup con botones de acción
        const popupContent = `
            <div class="alerta-popup">
                <div class="flex items-center gap-2 mb-2">
                    <span class="alerta-icon ${properties.tipo}">${this.getAlertaIcon(properties.tipo)}</span>
                    <h3 class="font-bold text-sm">${properties.titulo}</h3>
                </div>
                <p class="text-xs text-gray-400 mb-1">${properties.ubicacion}</p>
                <p class="text-xs mb-2 text-gray-300">${properties.descripcion}</p>
                <div class="flex justify-between items-center text-xs mb-3">
                    <span class="severidad ${properties.severidad}">${properties.severidad.toUpperCase()}</span>
                    <span class="text-gray-500">${properties.tiempo}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.alertasMapInstance.editarAlerta('${properties.id}')" 
                            class="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition">
                        ✏️ Editar
                    </button>
                    <button onclick="window.alertasMapInstance.eliminarAlerta('${properties.id}')" 
                            class="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;

        // Mostrar popup
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(this.map);
    }

    getAlertaIcon(tipo) {
        const iconos = {
            traffic: '🚗',
            natural: '🌊',
            security: '⚠️'
        };
        return iconos[tipo] || '📍';
    }

    handleMapClick(e) {
        // Mostrar modal para crear nueva alerta
        this.mostrarModalCrearAlerta(e.lngLat);
    }

    mostrarModalCrearAlerta(lngLat) {
        // Crear modal dinámicamente
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
                <h3 class="text-xl font-bold text-white mb-4">Crear Nueva Alerta</h3>
                <form id="form-nueva-alerta">
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Título</label>
                        <input type="text" id="titulo-alerta" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Accidente vial" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Descripción</label>
                        <textarea id="descripcion-alerta" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" placeholder="Describe la situación..." required></textarea>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Tipo de Alerta</label>
                        <select id="tipo-alerta" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="traffic">🚗 Tráfico</option>
                            <option value="natural">🌊 Fenómeno Natural</option>
                            <option value="security">⚠️ Seguridad</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Severidad</label>
                        <select id="severidad-alerta" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="baja">🟢 Baja</option>
                            <option value="media" selected>🟡 Media</option>
                            <option value="alta">🔴 Alta</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Ubicación</label>
                        <input type="text" id="direccion-alerta" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Dirección (opcional)">
                        <p class="text-xs text-gray-500 mt-1">Coordenadas: ${lngLat.lng.toFixed(6)}, ${lngLat.lat.toFixed(6)}</p>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" id="btn-cancelar" class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">Cancelar</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Crear Alerta</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const form = modal.querySelector('#form-nueva-alerta');
        const btnCancelar = modal.querySelector('#btn-cancelar');

        btnCancelar.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.crearNuevaAlerta(lngLat, modal);
        });

        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async crearNuevaAlerta(lngLat, modal) {
        try {
            const titulo = modal.querySelector('#titulo-alerta').value.trim();
            const descripcion = modal.querySelector('#descripcion-alerta').value.trim();
            const tipo = modal.querySelector('#tipo-alerta').value;
            const severidad = modal.querySelector('#severidad-alerta').value;
            const direccion = modal.querySelector('#direccion-alerta').value.trim();

            if (!titulo || !descripcion) {
                alert('Por favor completa todos los campos requeridos');
                return;
            }

            // Obtener el UID del usuario autenticado desde Firebase
            const user = await this.getCurrentUser();
            if (!user) {
                alert('Debes estar autenticado para crear alertas');
                return;
            }

            const nuevaAlerta = {
                titulo,
                descripcion,
                tipo,
                severidad,
                coordenadas: [lngLat.lng, lngLat.lat],
                direccion: direccion || undefined,
                usuarioCreador: user.uid
            };

            const response = await fetch('http://localhost:3000/api/alertas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': user.uid
                },
                body: JSON.stringify(nuevaAlerta)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear la alerta');
            }

            const alertaCreada = await response.json();
            
            // Agregar la nueva alerta al mapa
            this.alertas.push(alertaCreada);
            this.updateAlertasOnMap();

            // Cerrar modal
            document.body.removeChild(modal);

            // Mostrar notificación de éxito
            this.mostrarNotificacion('¡Alerta creada exitosamente!', 'success');

        } catch (error) {
            console.error('Error creando alerta:', error);
            alert('Error al crear la alerta: ' + error.message);
        }
    }

    async getCurrentUser() {
        return new Promise((resolve) => {
            // Importar Firebase auth dinámicamente
            import('/src/firebase.js').then(({ auth }) => {
                import('firebase/auth').then(({ onAuthStateChanged }) => {
                    onAuthStateChanged(auth, (user) => {
                        resolve(user);
                    });
                });
            }).catch(() => {
                resolve(null);
            });
        });
    }

    // Método para editar una alerta
    async editarAlerta(alertaId) {
        try {
            // Buscar la alerta en los datos locales
            const alerta = this.alertas.find(a => (a.id || a._id) == alertaId);
            if (!alerta) {
                this.mostrarNotificacion('Alerta no encontrada', 'error');
                return;
            }

            // Cerrar cualquier popup abierto
            const popups = document.querySelectorAll('.mapboxgl-popup');
            popups.forEach(popup => popup.remove());

            // Mostrar modal de edición
            this.mostrarModalEditarAlerta(alerta);

        } catch (error) {
            console.error('Error al editar alerta:', error);
            this.mostrarNotificacion('Error al cargar datos de la alerta', 'error');
        }
    }

    // Método para eliminar una alerta
    async eliminarAlerta(alertaId) {
        try {
            // Buscar la alerta en los datos locales
            const alerta = this.alertas.find(a => (a.id || a._id) == alertaId);
            if (!alerta) {
                this.mostrarNotificacion('Alerta no encontrada', 'error');
                return;
            }

            // Cerrar cualquier popup abierto
            const popups = document.querySelectorAll('.mapboxgl-popup');
            popups.forEach(popup => popup.remove());

            // Confirmar eliminación
            if (!confirm(`¿Estás seguro de que quieres eliminar la alerta "${alerta.titulo}"?`)) {
                return;
            }

            // Obtener el usuario actual
            const user = await this.getCurrentUser();
            if (!user) {
                this.mostrarNotificacion('Debes estar autenticado para eliminar alertas', 'error');
                return;
            }

            // Eliminar de la API si existe el ID
            if (alerta._id || alerta.id) {
                const response = await fetch(`http://localhost:3000/api/alertas/${alerta._id || alerta.id}`, {
                    method: 'DELETE',
                    headers: {
                        'user-id': user.uid
                    }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al eliminar la alerta');
                }
            }

            // Eliminar de los datos locales
            this.alertas = this.alertas.filter(a => (a.id || a._id) != alertaId);
            this.updateAlertasOnMap();

            this.mostrarNotificacion('Alerta eliminada exitosamente', 'success');

        } catch (error) {
            console.error('Error al eliminar alerta:', error);
            this.mostrarNotificacion('Error al eliminar la alerta: ' + error.message, 'error');
        }
    }

    mostrarModalEditarAlerta(alerta) {
        // Obtener coordenadas en el formato correcto
        let coordenadas;
        if (alerta.ubicacion && alerta.ubicacion.coordinates) {
            coordenadas = alerta.ubicacion.coordinates;
        } else if (alerta.coordenadas) {
            coordenadas = alerta.coordenadas;
        } else {
            coordenadas = [0, 0];
        }

        // Crear modal de edición
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
                <h3 class="text-xl font-bold text-white mb-4">Editar Alerta</h3>
                <form id="form-editar-alerta">
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Título</label>
                        <input type="text" id="titulo-alerta-edit" value="${alerta.titulo}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Descripción</label>
                        <textarea id="descripcion-alerta-edit" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" required>${alerta.descripcion}</textarea>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Tipo de Alerta</label>
                        <select id="tipo-alerta-edit" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="traffic" ${alerta.tipo === 'traffic' ? 'selected' : ''}>🚗 Tráfico</option>
                            <option value="natural" ${alerta.tipo === 'natural' ? 'selected' : ''}>🌊 Fenómeno Natural</option>
                            <option value="security" ${alerta.tipo === 'security' ? 'selected' : ''}>⚠️ Seguridad</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Severidad</label>
                        <select id="severidad-alerta-edit" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="baja" ${alerta.severidad === 'baja' ? 'selected' : ''}>🟢 Baja</option>
                            <option value="media" ${alerta.severidad === 'media' ? 'selected' : ''}>🟡 Media</option>
                            <option value="alta" ${alerta.severidad === 'alta' ? 'selected' : ''}>🔴 Alta</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-300 text-sm font-medium mb-2">Ubicación</label>
                        <input type="text" id="direccion-alerta-edit" value="${alerta.direccion || alerta.ubicacion || ''}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Dirección (opcional)">
                        <p class="text-xs text-gray-500 mt-1">Coordenadas: ${coordenadas[0].toFixed(6)}, ${coordenadas[1].toFixed(6)}</p>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" id="btn-cancelar-edit" class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">Cancelar</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const form = modal.querySelector('#form-editar-alerta');
        const btnCancelar = modal.querySelector('#btn-cancelar-edit');

        btnCancelar.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarCambiosAlerta(alerta, modal);
        });

        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async guardarCambiosAlerta(alertaOriginal, modal) {
        try {
            const titulo = modal.querySelector('#titulo-alerta-edit').value.trim();
            const descripcion = modal.querySelector('#descripcion-alerta-edit').value.trim();
            const tipo = modal.querySelector('#tipo-alerta-edit').value;
            const severidad = modal.querySelector('#severidad-alerta-edit').value;
            const direccion = modal.querySelector('#direccion-alerta-edit').value.trim();

            if (!titulo || !descripcion) {
                this.mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
                return;
            }

            const user = await this.getCurrentUser();
            if (!user) {
                this.mostrarNotificacion('Debes estar autenticado para editar alertas', 'error');
                return;
            }

            const datosActualizados = {
                titulo,
                descripcion,
                tipo,
                severidad,
                direccion: direccion || undefined
            };

            // Actualizar en la API si existe el ID
            if (alertaOriginal._id || alertaOriginal.id) {
                const response = await fetch(`http://localhost:3000/api/alertas/${alertaOriginal._id || alertaOriginal.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'user-id': user.uid
                    },
                    body: JSON.stringify(datosActualizados)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al actualizar la alerta');
                }

                // Obtener los datos actualizados de la respuesta
                const alertaActualizada = await response.json();
                
                // Actualizar en los datos locales
                const index = this.alertas.findIndex(a => (a.id || a._id) == (alertaOriginal.id || alertaOriginal._id));
                if (index !== -1) {
                    this.alertas[index] = alertaActualizada;
                }
            } else {
                // Actualizar solo localmente para datos de ejemplo
                const index = this.alertas.findIndex(a => (a.id || a._id) == (alertaOriginal.id || alertaOriginal._id));
                if (index !== -1) {
                    this.alertas[index] = { ...alertaOriginal, ...datosActualizados };
                }
            }

            this.updateAlertasOnMap();

            // Cerrar modal
            document.body.removeChild(modal);

            this.mostrarNotificacion('Alerta actualizada exitosamente', 'success');

        } catch (error) {
            console.error('Error actualizando alerta:', error);
            this.mostrarNotificacion('Error al actualizar la alerta: ' + error.message, 'error');
        }
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        
        const colores = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            info: 'bg-blue-600 text-white'
        };

        notification.className += ` ${colores[tipo]}`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span>${mensaje}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-xl">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover después de 5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Método para agregar una nueva alerta
    agregarAlerta(alerta) {
        this.alertas.push(alerta);
        this.updateAlertasOnMap();
    }

    // Método para filtrar alertas por tipo
    filtrarPorTipo(tipos) {
        console.log('Filtrando por tipos:', tipos);
        console.log('Alertas disponibles:', this.alertas);
        
        const alertasFiltradas = tipos.length > 0 
            ? this.alertas.filter(alerta => tipos.includes(alerta.tipo))
            : this.alertas;

        console.log('Alertas filtradas:', alertasFiltradas);

        const features = alertasFiltradas.map(alerta => {
            // Manejar diferentes formatos de coordenadas (igual que updateAlertasOnMap)
            let coordenadas;
            if (alerta.ubicacion && alerta.ubicacion.coordinates) {
                coordenadas = alerta.ubicacion.coordinates;
            } else if (alerta.coordenadas) {
                coordenadas = alerta.coordenadas;
            } else {
                console.warn('Alerta sin coordenadas válidas:', alerta);
                return null;
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordenadas
                },
                properties: {
                    id: alerta.id || alerta._id,
                    tipo: alerta.tipo,
                    titulo: alerta.titulo,
                    ubicacion: alerta.ubicacion || alerta.direccion,
                    descripcion: alerta.descripcion,
                    severidad: alerta.severidad,
                    tiempo: alerta.tiempoTranscurrido || alerta.tiempo || 'Reciente'
                }
            };
        }).filter(feature => feature !== null);

        this.map.getSource('alertas').setData({
            type: 'FeatureCollection',
            features: features
        });
    }

    // Método para centrar el mapa en una ubicación específica
    centrarEn(coordenadas, zoom = 14) {
        this.map.flyTo({
            center: coordenadas,
            zoom: zoom
        });
    }

    // Método para refrescar las alertas desde la API
    async refrescarAlertas() {
        await this.fetchAlertasFromAPI();
    }

    // Método para destruir el mapa
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

export default AlertasMap;
