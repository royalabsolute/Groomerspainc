@echo off
title GroomingPet - PRODUCTION SERVER
color 0B

echo ========================================================
echo   GROOMING PET - PRODUCTION SERVER LAUNCHER
echo ========================================================
echo.
echo [INFO] Preparando entorno de produccion...
echo.

echo [1/6] Instalando dependencias (por si hay cambios)...
call npm install
echo.

echo [2/6] Generando cliente de Base de Datos (Prisma)...
call npx prisma generate
echo.

echo [3/6] Sincronizando esquema de base de datos...
call npx prisma db push --accept-data-loss
echo.

echo [4/6] Creando/Actualizando usuario admin en base de datos...
call npx prisma db seed
echo.

echo [5/6] Construyendo la version optimizada de la plataforma...
call npm run build
echo.

if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema al compilar la aplicacion. Revisa los errores arriba.
    pause
    exit /b %errorlevel%
)

echo [6/6] Iniciando el servidor en modo PRODUCCION...
echo.
echo ========================================================
echo La plataforma estara disponible en la red local y ZeroTier.
echo ========================================================
echo [STATUS] Listado de Direcciones IP disponibles:
echo --------------------------------------------------------
powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object @{Name='Interfaz';Expression={$_.InterfaceAlias}}, @{Name='IP';Expression={$_.IPAddress}} | Format-Table -HideTableHeaders"
echo --------------------------------------------------------
echo [LOCAL] http://localhost:3000
echo [ADMIN] http://localhost:3000/es/login-admin
powershell -Command "$zt = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like '*ZeroTier*' } | Select-Object -First 1; if ($zt) { Write-Host \"[ZEROTIER] http://$($zt.IPAddress):3000\" -ForegroundColor Cyan }"
echo.
echo [CREDENCIALES ADMIN]
echo   Email: groomersincpetspa@gmail.com
echo   Pass:  Mega1321@
echo ========================================================
echo.

:: Set trust host for ZeroTier access
set AUTH_TRUST_HOST=true
npm start -- -H 0.0.0.0

pause
