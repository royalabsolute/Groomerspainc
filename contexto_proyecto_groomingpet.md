📝 DOCUMENTO DE CONTEXTO MAESTRO: PROYECTO GROOMINGPET
1. Perfil del Proyecto y Entorno Técnico
Nombre de la Aplicación: GroomingPet (Groomers Inc.)

Modelo de Negocio: Servicio premium de mobile pet grooming (estética canina a domicilio sobre ruedas con van totalmente equipada) operando en el estado de Florida, EE.UU. (enfocado en condados de Miami-Dade y Broward / zonas como Miami y Fort Lauderdale).

Arquitectura Tecnológica: Next.js 15+, Tailwind CSS v4, Prisma ORM configurado nativamente para PostgreSQL, y enrutamiento/traducción bilingüe estricta con next-intl (Inglés / Español).

Estilo Visual (UI): Neo-Brutalista premium (bordes oscuros rígidos de 4px, sombras marcadas, contrastes limpios). Debe existir simetría absoluta de componentes e información entre las vistas de PC (escritorio) y el responsive de teléfono.

Infraestructura de Servidor: Servidor VPS KVM 4 en Hostinger (Linux Ubuntu/Debian), usando PM2 para el manejo de procesos en clúster y Nginx como proxy inverso (diseñado de forma modular para albergar múltiples proyectos independientes en el futuro apuntando a diferentes puertos).

Dominio Oficial en Producción: https://groomersincathome.com

Configuración SMTP (Gmail): Configurado con credenciales oficiales (groomersincpetspa@gmail.com) utilizando contraseñas de aplicación de Google de 16 dígitos para resolver por completo errores de autenticación EAUTH en Nodemailer. Puerto 465 con SSL activo.

Almacenamiento de Imágenes: Las imágenes cargadas se guardan de manera local y persistente en el disco NVMe del propio VPS (arquitectura KVM no efímera).

2. Reingeniería Masiva de la UI Pública (Sección Unificada)
Se ELIMINA por completo la estructura antigua que dividía la página en tarjetas estáticas de paquetes fijos ("Baño Completo $100", "Corte y Estilo $100") y un bloque de "Contáctanos" fragmentado al final.

Estructura del nuevo componente unificado: "Cotiza tu Servicio / Quote Your Service"
Este bloque se ubicará en la parte superior, justo donde estaba la antigua sección de servicios.

Aprovechamiento del Espacio en Escritorio (Desktop): Layout de alta eficiencia horizontal dividido en columnas.

Columna Izquierda: Datos de contacto del dueño, dirección en Florida y ficha de la mascota.

Columna Derecha: Módulo dinámico de servicios inyectados desde la base de datos y cálculo de tarifa estimada en tiempo real.

Adaptación Móvil (Responsive): El contenedor colapsa verticalmente de manera fluida y limpia en teléfonos, garantizando que el usuario no pierda experiencia táctil, paridad de datos ni validaciones.

Anclaje de Galería: El carrusel/carril de imágenes estéticas de las mascotas se desplaza para renderizarse justo debajo de este gran bloque unificado de cotización.

3. Especificaciones del Motor de Cotización Dinámica y Base de Datos
A. Base de Datos de Servicios Administrables (prisma/schema.prisma)
El formulario ya no posee opciones rígidas o inyectadas en código duro (<select> estáticos). Se requiere el modelo en PostgreSQL:

Modelo ServiceItem: Campos: id (CUID/UUID), nameEs, nameEn, category (Enum: MAIN_GROOMING para servicios núcleo de corte/baño, ADDON_TREATMENT para limpiezas/tratos específicos, SPECIAL_SHAMPOO para baños medicados), basePrice (Tipo Decimal @db.Decimal(10, 2)) y isActive (Boolean).

Panel Admin CRUD (/admin/servicios): Interfaz para añadir servicios, asignarles su precio base estándar, categorizarlos y prender/apagar un Switch de "Activo" para poner o quitar opciones del formulario del cliente de inmediato sin romper registros antiguos.

B. Lógica del Estimado y Solución al Congelamiento del Paso 4
El Algoritmo: El frontend suma en tiempo real las tarifas de los servicios seleccionados según las variables ingresadas: Precio Estimado = (Base por Rango de Peso de la Mascota) + (Costo de Servicio Base elegido) + (Suma de Add-ons marcados).

Reparación del Envío (submitInquiry): El Server Action debe recibir el paquete de datos unificado: Dueño, teléfono, correo, dirección exacta (con código postal válido de Florida), peso en libras, switch de vacuna de la rabia al día, array de IDs de servicios elegidos, foto cargada y el estado de aceptación de términos legales. El backend guarda en la tabla QuoteRequest con estado PENDING_REVIEW y redirige a la pantalla de éxito sin congelarse.

Cláusula Legal Obligatoria (Bilingüe): Checkbox obligatorio (required) donde el usuario declara que la vacuna de la rabia está al día según las leyes de Florida y acepta que el precio mostrado en pantalla es un aproximado provisional sujeto a reajustes (mayor o menor) por el administrador tras la inspección física de la mascota (por nudos/matting o temperamento).

