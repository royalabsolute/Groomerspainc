"use client";

/**
 * ContentArea.tsx
 *
 * The central panel (flex-1, bg-[#313338]).
 * Renders different views depending on activeModule + activeChannel.
 * All heavy view logic (Minecraft console, FileExplorer, etc.) lives here,
 * keeping page.tsx as a thin shell.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Hash,
  Bell,
  Pin,
  Users,
  Search,
  Play,
  Square,
  RotateCw,
  Send,
  Terminal,
  Cpu,
  HardDrive,
  Activity,
  Server,
  Home,
  Scissors,
  BedDouble,
  Music,
  MessageSquare,
  Settings,
  FolderOpen,
} from "lucide-react";
import { useNav, MODULE_CONFIG } from "@/context/NavigationContext";
import FileExplorer from "@/components/FileExplorer";

// ─── Props passed from page.tsx (server state) ────────────────────────────────
interface ContentAreaProps {
  // Server stats (only used by IT module)
  serverStatus: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE";
  setServerStatus: (s: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE") => void;
  consoleLogs: string[];
  setConsoleLogs: (logs: string[]) => void;
  uptime: string;
  playersCount: number;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
}

// ─── Helper: Log line color ───────────────────────────────────────────────────
function getLogLineStyle(line: string): string {
  const l = line.toLowerCase();
  if (l.includes("[error]") || l.includes("[std::err]") || l.includes("[stderr]")) return "text-[#F23F43] font-bold";
  if (l.includes("[warn]") || l.includes("warning")) return "text-[#FFa500] font-semibold";
  if (l.includes("[rcon command run]") || l.includes("rcon command:")) return "text-blue-400 font-semibold";
  if (l.includes("[mock rcon]") || l.includes("mock mode")) return "text-teal-400 italic";
  if (l.includes("joined the game") || l.includes("logged in with entity")) return "text-[#23A55A]";
  return "text-[#DBDEE1]";
}

// ─── ContentArea ──────────────────────────────────────────────────────────────

export default function ContentArea({
  serverStatus,
  setServerStatus,
  consoleLogs,
  setConsoleLogs,
  uptime,
  playersCount,
  cpuUsage,
  ramUsage,
  diskUsage,
}: ContentAreaProps) {
  const { state } = useNav();
  const { activeModule, activeChannel } = state;
  const config = MODULE_CONFIG[activeModule];

  // Channel header description
  const channelObj = config.channels.find((c) => c.id === activeChannel);
  const channelDesc: Record<string, string> = {
    "consola-minecraft": "Acceso RCON seguro para control administrativo del servidor.",
    "rendimiento-vps":   "Métricas en tiempo real de CPU, RAM, Disco y Red del VPS KVM4.",
    "backups":           "Historial de instantáneas y restauraciones del servidor.",
    "minecraft-server":  "Explorador de archivos: /var/minecraft/server",
    "www-grooming":      "Explorador de archivos: /var/www/grooming",
    "www-nexus":         "Explorador de archivos: /var/www/absolute-nexus",
    "home-root":         "Explorador de archivos: /root",
  };

  return (
    <main className="flex-1 bg-[#313338] flex flex-col min-w-0 overflow-hidden">
      {/* Top header bar */}
      <header className="h-12 border-b border-[#1F2023] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-6 h-6 text-[#80848E] flex-shrink-0" />
          <h1 className="font-semibold text-white text-base truncate">
            {channelObj?.label ?? activeChannel}
          </h1>
          <div className="w-[1px] h-4 bg-[#3F4147] mx-2 flex-shrink-0" />
          <p className="text-xs text-[#949BA4] hidden sm:inline truncate">
            {channelDesc[activeChannel] ?? `Módulo: ${config.label}`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-[#B5BAC1] flex-shrink-0">
          <Bell  className="w-5 h-5 cursor-pointer hover:text-[#DBDEE1]" />
          <Pin   className="w-5 h-5 cursor-pointer hover:text-[#DBDEE1]" />
          <Users className="w-5 h-5 cursor-pointer hover:text-[#DBDEE1]" />
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Buscar"
              className="bg-[#1E1F22] text-[#DBDEE1] text-xs px-2 py-1 rounded w-36 outline-none focus:w-48 transition-all duration-150 placeholder-[#949BA4]"
            />
            <Search className="w-3.5 h-3.5 text-[#949BA4] absolute right-2 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* ── Routed content ───────────────────────────────────────────────── */}

      {/* IT module — File Explorer */}
      {activeModule === "it" && activeChannel === "archivos-servidor" && <FileExplorer />}

      {/* Files module — always show FileExplorer */}
      {activeModule === "files" && <FileExplorer />}

      {/* IT module — Minecraft Console */}
      {activeModule === "it" && activeChannel === "consola-minecraft" && (
        <MinecraftConsoleView
          serverStatus={serverStatus}
          setServerStatus={setServerStatus}
          consoleLogs={consoleLogs}
          setConsoleLogs={setConsoleLogs}
          uptime={uptime}
          playersCount={playersCount}
        />
      )}

      {/* IT module — VPS Performance */}
      {activeModule === "it" && activeChannel === "rendimiento-vps" && (
        <VPSPerformanceView cpuUsage={cpuUsage} ramUsage={ramUsage} diskUsage={diskUsage} />
      )}

      {/* IT module — Backups */}
      {activeModule === "it" && activeChannel === "backups" && <BackupsView />}

      {/* Home module */}
      {activeModule === "home" && <HomeView />}

      {/* Grooming placeholder */}
      {activeModule === "grooming" && <PlaceholderView icon={Scissors} label="Grooming Pet" color="#23A55A" subtitle="Módulo de gestión de citas y clientes (próximamente)" />}

      {/* Hotel placeholder */}
      {activeModule === "hotel" && <PlaceholderView icon={BedDouble} label="Hotelera Pet" color="#F43F5E" subtitle="Módulo de reservas y habitaciones (próximamente)" />}

      {/* Chat placeholder */}
      {activeModule === "chat" && <PlaceholderView icon={MessageSquare} label="Chat Interno" color="#60A5FA" subtitle="Sistema de mensajería interna (próximamente)" />}

      {/* Spotify placeholder */}
      {activeModule === "spotify" && <PlaceholderView icon={Music} label="Spotify Control" color="#1DB954" subtitle="Control remoto de reproducción vía API de Spotify (próximamente)" />}

      {/* Settings placeholder */}
      {activeModule === "settings" && <PlaceholderView icon={Settings} label="Configuración" color="#949BA4" subtitle="Gestión de cuenta, seguridad e integraciones (próximamente)" />}
    </main>
  );
}

