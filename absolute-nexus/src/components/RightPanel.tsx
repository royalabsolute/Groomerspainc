"use client";

import React from "react";
import {
  Server,
  ShieldCheck,
  UserCheck,
  Users,
  FolderOpen,
  Music,
  MessageSquare,
  Scissors,
  BedDouble,
  Home,
  Settings,
} from "lucide-react";
import { useNav, MODULE_CONFIG } from "@/context/NavigationContext";

// ─── Props from IT module (passed as optional) ────────────────────────────────
interface RightPanelProps {
  cpuUsage?: number;
  ramUsage?: number;
  serverStatus?: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE";
  playersCount?: number;
}

export default function RightPanel({
  cpuUsage = 0,
  ramUsage = 0,
  serverStatus = "OFFLINE",
  playersCount = 0,
}: RightPanelProps) {
  const { state } = useNav();
  const { activeModule } = state;
  const config = MODULE_CONFIG[activeModule];

  return (
    <aside className="w-60 bg-[#2B2D31] flex flex-col p-4 border-l border-[#1F2023] flex-shrink-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1E1F22]">
      {activeModule === "it" && (
        <ITRightPanel
          cpuUsage={cpuUsage}
          ramUsage={ramUsage}
          serverStatus={serverStatus}
          playersCount={playersCount}
        />
      )}
      {activeModule === "files" && <FilesRightPanel />}
      {activeModule === "grooming" && <GroomingRightPanel />}
      {activeModule === "hotel" && <HotelRightPanel />}
      {activeModule === "chat" && <ChatRightPanel />}
      {activeModule === "spotify" && <SpotifyRightPanel />}
      {activeModule === "home" && <HomeRightPanel />}
      {activeModule === "settings" && <SettingsRightPanel />}
    </aside>
  );
}

