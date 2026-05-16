@echo off
title GroomingPet Server
color 0A

echo ========================================================
echo   GROOMING PET - DEVELOPMENT SERVER LAUNCHER
echo ========================================================
echo.
echo [INFO] This script starts the Next.js server which handles:
echo        1. Frontend (Public Pages ^& Admin Panel)
echo        2. Backend (API Routes ^& Server Actions)
echo.
:: Wait for node_modules check
echo [STATUS] Listado de Direcciones IP disponibles:
echo --------------------------------------------------------
powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object @{Name='Interfaz';Expression={$_.InterfaceAlias}}, @{Name='IP';Expression={$_.IPAddress}} | Format-Table -HideTableHeaders"
echo --------------------------------------------------------
echo [LOCAL] http://localhost:3000
powershell -Command "$zt = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like '*ZeroTier*' } | Select-Object -First 1; if ($zt) { Write-Host \"[ZEROTIER] http://$($zt.IPAddress):3000\" -ForegroundColor Cyan }"
echo [ADMIN] http://localhost:3000/es/login-admin
echo.
echo [GUIA] LAN/WiFi suele empezar con 192.168.x.x
echo.

:: Open browser after 5 seconds to give server time to boot
start "" cmd /c "timeout /t 5 >nul && start http://localhost:3000"

:: Set trust host for ZeroTier access
set AUTH_TRUST_HOST=true
npm run dev -- -H 0.0.0.0

pause
