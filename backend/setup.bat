@echo off
:: Script de configuración e inicio del Backend de Rutopia para Windows
:: Este script instala dependencias y inicia el servidor

echo 🚀 Configurando Backend de Rutopia...

:: Verificar si existe Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js ^>= 14.0.0
    pause
    exit /b 1
)

:: Mostrar versión de Node.js
echo 📋 Versión de Node.js:
node -v

:: Instalar dependencias
echo 📦 Instalando dependencias...
npm install

:: Verificar si existe archivo .env
if not exist ".env" (
    echo ⚠️  Archivo .env no encontrado. Creando archivo de ejemplo...
    (
        echo # Configuración de MongoDB
        echo MONGO_URI=mongodb://localhost:27017/rutopia
        echo.
        echo # Puerto del servidor
        echo PORT=3000
        echo.
        echo # Entorno de desarrollo
        echo NODE_ENV=development
    ) > .env
    echo ✅ Archivo .env creado. Por favor configura tu URI de MongoDB.
)

echo.
echo 🎯 Configuración completada!
echo.
echo Para iniciar el servidor:
echo   Desarrollo: npm run dev
echo   Producción: npm start
echo.
echo API disponible en: http://localhost:3000/api
echo Health check: http://localhost:3000/api/health
echo.
pause
