@echo off
title GroomingPet - PRODUCTION SERVER
color 0B

echo ========================================================
echo   GROOMING PET - PRODUCTION SERVER LAUNCHER
echo ========================================================
echo.
echo [INFO] Preparando entorno de produccion...
echo.

echo [1/4] Instalando dependencias (por si hay cambios)...
call npm install
echo.

echo [2/4] Generando cliente de Base de Datos (Prisma)...
call npx prisma generate
echo.

echo [3/4] Construyendo la version optimizada de la plataforma...
call npm run build
echo.

if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema al compilar la aplicacion. Revisa los errores arriba.
    pause
    exit /b %errorlevel%
)

echo [4/4] Iniciando el servidor en modo PRODUCCION...
echo.
echo ========================================================
echo La plataforma estara disponible en la red local y ZeroTier.
echo ========================================================
echo [STATUS] Listado de Direcciones IP disponibles:
echo --------------------------------------------------------
powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object @{Name='Interfaz';Expression={$_.InterfaceAlias}}, @{Name='IP';Expression={$_.IPAddress}} | Format-Table -HideTableHeaders"
echo --------------------------------------------------------
echo [LOCAL] http://localhost:3000
powershell -Command "$zt = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like '*ZeroTier*' } | Select-Object -First 1; if ($zt) { Write-Host \"[ZEROTIER] http://$($zt.IPAddress):3000\" -ForegroundColor Cyan }"
echo.
echo [GUIA] LAN/WiFi suele empezar con 192.168.x.x
echo ========================================================
echo.

:: Set trust host for ZeroTier access
set AUTH_TRUST_HOST=true
npm start -- -H 0.0.0.0

pause