// ─── Section header helper ────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold text-[#949BA4] tracking-wider uppercase mb-3 flex items-center gap-1">
      {children}
    </h2>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: string }) {
  return (
    <div className="flex justify-between items-center bg-[#1E1F22] p-2 rounded border border-[#1F2023]">
      <span className="text-[#949BA4] text-[11px] font-mono">{label}</span>
      {highlight ? (
        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${highlight}`}>{value}</span>
      ) : (
        <span className="font-semibold text-xs text-white font-mono select-all">{value as string}</span>
      )}
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] font-mono text-[#DBDEE1]">
        <span className="text-[#949BA4]">{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── IT Right Panel ───────────────────────────────────────────────────────────
function ITRightPanel({ cpuUsage, ramUsage, serverStatus, playersCount }: Required<RightPanelProps>) {
  return (
    <>
      {/* Players online */}
      <div className="space-y-3 mb-6">
        <SectionHeader>
          <Users className="w-3.5 h-3.5" />
          Jugadores en línea — {playersCount}
        </SectionHeader>

        <div className="space-y-2">
          <PlayerRow initials="JG" color="#FFa500" name="Jagger" role="OP / Owner" roleColor="text-[#FFa500]" icon={<ShieldCheck className="w-3.5 h-3.5 text-[#FFa500]" />} />
          {playersCount >= 2 && (
            <PlayerRow initials="ST" color="#5865F2" name="Steve" role="Moderador" roleColor="text-blue-400" icon={<UserCheck className="w-3.5 h-3.5 text-blue-400" />} />
          )}
          {playersCount >= 3 && (
            <PlayerRow initials="AL" color="#23A55A" name="Alex" role="Miembro" roleColor="text-[#949BA4]" />
          )}
        </div>
      </div>

      {/* VPS State */}
      <div className="space-y-3">
        <SectionHeader>
          <Server className="w-3.5 h-3.5 text-[#23A55A]" />
          Estado VPS KVM4
        </SectionHeader>

        <div className="space-y-2">
          <InfoRow label="IP Nodo:" value="2.24.104.9" />
          <ProgressBar label="RAM:" value={ramUsage} max={16} color="#5865F2" />
          <ProgressBar label="CPU:" value={cpuUsage} max={100} color="#23A55A" />
          <InfoRow label="SSH Port:" value="ONLINE (22)" highlight="bg-[#23A55A]/20 text-[#23A55A]" />
          <InfoRow
            label="RCON Port:"
            value={`${serverStatus === "RUNNING" ? "ONLINE" : "OFFLINE"} (25575)`}
            highlight={serverStatus === "RUNNING" ? "bg-[#23A55A]/20 text-[#23A55A]" : "bg-red-500/20 text-red-500"}
          />
          <InfoRow
            label="Game Port:"
            value={`${serverStatus === "RUNNING" ? "ONLINE" : "OFFLINE"} (25565)`}
            highlight={serverStatus === "RUNNING" ? "bg-[#23A55A]/20 text-[#23A55A]" : "bg-red-500/20 text-red-500"}
          />
        </div>
      </div>
    </>
  );
}

function PlayerRow({
  initials, color, name, role, roleColor, icon,
}: {
  initials: string; color: string; name: string;
  role: string; roleColor: string; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 p-1 hover:bg-[#35373C]/60 rounded cursor-pointer transition">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs" style={{ backgroundColor: color, color: "#000" }}>
          {initials}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23A55A] rounded-full border-[2.5px] border-[#2B2D31]" />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-semibold text-white flex items-center gap-1">
          {name} {icon}
        </span>
        <span className={`text-[10px] ${roleColor}`}>{role}</span>
      </div>
    </div>
  );
}

// ─── Files Right Panel ────────────────────────────────────────────────────────
function FilesRightPanel() {
  return (
    <div className="space-y-3">
      <SectionHeader>
        <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
        Info de Ruta
      </SectionHeader>
      <div className="space-y-2 text-[11px] font-mono text-[#DBDEE1]">
        <InfoRow label="Servidor" value="2.24.104.9" />
        <InfoRow label="Usuario" value="root" />
        <InfoRow label="Protocolo" value="SFTP/22" />
        <InfoRow label="Permisos" value="ONLINE" highlight="bg-[#23A55A]/20 text-[#23A55A]" />
      </div>
      <div className="mt-4 space-y-1">
        <SectionHeader>Accesos Directos</SectionHeader>
        {["/var/minecraft/server", "/var/www/grooming", "/var/www/absolute-nexus", "/root"].map(p => (
          <div key={p} className="flex items-center gap-2 p-1.5 hover:bg-[#35373C]/60 rounded cursor-pointer transition-colors">
            <FolderOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-[11px] text-[#B5BAC1] font-mono truncate">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Grooming Right Panel ─────────────────────────────────────────────────────
function GroomingRightPanel() {
  return (
    <div className="space-y-3">
      <SectionHeader>
        <Scissors className="w-3.5 h-3.5 text-[#23A55A]" />
        Resumen del Día
      </SectionHeader>
      <div className="space-y-2">
        <InfoRow label="Citas Hoy" value="7" />
        <InfoRow label="Completadas" value="3" highlight="bg-[#23A55A]/20 text-[#23A55A]" />
        <InfoRow label="Pendientes" value="4" highlight="bg-[#FFa500]/20 text-[#FFa500]" />
        <InfoRow label="Facturación" value="$1,240" />
      </div>
    </div>
  );
}

// ─── Hotel Right Panel ────────────────────────────────────────────────────────
function HotelRightPanel() {
  return (
    <div className="space-y-3">
      <SectionHeader>
        <BedDouble className="w-3.5 h-3.5 text-[#F43F5E]" />
        Ocupación Hotel
      </SectionHeader>
      <div className="space-y-2">
        <InfoRow label="Habitaciones" value="12" />
        <InfoRow label="Ocupadas" value="8" highlight="bg-[#F43F5E]/20 text-[#F43F5E]" />
        <InfoRow label="Disponibles" value="4" highlight="bg-[#23A55A]/20 text-[#23A55A]" />
        <InfoRow label="Check-ins Hoy" value="2" />
      </div>
    </div>
  );
}

// ─── Chat Right Panel ─────────────────────────────────────────────────────────
function ChatRightPanel() {
  return (
    <div className="space-y-3">
      <SectionHeader>
        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
        Usuarios en Línea — 1
      </SectionHeader>
      <PlayerRow initials="JG" color="#FFa500" name="Jagger" role="Admin General" roleColor="text-[#FFa500]" icon={<ShieldCheck className="w-3.5 h-3.5 text-[#FFa500]" />} />
    </div>
  );
}

// ─── Spotify Right Panel ──────────────────────────────────────────────────────
function SpotifyRightPanel() {
  return (
    <div className="space-y-3">
      <SectionHeader>
        <Music className="w-3.5 h-3.5 text-[#1DB954]" />
        En Reproducción
      </SectionHeader>
      <div className="bg-[#1E1F22] rounded-lg p-3 border border-[#1F2023] space-y-2">
        <div className="w-full aspect-square rounded bg-[#313338] flex items-center justify-center">
          <Music className="w-10 h-10 text-[#1DB954]" />
        </div>
        <p className="text-xs text-[#949BA4] text-center">Conecta Spotify para ver tu canción actual</p>
      </div>
    </div>
  );
}

// ─── Home Right Panel ─────────────────────────────────────────────────────────
function HomeRightPanel() {
  return (
    <div className="space-y-3">
      <SectionHeader>
        <Home className="w-3.5 h-3.5 text-[#5865F2]" />
        Estado Global
      </SectionHeader>
      <div className="space-y-2">
        <InfoRow label="Grooming" value="ONLINE" highlight="bg-[#23A55A]/20 text-[#23A55A]" />
        <InfoRow label="IT / VPS" value="ONLINE" highlight="bg-[#23A55A]/20 text-[#23A55A]" />
        <InfoRow label="Hotelera" value="STANDBY" highlight="bg-[#FFa500]/20 text-[#FFa500]" />
        <InfoRow label="Nexus Panel" value="ONLINE" highlight="bg-[#23A55A]/20 text-[#23A55A]" />
      </div>
    </div>
  );
}

// ─── Settings Right Panel ─────────────────────────────────────────────────────
function SettingsRightPanel() {
  return (
    <div className="space-y-3">
      <SectionHeader>
        <Settings className="w-3.5 h-3.5 text-[#949BA4]" />
        Sesión Actual
      </SectionHeader>
      <div className="space-y-2">
        <InfoRow label="Usuario" value="Admin-Nexus" />
        <InfoRow label="Rol" value="ADMIN_GENERAL" highlight="bg-[#FFa500]/20 text-[#FFa500]" />
        <InfoRow label="Auth" value="JWT" highlight="bg-[#5865F2]/20 text-[#5865F2]" />
      </div>
    </div>
  );
}
