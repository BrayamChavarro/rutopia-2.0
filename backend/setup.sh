#!/bin/bash

# Script de configuración e inicio del Backend de Rutopia
# Este script instala dependencias y inicia el servidor

echo "🚀 Configurando Backend de Rutopia..."

# Verificar si existe Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js >= 14.0.0"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
REQUIRED_VERSION="14.0.0"

echo "📋 Versión de Node.js: $NODE_VERSION"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar si existe archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado. Creando archivo de ejemplo..."
    cat > .env << EOF
# Configuración de MongoDB
MONGO_URI=mongodb://localhost:27017/rutopia

# Puerto del servidor
PORT=3000

# Entorno de desarrollo
NODE_ENV=development
EOF
    echo "✅ Archivo .env creado. Por favor configura tu URI de MongoDB."
fi

echo "🎯 Configuración completada!"
echo ""
echo "Para iniciar el servidor:"
echo "  Desarrollo: npm run dev"
echo "  Producción: npm start"
echo ""
echo "API disponible en: http://localhost:3000/api"
echo "Health check: http://localhost:3000/api/health"
