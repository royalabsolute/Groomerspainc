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
  icon: "hash" | "folder" | "activity" | "hard-drive" | "message" | "music" | "settings" | "home";
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
      { id: "bienvenida", label: "bienvenida", icon: "home", category: "GENERAL" },
      { id: "anuncios", label: "anuncios", icon: "hash", category: "GENERAL" },
    ],
  },
  grooming: {
    label: "Grooming Pet",
    color: "#23A55A",
    channels: [
      { id: "dashboard-grooming", label: "dashboard", icon: "hash", category: "GESTIÓN" },
      { id: "citas", label: "citas-del-dia", icon: "hash", category: "GESTIÓN" },
      { id: "clientes", label: "clientes", icon: "hash", category: "GESTIÓN" },
      { id: "productos", label: "productos", icon: "hash", category: "INVENTARIO" },
    ],
  },
  hotel: {
    label: "Módulo Hotelera",
    color: "#F43F5E",
    channels: [
      { id: "dashboard-hotel", label: "dashboard", icon: "hash", category: "GESTIÓN" },
      { id: "reservas", label: "reservas", icon: "hash", category: "GESTIÓN" },
      { id: "habitaciones", label: "habitaciones", icon: "hash", category: "GESTIÓN" },
    ],
  },
  it: {
    label: "Nexus IT Hub",
    color: "#FFa500",
    channels: [
      { id: "consola-minecraft", label: "consola-minecraft", icon: "hash", category: "CANALES DE TEXTO" },
      { id: "rendimiento-vps", label: "rendimiento-vps", icon: "activity", category: "CANALES DE TEXTO" },
      { id: "backups", label: "backups", icon: "hard-drive", category: "CANALES DE TEXTO" },
    ],
  },
  files: {
    label: "File Manager",
    color: "#A78BFA",
    channels: [
      { id: "minecraft-server", label: "/var/minecraft/server", icon: "folder", category: "SERVIDORES" },
      { id: "www-grooming", label: "/var/www/grooming", icon: "folder", category: "SERVIDORES" },
      { id: "www-nexus", label: "/var/www/absolute-nexus", icon: "folder", category: "APLICACIONES" },
      { id: "home-root", label: "/root", icon: "folder", category: "SISTEMA" },
    ],
  },
  chat: {
    label: "Chat Interno",
    color: "#60A5FA",
    channels: [
      { id: "general", label: "general", icon: "message", category: "CANALES DE TEXTO" },
      { id: "alertas-sistema", label: "alertas-sistema", icon: "hash", category: "CANALES DE TEXTO" },
      { id: "logs-automaticos", label: "logs-automaticos", icon: "hash", category: "AUTOMATIZACIÓN" },
    ],
  },
  spotify: {
    label: "Absolute Nexus Music",
    color: "#5865F2",
    channels: [
      { id: "now-playing", label: "buscar-y-reproducir", icon: "music", category: "REPRODUCCIÓN" },
    ],
  },
  settings: {
    label: "Configuración",
    color: "#949BA4",
    channels: [
      { id: "cuenta", label: "cuenta", icon: "hash", category: "PERSONAL" },
      { id: "seguridad", label: "seguridad", icon: "hash", category: "PERSONAL" },
      { id: "integraciones", label: "integraciones", icon: "hash", category: "SISTEMA" },
      { id: "variables-entorno", label: "variables-entorno", icon: "hash", category: "SISTEMA" },
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