// ─── Minecraft Console View ───────────────────────────────────────────────────

function MinecraftConsoleView({
  serverStatus,
  setServerStatus,
  consoleLogs,
  setConsoleLogs,
  uptime,
  playersCount,
}: {
  serverStatus: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE";
  setServerStatus: (s: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE") => void;
  consoleLogs: string[];
  setConsoleLogs: (logs: string[]) => void;
  uptime: string;
  playersCount: number;
}) {
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSending, setIsSending] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  const triggerPowerAction = async (action: "start" | "stop" | "restart") => {
    if (action === "start") setServerStatus("STARTING");
    if (action === "stop") setServerStatus("STOPPING");
    if (action === "restart") setServerStatus("STOPPING");
    try {
      await fetch("/api/minecraft/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch (e) { console.error(e); }
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim() || isSending) return;
    const cmd = commandInput.trim();
    setCommandHistory(prev => [cmd, ...prev]);
    setHistoryIndex(-1);
    setCommandInput("");
    setIsSending(true);
    try {
      await fetch("/api/minecraft/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "command", command: cmd }),
      });
      const logsRes = await fetch("/api/minecraft/control");
      if (logsRes.ok) {
        const d = await logsRes.json();
        if (d.success) setConsoleLogs(d.logs);
      }
    } catch (e) { console.error(e); } finally { setIsSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = historyIndex + 1;
      if (next < commandHistory.length) { setHistoryIndex(next); setCommandInput(commandHistory[next]); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIndex - 1;
      if (next >= 0) { setHistoryIndex(next); setCommandInput(commandHistory[next]); }
      else { setHistoryIndex(-1); setCommandInput(""); }
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        <StatusCard icon={Server} label="Servidor" value={serverStatus} status={serverStatus} />
        <StatusCard icon={Activity} label="Dirección IP" value="mc.absolutenexus.net" />
        <StatusCard icon={Activity} label="Tiempo Activo" value={uptime} />
        <StatusCard icon={Users} label="Jugadores" value={`${playersCount} / 20`} />
      </div>

      {/* Terminal */}
      <div className="flex-1 flex flex-col bg-[#1E1F22] rounded-lg border border-[#1F2023] overflow-hidden min-h-0">
        {/* Terminal header */}
        <div className="bg-[#2B2D31] px-4 py-2 border-b border-[#1F2023] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F23F43] block" />
              <span className="w-3 h-3 rounded-full bg-[#FFa500] block" />
              <span className="w-3 h-3 rounded-full bg-[#23A55A] block" />
            </div>
            <span className="text-xs text-[#949BA4] font-semibold font-mono ml-2">Console Output [RCON :25575]</span>
          </div>
          <div className="flex items-center gap-2">
            <PowerButton label="Start"   color="bg-[#23A55A] hover:bg-[#1a8547]" disabled={serverStatus !== "OFFLINE"}  onClick={() => triggerPowerAction("start")}   icon={<Play    className="w-3.5 h-3.5"/>} />
            <PowerButton label="Stop"    color="bg-[#F23F43] hover:bg-[#c93236]" disabled={serverStatus !== "RUNNING"} onClick={() => triggerPowerAction("stop")}   icon={<Square  className="w-3.5 h-3.5"/>} />
            <PowerButton label="Restart" color="bg-[#FFa500] hover:bg-[#d48c08]" disabled={serverStatus !== "RUNNING"} onClick={() => triggerPowerAction("restart")} icon={<RotateCw className="w-3.5 h-3.5"/>} />
          </div>
        </div>

        {/* Log output */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1 bg-[#111214] min-h-0 select-text">
          {consoleLogs.length === 0
            ? <div className="text-zinc-600 italic">No hay logs registrados.</div>
            : consoleLogs.map((line, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed hover:bg-[#313338]/10 px-1 py-0.5 rounded">
                  <span className={getLogLineStyle(line)}>{line}</span>
                </div>
              ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Command input */}
        <div className="bg-[#2B2D31] p-3 border-t border-[#1F2023] flex-shrink-0">
          <form onSubmit={handleSendCommand} className="relative flex items-center bg-[#383A40] rounded-md overflow-hidden">
            <div className="pl-3 text-[#B5BAC1]"><Terminal className="w-5 h-5" /></div>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder={isSending ? "Enviando..." : "Enviar comando RCON... (ej. /say hola, help)"}
              className="w-full bg-transparent text-[#DBDEE1] text-sm px-3 py-2.5 outline-none placeholder-[#949BA4] disabled:opacity-50"
            />
            <button type="submit" disabled={isSending || !commandInput.trim()}
              title="Enviar comando"
              className="px-4 text-[#B5BAC1] hover:text-white transition-colors h-full flex items-center disabled:opacity-30">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Status Card ──────────────────────────────────────────────────────────────
function StatusCard({ icon: Icon, label, value, status }: { icon: React.ElementType; label: string; value: string; status?: string }) {
  const color = status === "RUNNING" ? "#23A55A" : status === "STARTING" ? "#FFa500" : status === "STOPPING" ? "#F23F43" : "#949BA4";
  return (
    <div className="bg-[#2B2D31] rounded-lg p-3 border border-[#1F2023] flex items-center gap-3">
      <div className="p-2 rounded-full" style={{ backgroundColor: `${color}1A`, color }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <span className="text-[10px] text-[#949BA4] font-bold uppercase tracking-wider block">{label}</span>
        <span className="text-sm font-semibold text-white flex items-center gap-1.5">
          {status && <span className="w-2.5 h-2.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: color }} />}
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Power Button ─────────────────────────────────────────────────────────────
function PowerButton({ label, color, disabled, onClick, icon }: { label: string; color: string; disabled: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer shadow-sm ${disabled ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : `${color} text-white`}`}
    >
      {icon}<span>{label}</span>
    </button>
  );
}

// ─── VPS Performance View ─────────────────────────────────────────────────────
function VPSPerformanceView({ cpuUsage, ramUsage, diskUsage }: { cpuUsage: number; ramUsage: number; diskUsage: number }) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="bg-[#2B2D31] rounded-lg p-6 border border-[#1F2023] space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#FFa500]" /> Rendimiento VPS KVM4
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Carga CPU",          value: `${cpuUsage}%`,       sub: "4 vCPUs AMD EPYC 2.4GHz" },
            { label: "Memoria RAM",        value: `${ramUsage} GB`,     sub: "De 16 GB asignados" },
            { label: "Almacenamiento NVMe",value: `${diskUsage} GB`,    sub: "Utilizado de 100 GB SSD" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-[#1E1F22] rounded-lg p-4 border border-[#1F2023] flex flex-col items-center gap-2">
              <span className="text-xs text-[#949BA4] font-bold uppercase tracking-wider">{label}</span>
              <div className="w-24 h-24 flex items-center justify-center rounded-full border-4 border-zinc-800">
                <span className="text-xl font-bold text-white">{value}</span>
              </div>
              <span className="text-xs text-[#949BA4]">{sub}</span>
            </div>
          ))}
        </div>
        <div className="bg-[#1E1F22] rounded-lg p-4 border border-[#1F2023]">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#23A55A]" /> Red en Tiempo Real
          </h3>
          <div className="h-32 flex items-end gap-1 px-2 pb-1 bg-[#111214] rounded border border-zinc-800">
            {Array.from({ length: 48 }).map((_, i) => {
              const h = Math.floor(Math.random() * 80) + 10;
              return <div key={i} className="bg-[#23A55A] opacity-75 hover:opacity-100 transition-opacity rounded-t w-full" style={{ height: `${h}%` }} />;
            })}
          </div>
          <div className="flex justify-between text-[10px] text-[#949BA4] mt-2 font-mono">
            <span>Hace 5 min</span>
            <span>14.5 Mbps In / 6.2 Mbps Out</span>
            <span>Ahora</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Backups View ─────────────────────────────────────────────────────────────
function BackupsView() {
  const backups = [
    { name: "backup_world_manual_20260604.tar.gz",    size: "2.1 GB",  date: "04-Jun-2026 18:30", type: "Manual" },
    { name: "backup_world_auto_cron_20260603.tar.gz", size: "2.08 GB", date: "03-Jun-2026 03:00", type: "Automático" },
    { name: "backup_world_auto_cron_20260602.tar.gz", size: "2.05 GB", date: "02-Jun-2026 03:00", type: "Automático" },
    { name: "backup_world_auto_cron_20260601.tar.gz", size: "1.98 GB", date: "01-Jun-2026 03:00", type: "Automático" },
  ];
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="bg-[#2B2D31] rounded-lg p-6 border border-[#1F2023] space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-400" /> Copias de Seguridad
        </h2>
        <div className="space-y-3">
          {backups.map((b, i) => (
            <div key={i} className="bg-[#1E1F22] hover:bg-[#111214] transition-colors p-4 rounded border border-[#1F2023] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <HardDrive className="w-8 h-8 text-zinc-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-[#DBDEE1] block text-sm truncate">{b.name}</span>
                  <span className="text-xs text-[#949BA4]">Tamaño: {b.size} | Creado: {b.date}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <span className="bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{b.type}</span>
                <button className="bg-zinc-800 text-white hover:bg-zinc-700 transition px-3 py-1 rounded text-xs font-semibold">Restaurar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────
function HomeView() {
  const modules = [
    { label: "Grooming Pet",     color: "#23A55A", status: "ONLINE",  icon: Scissors },
    { label: "Hotelera Pet",     color: "#F43F5E", status: "STANDBY", icon: BedDouble },
    { label: "IT / VPS",         color: "#FFa500", status: "ONLINE",  icon: Server },
    { label: "File Manager",     color: "#A78BFA", status: "ONLINE",  icon: FolderOpen },
    { label: "Chat Interno",     color: "#60A5FA", status: "ONLINE",  icon: MessageSquare },
    { label: "Spotify Control",  color: "#1DB954", status: "STANDBY", icon: Music },
  ];
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🏠 Absolute Home</h1>
          <p className="text-[#949BA4] text-sm mt-1">Centro de control unificado del ecosistema corporativo.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modules.map(({ label, color, status, icon: Icon }) => (
            <div key={label} className="bg-[#2B2D31] rounded-lg p-4 border border-[#1F2023] flex flex-col gap-3 hover:bg-[#35373C]/60 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22`, color }}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">{label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${status === "ONLINE" ? "bg-[#23A55A]/20 text-[#23A55A]" : "bg-[#FFa500]/20 text-[#FFa500]"}`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Generic Placeholder View ─────────────────────────────────────────────────
function PlaceholderView({ icon: Icon, label, color, subtitle }: { icon: React.ElementType; label: string; color: string; subtitle: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}22`, color }}>
        <Icon className="w-10 h-10" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">{label}</h2>
        <p className="text-[#949BA4] text-sm mt-1 max-w-xs">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 bg-[#2B2D31] border border-[#1F2023] rounded-full px-4 py-2 text-xs text-[#949BA4]">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        Módulo en desarrollo
      </div>
    </div>
  );
}
