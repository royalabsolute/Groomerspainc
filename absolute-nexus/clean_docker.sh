#!/bin/bash
# Script de mantenimiento y limpieza profunda de Docker
# Ubicación en VPS: /var/www/groomingpet/absolute-nexus/clean_docker.sh

echo "=== INICIANDO LIMPIEZA PROFUNDA DE DOCKER ==="
echo "Espacio inicial en disco:"
df -h /

echo "1. Deteniendo contenedores inactivos y limpiando recursos no usados..."
docker system prune -af --volumes

echo "2. Limpiando la caché de construcción (build cache)..."
docker builder prune -af

echo "3. Espacio final en disco:"
df -h /
echo "=== LIMPIEZA COMPLETADA ==="
