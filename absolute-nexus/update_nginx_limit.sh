#!/bin/bash
set -e
echo "Updating Nginx client_max_body_size to 5000M in sites-available..."
if [ -f /etc/nginx/sites-available/absoluteserversmanager ]; then
  sed -i 's/client_max_body_size 20M;/client_max_body_size 5000M;/g' /etc/nginx/sites-available/absoluteserversmanager
  echo "Testing Nginx configuration..."
  nginx -t
  echo "Reloading Nginx..."
  systemctl reload nginx
  echo "✅ Nginx reloaded successfully with 5000M client max body size limit."
else
  echo "❌ Configuration file not found at /etc/nginx/sites-available/absoluteserversmanager"
  exit 1
fi
