#!/bin/bash

# Ensure the script is run with root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Por favor, ejecuta este script como root (sudo bash update_nginx.sh)."
  exit 1
fi

NGINX_CONF="/etc/nginx/sites-available/absoluteserversmanager"

if [ ! -f "$NGINX_CONF" ]; then
  echo "Error: No se encontró el archivo de configuración de Nginx en $NGINX_CONF"
  exit 1
fi

echo "Actualizando el límite de subida en Nginx a ilimitado (0)..."

# If client_max_body_size already exists, replace it. Otherwise, add it in the server block.
if grep -q "client_max_body_size" "$NGINX_CONF"; then
  sed -i 's/client_max_body_size [^;]*;/client_max_body_size 0;/g' "$NGINX_CONF"
else
  # Add client_max_body_size 0; right after "server {"
  sed -i '/server {/a \    client_max_body_size 0;' "$NGINX_CONF"
fi

echo "Verificando la sintaxis de la configuración de Nginx..."
if nginx -t; then
  echo "Sintaxis de Nginx correcta. Recargando servicio..."
  systemctl reload nginx
  echo "Nginx recargado con éxito. El límite de subida ahora es ilimitado."
else
  echo "Error: La configuración de Nginx tiene errores de sintaxis. No se recargó Nginx."
  exit 1
fi
