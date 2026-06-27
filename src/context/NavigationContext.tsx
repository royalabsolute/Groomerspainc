"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";

// ─── Module & Channel Types ───────────────────────────────────────────────────

export type GlobalModule =
  | "home"
  | "grooming"
  | "hotel"
  | "it"
  | "files"
  | "chat"
  | "spotify"
  | "settings";

// Each module defines a list of "channels" (its secondary sidebar items)
export interface Channel {
  id: string;
  label: string;
  icon:
    | "hash"
    | "folder"
    | "activity"
    | "hard-drive"
    | "message"
    | "music"
    | "settings"
    | "home"
    | "terminal"
    | "archive"
    | "calendar"
    | "users"
    | "package"
    | "user"
    | "shield"
    | "cpu"
    | "database"
    | "code";
  category?: string; // category header above this channel
}

// ─── Module Config ────────────────────────────────────────────────────────────

export const MODULE_CONFIG: Record<
  GlobalModule,
  { label: string; color: string; channels: Channel[] }
> = {
  home: {
    label: "Absolute Home",
    color: "#5865F2",
    channels: [
      { id: "bienvenida", label: "Bienvenida", icon: "home", category: "GENERAL" },
      { id: "anuncios", label: "Anuncios", icon: "message", category: "GENERAL" },
    ],
  },
  grooming: {
    label: "CMS Groomers",
    color: "#23A55A",
    channels: [
      { id: "dashboard-grooming", label: "Dashboard", icon: "activity", category: "GESTIÓN" },
      { id: "inquiries", label: "Solicitudes de Citas", icon: "calendar", category: "GESTIÓN" },
      { id: "users", label: "Clientes y Usuarios", icon: "users", category: "GESTIÓN" },
      { id: "services", label: "Servicios y Precios", icon: "package", category: "CONFIGURACIÓN" },
      { id: "cupones", label: "Cupones Descuento", icon: "archive", category: "CONFIGURACIÓN" },
      { id: "zonas", label: "Zonas de Servicio", icon: "folder", category: "CONFIGURACIÓN" },
      { id: "finanzas", label: "Finanzas y Caja", icon: "activity", category: "NEGOCIO" },
      { id: "testimonials", label: "Testimonios Clientes", icon: "message", category: "PORTAL PÚBLICO" },
      { id: "gallery", label: "Galería de Fotos", icon: "folder", category: "PORTAL PÚBLICO" },
      { id: "transformaciones", label: "Transformaciones", icon: "folder", category: "PORTAL PÚBLICO" },
      { id: "config", label: "Configuración General", icon: "settings", category: "SISTEMA" },
    ],
  },
  hotel: {
    label: "CMS Hospitality",
    color: "#F43F5E",
    channels: [
      { id: "dashboard-hotel", label: "Dashboard", icon: "activity", category: "GESTIÓN" },
      { id: "reservas", label: "Habitaciones y Tarifas", icon: "home", category: "GESTIÓN" },
      { id: "habitaciones", label: "Textos Bilingües CMS", icon: "message", category: "GESTIÓN" },
    ],
  },
  it: {
    label: "Nexus IT Hub",
    color: "#FFa500",
    channels: [
      { id: "consola-minecraft", label: "Consola Minecraft", icon: "terminal", category: "PANEL DE CONTROL" },
      { id: "rendimiento-vps", label: "Rendimiento VPS", icon: "activity", category: "PANEL DE CONTROL" },
      { id: "configuracion-juego", label: "Configuración de Juego", icon: "settings", category: "PANEL DE CONTROL" },
      { id: "backups", label: "Backups", icon: "database", category: "PANEL DE CONTROL" },
    ],
  },
  files: {
    label: "File Manager",
    color: "#A78BFA",
    channels: [
      { id: "home-root", label: "Raíz VPS", icon: "folder", category: "ACCESOS DIRECTOS" },
      { id: "minecraft-server", label: "Servidor Minecraft", icon: "folder", category: "ACCESOS DIRECTOS" },
      { id: "www-grooming", label: "Groomers Inc", icon: "folder", category: "ACCESOS DIRECTOS" },
    ],
  },
  chat: {
    label: "Chat Interno",
    color: "#60A5FA",
    channels: [
      { id: "general", label: "# general", icon: "message", category: "CANALES DE TEXTO" },
      { id: "alertas-sistema", label: "# alertas", icon: "hash", category: "CANALES DE TEXTO" },
      { id: "logs-automaticos", label: "# logs-automaticos", icon: "hash", category: "AUTOMATIZACIÓN" },
    ],
  },
  spotify: {
    label: "Absolute Nexus Music",
    color: "#5865F2",
    channels: [
      { id: "now-playing", label: "buscar-y-reproducir", icon: "music", category: "REPRODUCCIÓN" },
      { id: "playlists", label: "Mis Playlists", icon: "music", category: "BIBLIOTECA" },
    ],
  },
  settings: {
    label: "Configuración",
    color: "#949BA4",
    channels: [
      { id: "cuenta", label: "Cuenta", icon: "user", category: "PERSONAL" },
      { id: "seguridad", label: "Seguridad", icon: "shield", category: "PERSONAL" },
      { id: "integraciones", label: "Integraciones", icon: "cpu", category: "SISTEMA" },
      { id: "usuarios", label: "Gestión de Usuarios", icon: "users", category: "SISTEMA" },
      { id: "variables-entorno", label: "Variables de Entorno", icon: "code", category: "SISTEMA" },
    ],
  },
};

// ─── State & Actions ──────────────────────────────────────────────────────────

interface NavState {
  activeModule: GlobalModule;
  activeChannel: string;
}

type NavAction =
  | { type: "SET_MODULE"; module: GlobalModule }
  | { type: "SET_CHANNEL"; channel: string };

function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case "SET_MODULE": {
      const firstChannel = MODULE_CONFIG[action.module].channels[0]?.id ?? "";
      return { activeModule: action.module, activeChannel: firstChannel };
    }
    case "SET_CHANNEL":
      return { ...state, activeChannel: action.channel };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface NavContextValue {
  state: NavState;
  setModule: (module: GlobalModule) => void;
  setChannel: (channel: string) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(navReducer, {
    activeModule: "it",
    activeChannel: "consola-minecraft",
  });

  const setModule = useCallback((module: GlobalModule) => {
    dispatch({ type: "SET_MODULE", module });
  }, []);

  const setChannel = useCallback((channel: string) => {
    dispatch({ type: "SET_CHANNEL", channel });
  }, []);

  return (
    <NavContext.Provider value={{ state, setModule, setChannel }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside <NavigationProvider>");
  return ctx;
}
