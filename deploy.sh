#!/bin/bash
# Script de despliegue para CARDIONET en VPS

set -e

echo "=========================================="
echo "CARDIONET - Script de Despliegue"
echo "=========================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

print_info "Docker y Docker Compose encontrados"

# Verificar si existe .env
if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado. Copiando .env.example..."
    cp .env.example .env
    print_error "IMPORTANTE: Edita .env con tus credenciales antes de continuar."
    exit 1
fi

# Detener contenedores existentes
print_info "Deteniendo contenedores existentes (si existen)..."
docker-compose down 2>/dev/null || true

# Limpiar contenedores antiguos
print_info "Limpiando contenedores y redes antiguas..."
docker system prune -f

# Construir imágenes
print_info "Construyendo imágenes de Docker..."
docker-compose build --no-cache

# Entrenar modelos si no existen
if [ ! -f "ml_models/random_forest_model.pkl" ]; then
    print_warning "Modelos ML no encontrados. Entrenando modelos..."
    docker-compose run --rm backend python train_model_win.py
    print_info "Modelos entrenados exitosamente"
else
    print_info "Modelos ML ya existen, saltando entrenamiento"
fi

# Iniciar servicios
print_info "Iniciando servicios con Docker Compose..."
docker-compose up -d

# Esperar a que los servicios estén listos
print_info "Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
print_info "Verificando estado de los servicios..."
docker-compose ps

# Obtener IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
print_info "Despliegue completado exitosamente!"
echo "=========================================="
echo ""
echo "Servicios disponibles:"
echo "  - Frontend: http://$SERVER_IP:3010"
echo "  - API:      http://$SERVER_IP:8083"
echo ""
echo "Para ver logs:"
echo "  docker-compose logs -f"
echo ""
echo "Para detener:"
echo "  docker-compose down"
echo ""
echo "Para reiniciar:"
echo "  docker-compose restart"
echo "=========================================="
