#!/bin/bash
# Script de instalación para CARDIONET en VPS con subdominio

set -e

echo "==========================================="
echo "CARDIONET - Instalación en VPS"
echo "Subdominio: cardionet.duckterv.com"
echo "==========================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml no encontrado. Ejecuta este script desde la carpeta CARDIONET"
    exit 1
fi

# 1. Verificar Docker
print_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker no instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_info "Docker instalado. Por favor cierra sesión y vuelve a entrar, luego ejecuta este script nuevamente."
    exit 0
fi

# 2. Verificar Docker Compose
print_info "Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose no instalado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 3. Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    print_info "Creando archivo .env desde .env.example..."
    cp .env.example .env
    print_warning "Edita .env con tus credenciales de producción antes de continuar."
fi

# 4. Entrenar modelos si no existen
if [ ! -f "ml_models/random_forest_model.pkl" ]; then
    print_warning "Modelos ML no encontrados. Entrenando modelos..."
    print_info "Esto puede tomar unos minutos..."
    docker-compose run --rm backend python train_model_win.py
    print_info "Modelos entrenados exitosamente"
fi

# 5. Configurar Nginx en el VPS
print_info "Configurando Nginx para subdominio..."

# Verificar si Nginx está instalado
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx no instalado. Instalando..."
    sudo apt update
    sudo apt install -y nginx
fi

# Copiar configuración de Nginx
print_info "Copiando configuración de Nginx..."
sudo cp nginx_vps_config/cardionet.duckterv.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/cardionet.duckterv.com.conf /etc/nginx/sites-enabled/

# Verificar configuración de Nginx
print_info "Verificando configuración de Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    print_info "Configuración de Nginx correcta"
    sudo systemctl reload nginx
else
    print_error "Error en la configuración de Nginx"
    exit 1
fi

# 6. Configurar firewall
print_info "Configurando firewall..."
sudo ufw allow 'Nginx Full' 2>/dev/null || true
sudo ufw allow 22 2>/dev/null || true
echo "y" | sudo ufw enable 2>/dev/null || true

# 7. Desplegar con Docker
print_info "Desplegando CARDIONET con Docker..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# 8. Esperar a que los servicios estén listos
print_info "Esperando a que los servicios estén listos..."
sleep 15

# 9. Verificar estado
print_info "Verificando estado de los servicios..."
docker-compose ps

# 10. Configurar SSL con Let's Encrypt
print_info "¿Deseas configurar SSL/HTTPS ahora? (y/n)"
read -r respuesta

if [ "$respuesta" = "y" ] || [ "$respuesta" = "Y" ]; then
    print_info "Instalando Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx

    print_info "Obteniendo certificado SSL..."
    sudo certbot --nginx -d cardionet.duckterv.com --non-interactive --agree-tos --email admin@duckterv.com || {
        print_warning "Error al obtener certificado SSL. Puedes intentarlo manualmente con:"
        print_warning "sudo certbot --nginx -d cardionet.duckterv.com"
    }
fi

echo ""
echo "==========================================="
print_info "Instalación completada!"
echo "==========================================="
echo ""
echo "Tu aplicación está disponible en:"
echo "  http://cardionet.duckterv.com"
echo ""
if [ "$respuesta" = "y" ] || [ "$respuesta" = "Y" ]; then
    echo "  https://cardionet.duckterv.com (con SSL)"
    echo ""
fi
echo "Comandos útiles:"
echo "  docker-compose logs -f          # Ver logs"
echo "  docker-compose ps               # Ver estado"
echo "  docker-compose restart          # Reiniciar"
echo "  docker-compose down             # Detener"
echo ""
echo "==========================================="
