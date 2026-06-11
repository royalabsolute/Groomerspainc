#!/bin/bash
# Script de actualización automatizado para Absolute Nexus
# Ubicación en VPS: /var/www/groomingpet/absolute-nexus/update_nexus.sh

echo "=== INICIANDO ACTUALIZACIÓN DE ABSOLUTE NEXUS ==="

# 1. Navegar a la carpeta del proyecto
cd /var/www/groomingpet/absolute-nexus || exit 1

# 2. Sincronizar repositorio con GitHub
echo "Sincronizando con el repositorio GitHub..."
git fetch origin main
git reset --hard origin/main

# 3. Detener contenedores actuales
echo "Deteniendo contenedores actuales..."
docker compose down

# 4. Sincronizar la base de datos PostgreSQL
echo "Ejecutando la sincronización de la base de datos (Prisma db push)..."
export DATABASE_URL="postgresql://groomer_admin:Mega1321@@localhost:5432/groomingpet_db?schema=public&connection_limit=5"
sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma
npx prisma generate
npx prisma db push --accept-data-loss
git checkout prisma/schema.prisma

# 5. Reconstruir la imagen de Docker limpia
echo "Reconstruyendo la imagen de Docker sin caché..."
docker compose build --no-cache

# 6. Levantar el servicio
echo "Levantando el contenedor de Absolute Nexus..."
docker compose up -d

# 7. Borrar imágenes viejas huérfanas
echo "Limpiando imágenes viejas..."
docker image prune -f

echo "=== ACTUALIZACIÓN COMPLETADA CON ÉXITO ==="
