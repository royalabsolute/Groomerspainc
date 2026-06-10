#!/bin/bash

# ==============================================================================
# Script de Despliegue de Absolute Nexus
# Entorno: Hostinger KVM4 VPS
# Dominio: absoluteserversmanager.cloud
# Puerto Interno: 3001 (Nginx Reverse Proxy)
# ==============================================================================

# Detener el script inmediatamente si algún comando falla
set -e

echo "🚀 Iniciando instalación y despliegue de Absolute Nexus..."

# 1. Asegurar la instalación de Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "📦 Docker no está instalado. Iniciando instalación..."
  apt-get update
  apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
  
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io
  echo "✅ Docker instalado correctamente."
else
  echo "✔ Docker ya está instalado."
fi

# 2. Asegurar la instalación de Docker Compose v2
if ! docker compose version &>/dev/null; then
  echo "📦 Docker Compose v2 no detectado. Instalando plugin..."
  apt-get install -y docker-compose-plugin
  echo "✅ Docker Compose plugin instalado."
else
  echo "✔ Docker Compose ya está instalado."
fi

# 3. Compilación y Encendido de Contenedores
echo "🏗️ Construyendo y levantando el contenedor de Absolute Nexus..."
cd /var/www/groomingpet/absolute-nexus

# Detener contenedor previo si está activo
docker compose down || true

# Asegurar la existencia del directorio de Minecraft con permisos amplios
echo "📁 Configurando carpeta local para el servidor de Minecraft en el VPS..."
mkdir -p /var/minecraft/server
chmod 777 /var/minecraft/server

# Compilar la imagen Next.js ( standalone ) y levantar servicio en background
docker compose build --no-cache
docker compose up -d

echo "✅ Contenedor encendido correctamente. Corriendo en http://localhost:3001."

# 4. Configuración del Servidor Web Nginx
echo "🌐 Configurando Reverse Proxy en Nginx para absoluteserversmanager.cloud..."

cat << 'EOF' > /etc/nginx/sites-available/absoluteserversmanager
server {
    listen 80;
    server_name absoluteserversmanager.cloud www.absoluteserversmanager.cloud;

    # Evita choques con la subida de archivos grandes
    client_max_body_size 0;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Habilitar el bloque creando el enlace simbólico
ln -sf /etc/nginx/sites-available/absoluteserversmanager /etc/nginx/sites-enabled/

# Verificar la sintaxis de Nginx
nginx -t

# Recargar el servicio Nginx sin downtime
systemctl reload nginx
echo "✅ Nginx reconfigurado correctamente."

# 5. Configurar Certificado SSL Automático (Certbot)
echo "🔒 Obteniendo certificado SSL Let's Encrypt para absoluteserversmanager.cloud..."

# Nos aseguramos de tener certbot y el plugin de nginx
if ! [ -x "$(command -v certbot)" ]; then
  apt-get install -y certbot python3-certbot-nginx
fi

# Generar y aplicar el certificado redirigiendo HTTP a HTTPS automáticamente
certbot --nginx -d absoluteserversmanager.cloud -d www.absoluteserversmanager.cloud --non-interactive --agree-tos -m groomersincpetspa@gmail.com --redirect

echo "🎉 ¡Despliegue completado con éxito!"
echo "Accede a tu panel en: https://absoluteserversmanager.cloud"
