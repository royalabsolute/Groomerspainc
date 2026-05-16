# Guía de Despliegue - GroomingPet

Este documento resume la estrategia y pasos necesarios para lanzar la plataforma a producción.

## OPCIÓN A: Hostinger (Todo en uno - VPS)
*   **Ideal para**: Quienes quieren un costo fijo mensual y tener todo (Dominio + Servidor + BD) bajo el mismo techo.
*   **Servicio**: Hostinger **VPS Hosting** (Mínimo KVM 1 o KVM 2).
*   **Base de Datos**: Se instala dentro del VPS (MySQL o PostgreSQL).
*   **Costo**: ~$5 - $10 USD mensuales (Servidor) + ~$15 USD anuales (Dominio).

## OPCIÓN B: Vercel + Supabase (Nube - Más escalable)
*   **Ideal para**: Quienes prefieren facilidad de despliegue y no quieren administrar un servidor Linux.
*   **Servicio**: Vercel (Hosting) + Supabase (Base de Datos).
*   **Costo**: $0 USD (Hobby) + ~$15 USD anuales (Dominio).

## 3. Pasos para el Lanzamiento
## Pasos para Hostinger (VPS)
1.  **Comprar Dominio y VPS**:
    *   Elige un VPS con Ubuntu 22.04 o similar.
2.  **Configurar el Servidor (SSH)**:
    *   Instalar Node.js (v18+).
    *   Instalar MySQL o PostgreSQL localmente.
    *   Instalar PM2 (`npm install -g pm2`) para que la app no se apague.
3.  **Desplegar Código**:
    *   Subir el código via Git o FTP.
    *   Ejecutar `npm install`, `npx prisma db push`, `npm run build`.
4.  **Lanzar con PM2**:
    *   `pm2 start npm --name "grooming-pet" -- start`.
5.  **Proxy Inverso (Nginx)**:
    *   Configurar Nginx para que redirija el tráfico del dominio al puerto 3000.

## Pasos para Vercel + Supabase (Cloud)
1.  **Crear Proyecto en Supabase**:
    *   Ir a [supabase.com](https://supabase.com).
    *   Crear proyecto "GroomingPet".
    *   Obtener `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
2.  **Configurar Base de Datos**:
    *   Actualizar `schema.prisma` para usar `postgresql`.
    *   Ejecutar `npx prisma db push`.
3.  **Configurar Almacenamiento**:
    *   Crear un Bucket público llamado `grooming-pet`.
4.  **Despliegue en Vercel**:
    *   Subir el código a GitHub.
    *   Conectar el repositorio a Vercel.
    *   Configurar las Variables de Entorno (.env) en el panel de Vercel.
5.  **Configurar Dominio**:
    *   En Vercel: Settings > Domains > Add.

## 4. Notas Técnicas Importantes
*   **Seguridad**: Se ha activado `AUTH_TRUST_HOST=true` para permitir el login desde IPs como ZeroTier.
*   **Imágenes Locales**: Están usando `unoptimized` para evitar errores 400 en servidores locales. Al pasar a Supabase Storage, este parámetro podrá revisarse.
*   **Responsividad**: El formulario de citas ha sido optimizado con variables de tamaño fluidas (`h-9` a `h-11`, bordes y sombras reducidos en pantallas pequeñas) para garantizar que quepa en portátiles de 13"-15" sin scroll excesivo.
*   **Gestión de Cupones**: Ahora permite seleccionar entre monto fijo ($) o porcentaje (%). La lista de citas muestra automáticamente el valor del cupón usado.
