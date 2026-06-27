"use client";

import React from "react";
import {
  Home,
  Scissors,
  BedDouble,
  Terminal,
  FolderOpen,
  MessageSquare,
  Music,
  Settings,
} from "lucide-react";
import { useNav, GlobalModule, MODULE_CONFIG } from "@/context/NavigationContext";

// ─── Master Module definitions ────────────────────────────────────────────────

const MODULES: {
  id: GlobalModule;
  icon: React.ElementType;
  label: string;
}[] = [
  { id: "home",     icon: Home,         label: "Absolute Home" },
  { id: "grooming", icon: Scissors,     label: "CMS Groomers" },
  { id: "hotel",    icon: BedDouble,    label: "CMS Hospitality" },
  { id: "it",       icon: Terminal,     label: "Consola IT & VPS" },
  { id: "files",    icon: FolderOpen,   label: "File Manager" },
  { id: "chat",     icon: MessageSquare,label: "Chat" },
  { id: "spotify",  icon: Music,        label: "Música" },
  { id: "settings", icon: Settings,     label: "Configuración" },
];

// The separator goes between hotel and it (index 3 onward = utilities)
const SEPARATOR_AFTER: GlobalModule = "hotel";

// ─── Single pill item ─────────────────────────────────────────────────────────

function AppPill({
  id,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  id: GlobalModule;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = MODULE_CONFIG[id].color;

  return (
    <div className="relative group flex items-center justify-center w-full">
      {/* Active / hover indicator pill */}
      <div
        className={`absolute left-0 w-1 rounded-r-md bg-white transition-all duration-300 ${
          isActive ? "h-10" : "h-0 group-hover:h-5"
        }`}
      />

      {/* Icon button */}
      <button
        onClick={onClick}
        title={label}
        aria-label={label}
        className={`flex items-center justify-center w-12 h-12 transition-all duration-300 ${
          isActive
            ? "rounded-2xl text-white shadow-lg"
            : "rounded-3xl bg-[#313338] text-[#B5BAC1] hover:rounded-2xl hover:text-white"
        }`}
        /* eslint-disable-next-line react/jsx-no-inline-styles */
        style={
          isActive
            ? { backgroundColor: color }
            : { ["--hover-bg" as string]: color }
        }
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = color;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
          }
        }}
      >
        {id === "home" ? (
          <img src="/Favicon.svg" alt="Royal Absolute" className="w-7 h-7 object-contain" />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </button>

      {/* Floating tooltip */}
      <div className="absolute left-[80px] bg-[#111214] text-white text-xs font-semibold px-3 py-1.5 rounded shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap border border-[#2B2D31]">
        {label}
        {/* Arrow */}
        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-[#111214]" />
      </div>
    </div>
  );
}

// ─── Main AppSidebar ──────────────────────────────────────────────────────────

export default function AppSidebar() {
  const { state, setModule, setChannel } = useNav();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get("module") as GlobalModule;
      const chan = params.get("channel");
      if (mod && MODULE_CONFIG[mod]) {
        setModule(mod);
        if (chan) {
          setChannel(chan);
        }
        // Clean query parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [setModule, setChannel]);

  return (
    <aside className="w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto overflow-x-hidden scrollbar-none">
      {MODULES.map((mod) => (
        <React.Fragment key={mod.id}>
          <AppPill
            id={mod.id}
            icon={mod.icon}
            label={mod.label}
            isActive={state.activeModule === mod.id}
            onClick={() => {
              if (typeof window !== "undefined") {
                const pathParts = window.location.pathname.split("/").filter(Boolean);
                const locale = (pathParts[0] === "es" || pathParts[0] === "en") ? pathParts[0] : "es";
                
                if (mod.id === "hotel") {
                  window.location.href = `/${locale}/admin/hospitality`;
                } else if (mod.id === "grooming") {
                  window.location.href = `/${locale}/admin/dashboard`;
                } else if (mod.id === "home") {
                  window.location.href = `/${locale}/admin`;
                } else {
                  // Checks if we are currently on the main SPA admin dashboard page
                  const isOnMainAdmin = window.location.pathname.endsWith("/admin") || window.location.pathname.endsWith("/admin/");
                  if (!isOnMainAdmin) {
                    window.location.href = `/${locale}/admin?module=${mod.id}`;
                  } else {
                    setModule(mod.id);
                  }
                }
              }
            }}
          />
          {/* Horizontal divider after the defined separator */}
          {mod.id === SEPARATOR_AFTER && (
            <div className="w-8 h-[2px] bg-[#35363C] rounded my-1 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </aside>
  );
}