4. Panel de Administración: Gestión de Cotizaciones y Cierre de Ventas
En la sección de revisión de solicitudes en el panel de administración:

El administrador visualiza el expediente completo de la solicitud: Datos del perro (raza, peso, edad), la foto (vital para evaluar nudos), la dirección y el desglose de servicios.

Se muestra claramente el systemEstimatedPrice calculado automáticamente.

Se incluye un campo interactivo obligatorio llamado finalAdminPrice donde el administrador puede ajustar el precio de forma manual (subirlo por nudos extremos o bajarlo por cortesía).

Al guardar el precio final, el estado pasa a PRICED y se habilitan dos botones dinámicos de acción rápida usando ese valor corregido:

Generador de Enlace de WhatsApp: Construye un enlace directo (https://wa.me/...) con un mensaje profesional pre-redactado bilingüe (según el idioma del cliente) que incluye el nombre, mascota, hora propuesta y el precio final oficial para cerrar el trato en un clic.

Despachador de Correo HTML (Nodemailer): Envía un correo elegante usando el SMTP configurado con un botón interactivo de "Aceptar Cotización". Al hacer clic, el estado de la cita cambia automáticamente a CONFIRMED y bloquea el calendario.

5. Módulo de Transformaciones (Casos de Éxito - Separado)
Este módulo opera de forma aislada a las cotizaciones para mantener un código limpio:

Base de Datos: El modelo Transformation guarda obligatoriamente metadatos estructurados e indexados en PostgreSQL: petName, breed (Raza), age (Edad), serviceDate (Fecha del servicio), campos independientes para "Foto Antes" y "Foto Después", y una descripción técnica corta redactada por el administrador (ej: remoción de nudos, corte específico).

Panel de Admin (/admin/transformaciones): Formulario responsivo y simétrico bilingüe para subir los casos de éxito con cargador de imágenes doble.

Vista Pública (/[locale]/transformaciones): Renderiza los casos mediante un deslizador táctil responsivo, mostrando la ficha técnica de la mascota de manera elegante en el idioma seleccionado.

6. Ajuste Crítico de UI: Renderizado de Logos
En todos los componentes donde se carguen logos (Navbar público y panel de administración), los contenedores no deben forzar fondos negros (bg-black o similares). Las clases de Tailwind deben modificarse para que los logos en formato .png o .svg con fondo transparente se adapten de forma limpia al fondo general de la aplicación.

7. Plan de Despliegue en Servidor (Guía de Consola SSH)
Para la puesta en marcha en el VPS KVM 4 de Hostinger, se ejecutarán los siguientes comandos estructurados como usuario root:

Paso A: Preparación del Entorno e Instalación de PostgreSQL
Bash
# Actualizar el sistema operativo
apt update && apt upgrade -y

# Instalar herramientas básicas y Nginx
apt install git curl nginx -y

# Instalar Node.js utilizando NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Instalar PM2 de forma global
npm install pm2 -g

# Instalar y configurar PostgreSQL de forma nativa
apt install postgresql postgresql-contrib -y
sudo -i -u postgres psql -c "CREATE USER groomer_admin WITH PASSWORD 'TuContraseñaSeguraAquí';"
sudo -i -u postgres psql -c "CREATE DATABASE groomingpet_prod OWNER groomer_admin;"
Paso B: Clonación, Sincronización de Base de Datos y Compilación
Bash
# Clonar el proyecto en el directorio del servidor
cd /var/www
git clone https://github.com/TuUsuario/GroomingPet.git
cd GroomingPet

# Crear el archivo de entorno de producción (.env.production)
# Nota: Configurar aquí la DATABASE_URL con los datos creados arriba, el AUTH_SECRET,
# la URL https://groomersincathome.com y las credenciales SMTP de Gmail.
nano .env.production

# Instalar dependencias del proyecto
npm install

# Empujar el esquema de Prisma y generar los tipos del cliente para PostgreSQL
npx prisma db push
npx prisma generate

# Compilar la aplicación Next.js
npm run build

# Levantar la aplicación en segundo plano con PM2 en modo clúster
pm2 start npm --name "groomingpet-app" -- substart -- run start -- -p 3000
pm2 save
pm2 startup
Paso C: Configuración del Proxy Inverso en Nginx (Multi-Proyecto)
Editar el archivo de configuración de Nginx (nano /etc/nginx/sites-available/default) para mapear el dominio oficial hacia el puerto interno y servir la carpeta de subidas locales de forma eficiente:

Nginx
server {
    listen 80;
    server_name groomersincathome.com www.groomersincathome.com;

    # Proxy inverso para la aplicación Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        cache_bypass $http_upgrade;
    }

    # Ruta para servir las imágenes de mascotas subidas localmente
    location /uploads/ {
        alias /var/www/GroomingPet/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
Bash
# Validar y reiniciar el servidor web Nginx
nginx -t
systemctl restart nginx