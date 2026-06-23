# Arquitectura de Software de Absolute Nexus

Este documento describe la infraestructura híbrida y el flujo de datos del ERP central.

## 1. Servidor Híbrido (Next.js + Custom server.js)
El proyecto corre sobre un servidor Node.js unificado (`server.js`) que integra:
- El ruteador de Next.js (App Router) para endpoints REST API tradicionales y SSR.
- Un servidor HTTP nativo que monta una instancia de Socket.io para la comunicación en tiempo real.

## 2. Redirección y Distribución de Rutas

### Rutas Manejadas por Next.js REST API
- `/api/auth/*` -> Autenticación de usuarios vía Auth.js.
- `/api/minecraft/*` -> Control de estado y lectura de propiedades de Minecraft (Fabric).
- `/api/vps/*` -> Consulta de telemetría de rendimiento y explorador de archivos.
- `/api/music/search` -> Consultas instantáneas de canciones a YouTube.
- `/api/music/stream` -> Proxy streaming de audio InnerTube/Local.

### Protocolo de Tiempo Real (Socket.io)
- **Namespace `/` (Default)**:
  - Evento `telemetry-stream` (emisión cada 2s del estado de puertos y hardware del VPS).
  - Evento `console-stream` (tail de logs del Minecraft en tiempo real).
  - Evento `console-cmd` / `console-cmd-response` (envío y retorno RCON directo).
- **Namespace `/chat`**:
  - Mensajería instantánea en salas virtuales, control de estados de escritura, reacciones y carga de archivos.

## 3. Modelo de Datos Central (Esquema Prisma)
- **User / Session / Account** -> Seguridad y perfiles.
- **SiteConfig** -> Configuraciones globales persistentes (direcciones IP, puertos, rutas de sistema).
- **Song / Lyrics / Playlist** -> Biblioteca de streaming musical.
- **Channel / Message / Reaction** -> Estructura de canales de comunicación corporativa.
