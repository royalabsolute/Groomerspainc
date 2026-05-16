#!/bin/bash
echo "========================================================"
echo "  GROOMING PET - DEVELOPMENT SERVER LAUNCHER"
echo "========================================================"
echo ""
echo "[INFO] This script starts the Next.js server which handles:"
echo "       1. Frontend (Public Pages & Admin Panel)"
echo "       2. Backend (API Routes & Server Actions)"
echo ""
# Ensure binaries are executable (Fixes Permission Denied on Linux)
chmod -R +x node_modules/.bin/ 2>/dev/null

# Get IP address for display
LOCAL_IP=$(ip route get 1 | awk '{print $7;exit}')

echo "[INFO] Local access: http://localhost:3000"
echo "[INFO] Network access: http://$LOCAL_IP:3000"
echo "[INFO] Admin Panel (Hidden): http://localhost:3000/es/portal-admin-secret"

# Open browser (only loopback for safety)
(sleep 5 && xdg-open http://localhost:3000) &

# Start the Next.js development server on 0.0.0.0 to allow EXTERNAL IP / ZeroTier access
npm run dev -- -H 0.0.0.0
