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
import { io as socketIO } from "socket.io-client";
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
  DownloadCloud,
  Loader2,
  Folder,
  ChevronLeft,
  Heart,
  Smile,
  Paperclip,
  CornerUpLeft,
  Trash2,
  Mic,
  MicOff,
  Pencil,
  Lock,
  Shield,
  Key,
  UploadCloud,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNav, MODULE_CONFIG } from "@/context/NavigationContext";
import FileExplorer from "@/components/FileExplorer";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMusicStore } from "@/store/useMusicStore";
import type { SongData } from "@/store/useMusicStore";
import SyncedLyricsView from "@/components/SyncedLyricsView";

interface EnvVar {
  key: string;
  value: string;
}

// ─── Props passed from page.tsx (server state) ────────────────────────────────
interface ContentAreaProps {
  // Server stats (only used by IT module)
  serverStatus: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE";
  setServerStatus: (s: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE") => void;
  consoleLogs: string[];
  setConsoleLogs: (logs: string[]) => void;
  uptime: string;
  playersCount: number;
  playersMax: number;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  envVars?: EnvVar[];
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

// Helper to map color codes to tailwind classes to avoid inline styles
function getThemeColorClasses(hex: string, isDot = false): string {
  const h = hex.toLowerCase();
  if (h === "#23a55a") return isDot ? "bg-[#23A55A]" : "bg-[#23A55A]/15 text-[#23A55A]";
  if (h === "#f43f5e") return isDot ? "bg-[#F43F5E]" : "bg-[#F43F5E]/15 text-[#F43F5E]";
  if (h === "#ffa500") return isDot ? "bg-[#FFa500]" : "bg-[#FFa500]/15 text-[#FFa500]";
  if (h === "#a78bfa") return isDot ? "bg-[#A78BFA]" : "bg-[#A78BFA]/15 text-[#A78BFA]";
  if (h === "#60a5fa") return isDot ? "bg-[#60A5FA]" : "bg-[#60A5FA]/15 text-[#60A5FA]";
  if (h === "#1db954") return isDot ? "bg-[#1DB954]" : "bg-[#1DB954]/15 text-[#1DB954]";
  if (h === "#949ba4") return isDot ? "bg-[#949BA4]" : "bg-[#949BA4]/15 text-[#949BA4]";
  return isDot ? "bg-zinc-500" : "bg-zinc-800/40 text-zinc-400";
}

// ─── ContentArea ──────────────────────────────────────────────────────────────

export default function ContentArea({
  serverStatus,
  setServerStatus,
  consoleLogs,
  setConsoleLogs,
  uptime,
  playersCount,
  playersMax,
  cpuUsage,
  ramUsage,
  diskUsage,
  envVars = [],
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
      <header className="h-12 border-b border-[#1F2023] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-6 h-6 text-[#80848E] shrink-0" />
          <h1 className="font-semibold text-white text-base truncate">
            {channelObj?.label ?? activeChannel}
          </h1>
          <div className="w-px h-4 bg-[#3F4147] mx-2 shrink-0" />
          <p className="text-xs text-[#949BA4] hidden sm:inline truncate">
            {channelDesc[activeChannel] ?? `Módulo: ${config.label}`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-[#B5BAC1] shrink-0">
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
          playersMax={playersMax}
        />
      )}

      {/* IT module — VPS Performance */}
      {activeModule === "it" && activeChannel === "rendimiento-vps" && (
        <VPSPerformanceView cpuUsage={cpuUsage} ramUsage={ramUsage} diskUsage={diskUsage} />
      )}

      {/* IT module — Game Settings */}
      {activeModule === "it" && activeChannel === "configuracion-juego" && (
        <GameSettingsView />
      )}


      {/* IT module — Backups */}
      {activeModule === "it" && activeChannel === "backups" && <BackupsView />}

      {/* Home module */}
      {activeModule === "home" && <HomeView />}

      {/* Grooming placeholder */}
      {activeModule === "grooming" && <PlaceholderView icon={Scissors} label="Grooming Pet" color="#23A55A" subtitle="Módulo de gestión de citas y clientes (próximamente)" />}

      {/* Hotel placeholder */}
      {activeModule === "hotel" && <PlaceholderView icon={BedDouble} label="Hotelera Pet" color="#F43F5E" subtitle="Módulo de reservas y habitaciones (próximamente)" />}

      {/* Chat Interno — Real-time WebSocket Chat */}
      {activeModule === "chat" && <ChatView />}

      {/* Spotify (Absolute Nexus Music) view */}
      {activeModule === "spotify" && (
        <MusicModuleView />
      )}

      {/* Settings module */}
      {activeModule === "settings" && (
        <SettingsModuleView envVars={envVars} />
      )}
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
  playersMax,
}: {
  serverStatus: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE";
  setServerStatus: (s: "RUNNING" | "STARTING" | "STOPPING" | "OFFLINE") => void;
  consoleLogs: string[];
  setConsoleLogs: (logs: string[]) => void;
  uptime: string;
  playersCount: number;
  playersMax: number;
}) {
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSending, setIsSending] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [publicIp, setPublicIp] = useState("mc.absolutenexus.net");

  // Auto-discovery state
  const [discoveryData, setDiscoveryData] = useState<{ modsCount: number; worldExists: boolean }>({
    modsCount: 0,
    worldExists: false,
  });

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const res = await fetch("/api/minecraft/discovery");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDiscoveryData({
              modsCount: data.modsCount,
              worldExists: data.worldExists,
            });
          }
        }
      } catch (e) {
        console.error("Discovery error:", e);
      }
    };
    fetchDiscovery();
    const interval = setInterval(fetchDiscovery, 10000);
    return () => clearInterval(interval);
  }, [serverStatus]);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch("/api/vps/ip");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.ip) {
            setPublicIp(data.ip);
          }
        }
      } catch (e) {
        console.error("IP fetch error:", e);
      }
    };
    fetchIp();
  }, []);

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
      const res = await fetch("/api/minecraft/rcon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      const timestamp = new Date().toTimeString().split(" ")[0];
      if (data.success) {
        const responseLines = data.response.split(/\r?\n/).filter(Boolean);
        setConsoleLogs([
          ...consoleLogs,
          `${timestamp} - [RCON Command] > ${cmd}`,
          ...responseLines.map((line: string) => `${timestamp} - [RCON]: ${line}`),
        ]);
      } else {
        setConsoleLogs([
          ...consoleLogs,
          `${timestamp} - [RCON Command] > ${cmd}`,
          `${timestamp} - [RCON Error]: ${data.error || "Unknown error"}`,
        ]);
      }
    } catch (e: any) {
      console.error(e);
      const timestamp = new Date().toTimeString().split(" ")[0];
      setConsoleLogs([
        ...consoleLogs,
        `${timestamp} - [RCON Command] > ${cmd}`,
        `${timestamp} - [RCON Error]: ${e.message}`,
      ]);
    } finally {
      setIsSending(false);
    }
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 shrink-0">
        <StatusCard icon={Server} label="Servidor" value={serverStatus} status={serverStatus} />
        <StatusCard icon={Activity} label="Dirección IP" value={publicIp} />
        <StatusCard icon={Activity} label="Tiempo Activo" value={uptime} />
        <StatusCard icon={Users} label="Jugadores" value={`${playersCount} / ${playersMax}`} />
        <StatusCard icon={Settings} label="Mods Activos" value={`${discoveryData.modsCount} JARs`} />
        <StatusCard icon={HardDrive} label="Mundo / Mapa" value={discoveryData.worldExists ? "Generado" : "No Detectado"} status={discoveryData.worldExists ? "RUNNING" : "OFFLINE"} />
      </div>

      {/* Terminal */}
      <div className="flex-1 flex flex-col bg-[#1E1F22] rounded-lg border border-[#1F2023] overflow-hidden min-h-0">
        {/* Terminal header */}
        <div className="bg-[#2B2D31] px-4 py-2 border-b border-[#1F2023] flex items-center justify-between shrink-0">
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
        <div className="bg-[#2B2D31] p-3 border-t border-[#1F2023] shrink-0">
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
  let themeColor = "#949BA4";
  if (status === "RUNNING") themeColor = "#23A55A";
  else if (status === "STARTING") themeColor = "#FFa500";
  else if (status === "STOPPING") themeColor = "#F23F43";
  else {
    if (label.includes("IP") || label.includes("Dirección")) themeColor = "#60A5FA";
    else if (label.includes("Tiempo") || label.includes("Activo")) themeColor = "#23A55A";
    else if (label.includes("Jugadores")) themeColor = "#A78BFA";
  }

  const colorClass = getThemeColorClasses(themeColor);
  const dotColorClass = getThemeColorClasses(themeColor, true);

  return (
    <div className="bg-[#2B2D31] rounded-lg p-3 border border-[#1F2023] flex items-center gap-3">
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <span className="text-[10px] text-[#949BA4] font-bold uppercase tracking-wider block">{label}</span>
        <span className="text-sm font-semibold text-white flex items-center gap-1.5">
          {status && <span className={`w-2.5 h-2.5 rounded-full inline-block animate-pulse ${dotColorClass}`} />}
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
function VPSPerformanceView({ cpuUsage: initialCpu, ramUsage: initialRam, diskUsage }: { cpuUsage: number; ramUsage: number; diskUsage: number }) {
  const [isMounted, setIsMounted] = useState(false);
  const [telemetry, setTelemetry] = useState({
    cpuUsage: initialCpu,
    ramUsedGB: initialRam,
    ramTotalGB: 16.0,
    ramUsage: parseFloat(((initialRam / 16.0) * 100).toFixed(1)),
    diskUsedGB: diskUsage,
    diskTotalGB: 100.0,
    diskUsagePct: parseFloat(((diskUsage / 100.0) * 100).toFixed(1))
  });
  const [processes, setProcesses] = useState<Array<{ pid: number; name: string; mem: number; cpu: number }>>([]);
  const [history, setHistory] = useState<Array<{ time: string; cpu: number; ram: number }>>([]);

  useEffect(() => {
    setIsMounted(true);

    // Pre-fill history buffer with 20 points based on initial stats
    const initialHistory = [];
    const now = new Date();
    const initRamPct = parseFloat(((initialRam / 16.0) * 100).toFixed(1));
    for (let i = 19; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 2000);
      initialHistory.push({
        time: pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        cpu: initialCpu,
        ram: initRamPct
      });
    }
    setHistory(initialHistory);

    const pollApi = async () => {
      try {
        const res = await fetch("/api/vps/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setTelemetry(data.telemetry);
            if (data.processes) {
              setProcesses(data.processes);
            }
            
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            const newPoint = {
              time: timestamp,
              cpu: data.telemetry.cpuUsage,
              ram: data.telemetry.ramUsage
            };

            setHistory(prev => {
              const next = [...prev, newPoint];
              if (next.length > 20) {
                return next.slice(next.length - 20);
              }
              return next;
            });
          }
        }
      } catch (err) {
        console.error("Error fetching telemetry:", err);
      }
    };

    pollApi();
    const interval = setInterval(pollApi, 2000);
    return () => clearInterval(interval);
  }, [initialCpu, initialRam]);

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="bg-[#2B2D31] rounded-lg p-6 border border-[#1F2023] space-y-6">
        {/* Header */}
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#FFa500]" /> Rendimiento VPS KVM4
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Carga CPU",          value: `${telemetry.cpuUsage}%`,       sub: "4 vCPUs AMD EPYC 2.4GHz" },
            { label: "Memoria RAM",        value: `${telemetry.ramUsedGB} GB`,     sub: `De ${telemetry.ramTotalGB} GB (${telemetry.ramUsage}%)` },
            { label: "Almacenamiento NVMe",value: `${telemetry.diskUsedGB} GB`,    sub: `Utilizado de ${telemetry.diskTotalGB} GB SSD (${telemetry.diskUsagePct}%)` },
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

        {/* Charts Section */}
        {isMounted ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Chart */}
            <div className="bg-[#1E1F22] rounded-lg p-4 border border-[#1F2023] space-y-3">
              <h3 className="text-xs font-bold text-[#949BA4] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#10B981]" /> Carga de CPU Histórica (%)
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#80848E" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#80848E" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111214", borderColor: "#1F2023", borderRadius: "6px" }}
                      itemStyle={{ color: "#10B981", fontSize: "12px" }}
                      labelStyle={{ color: "#80848E", fontSize: "11px" }}
                    />
                    <Area type="monotone" dataKey="cpu" name="CPU Usage" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RAM Chart */}
            <div className="bg-[#1E1F22] rounded-lg p-4 border border-[#1F2023] space-y-3">
              <h3 className="text-xs font-bold text-[#949BA4] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#06B6D4]" /> Uso de RAM Histórico (%)
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#80848E" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#80848E" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111214", borderColor: "#1F2023", borderRadius: "6px" }}
                      itemStyle={{ color: "#06B6D4", fontSize: "12px" }}
                      labelStyle={{ color: "#80848E", fontSize: "11px" }}
                    />
                    <Area type="monotone" dataKey="ram" name="RAM Usage" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-zinc-500">
            Cargando gráficos de telemetría...
          </div>
        )}

        {/* Process List (Task Manager Table) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#949BA4] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-zinc-400" /> Administrador de Tareas (Top 15 Procesos)
          </h3>
          <div className="bg-[#1E1F22] rounded-lg border border-[#1F2023] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111214] text-[#949BA4] font-bold border-b border-[#1F2023] uppercase text-[10px] tracking-wider">
                    <th className="p-3">PID</th>
                    <th className="p-3">Proceso</th>
                    <th className="p-3 text-right">% CPU</th>
                    <th className="p-3 text-right">% Memoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2023]">
                  {processes.length > 0 ? (
                    processes.map((proc, index) => (
                      <tr key={`${proc.pid}-${index}`} className="hover:bg-[#2B2D31]/40 text-[#DBDEE1] transition-colors">
                        <td className="p-3 font-mono text-zinc-500">{proc.pid}</td>
                        <td className="p-3 font-mono font-semibold truncate max-w-[150px]">{proc.name}</td>
                        <td className="p-3 text-right font-mono text-[#10B981]">{proc.cpu.toFixed(1)}%</td>
                        <td className="p-3 text-right font-mono text-[#06B6D4]">{proc.mem.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-zinc-500">
                        No hay datos de procesos activos disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                <HardDrive className="w-8 h-8 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-[#DBDEE1] block text-sm truncate">{b.name}</span>
                  <span className="text-xs text-[#949BA4]">Tamaño: {b.size} | Creado: {b.date}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getThemeColorClasses(color)}`}>
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
  const colorClass = getThemeColorClasses(color);
  const dotColorClass = getThemeColorClasses(color, true);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${colorClass}`}>
        <Icon className="w-10 h-10" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">{label}</h2>
        <p className="text-[#949BA4] text-sm mt-1 max-w-xs">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 bg-[#2B2D31] border border-[#1F2023] rounded-full px-4 py-2 text-xs text-[#949BA4]">
        <div className={`w-2 h-2 rounded-full animate-pulse ${dotColorClass}`} />
        Módulo en desarrollo
      </div>
    </div>
  );
}

// ─── Settings Views (Cuenta, Seguridad, Usuarios, Variables de Entorno) ───────

function SettingsModuleView({ envVars }: { envVars: EnvVar[] }) {
  const { state } = useNav();
  const { activeChannel } = state;

  switch (activeChannel) {
    case "cuenta":
      return <SettingsCuentaView />;
    case "seguridad":
      return <SettingsSecurityView />;
    case "usuarios":
      return <SettingsUsersView />;
    case "variables-entorno":
      return <SettingsEnvVarsView envVars={envVars} />;
    default:
      return (
        <PlaceholderView
          icon={Settings}
          label="Módulo en desarrollo"
          color="#949BA4"
          subtitle="Esta sección de configuración estará disponible próximamente."
        />
      );
  }
}

// ─── Pestaña Cuenta ───
function SettingsCuentaView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useMusicStore((s) => s.showToast);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setName(data.user.name || "");
            setEmail(data.user.email || "");
            setBio(data.user.bio || "");
            setImage(data.user.image || null);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImage(data.url);
        showToast("Imagen de perfil actualizada correctamente.");
      } else {
        showToast(data.error || "Error al subir la imagen.");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bio }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Perfil guardado con éxito.");
      } else {
        showToast(data.error || "Error al actualizar perfil.");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#949BA4] text-sm">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mr-2" /> Cargando perfil...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-xl mx-auto bg-[#2B2D31] rounded-lg border border-[#1F2023] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            👤 Configuración de Cuenta
          </h2>
          <p className="text-xs text-[#949BA4] mt-1">
            Actualiza tu información personal y foto de perfil corporativa.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Click-to-upload */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide">
              Foto de Perfil
            </label>
            <div 
              onClick={handleAvatarClick}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 cursor-pointer group hover:border-[#5865F2] transition-colors"
            >
              {image ? (
                <img src={image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-[#5865F2]">
                  {name.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud className="w-5 h-5 text-white" />
                <span className="text-[9px] text-white font-bold mt-1 uppercase">Subir</span>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
              title="Subir foto de perfil"
              placeholder="Subir foto de perfil"
            />
            <span className="text-[10px] text-[#949BA4]">Haz clic para cambiar de foto (Formatos permitidos: PNG, JPG, WEBP)</span>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@absolutenexus.com"
                className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
                Biografía
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntanos un poco sobre ti..."
                rows={4}
                className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#23A55A] hover:bg-[#1a7f43] disabled:bg-[#23A55A]/50 text-white font-semibold text-xs py-2.5 px-4 rounded transition-colors cursor-pointer shadow-sm"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Pestaña Seguridad ───
function SettingsSecurityView() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const showToast = useMusicStore((s) => s.showToast);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Contraseña cambiada correctamente.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.error || "Error al cambiar la contraseña.");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-md mx-auto bg-[#2B2D31] rounded-lg border border-[#1F2023] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🔒 Seguridad de la Cuenta
          </h2>
          <p className="text-xs text-[#949BA4] mt-1">
            Cambia tu contraseña periódicamente para mantener tu cuenta segura.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
              Contraseña Actual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 caracteres"
              className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-[#5865F2]/50 text-white font-semibold text-xs py-2.5 px-4 rounded transition-colors cursor-pointer shadow-sm"
          >
            {saving ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Pestaña Gestión de Usuarios CRUD ───
function SettingsUsersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Modal CRUD states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = useMusicStore((s) => s.showToast);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.users) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Get logged-in user to prevent self-deletion
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => {
        if (data?.user) {
          setCurrentUserId(data.user.id);
        }
      });
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setBio("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setModalMode("edit");
    setSelectedUser(user);
    setName(user.name || "");
    setEmail(user.email || "");
    setPassword(""); // Keep empty to not change password
    setRole(user.role || "USER");
    setBio(user.bio || "");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { name, email, role, bio };
      if (modalMode === "edit" && selectedUser) {
        payload.id = selectedUser.id;
        if (password.trim() !== "") {
          payload.password = password;
        }
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Usuario actualizado correctamente.");
          setIsModalOpen(false);
          fetchUsers();
        } else {
          showToast(data.error || "Error al actualizar usuario.");
        }
      } else {
        payload.password = password;
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Usuario creado correctamente.");
          setIsModalOpen(false);
          fetchUsers();
        } else {
          showToast(data.error || "Error al crear usuario.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al procesar la solicitud.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUserId) {
      showToast("No puedes eliminar tu propia cuenta.");
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar el usuario "${name}"? Esta acción es irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Usuario eliminado con éxito.");
        fetchUsers();
      } else {
        showToast(data.error || "Error al eliminar el usuario.");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al eliminar usuario.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#949BA4] text-sm">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mr-2" /> Cargando usuarios...
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto relative">
      <div className="bg-[#2B2D31] rounded-lg border border-[#1F2023] p-6 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              👥 Gestión de Usuarios
            </h2>
            <p className="text-xs text-[#949BA4] mt-1">
              Administración centralizada de cuentas secundarias, roles y accesos del panel.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#23A55A] hover:bg-[#1a7f43] text-white text-xs px-3.5 py-2.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow"
          >
            + Añadir Usuario
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-[#1E1F22] rounded-lg border border-[#1F2023] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#111214] text-[#949BA4] font-bold border-b border-[#1F2023] uppercase text-[10px] tracking-wider">
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Biografía</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2023]">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#2B2D31]/40 text-[#DBDEE1] transition-colors">
                      <td className="p-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-white">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">{user.name || "Sin nombre"}</span>
                        {user.id === currentUserId && (
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded ml-1 border border-zinc-700">Tú</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[#B5BAC1]">{user.email}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                          user.role === "ADMIN_GENERAL" 
                            ? "bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20" 
                            : user.role === "MODERATOR" 
                            ? "bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20"
                            : "bg-[#23A55A]/10 text-[#23A55A] border-[#23A55A]/20"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500 italic max-w-[200px] truncate">
                        {user.bio || "Sin biografía"}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-[#DBDEE1] p-1.5 rounded transition cursor-pointer border border-zinc-700"
                            title="Editar usuario"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                            disabled={user.id === currentUserId}
                            className={`p-1.5 rounded border transition ${
                              user.id === currentUserId 
                                ? "bg-zinc-800/40 border-zinc-800 text-zinc-600 cursor-not-allowed" 
                                : "bg-[#F23F43]/15 hover:bg-[#F23F43] hover:text-white text-[#F23F43] border-[#F23F43]/20 cursor-pointer"
                            }`}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-zinc-500">
                      No hay usuarios registrados en el sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2B2D31] border border-[#1F2023] rounded-lg w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="bg-[#1E1F22] p-4 border-b border-[#1F2023] flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">
                {modalMode === "add" ? "Añadir Nuevo Usuario" : "Editar Usuario"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-[#949BA4] hover:text-white text-sm"
                title="Cerrar modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase tracking-wide">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Pedro Pérez"
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase tracking-wide">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pedro@absolutenexus.com"
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase tracking-wide">
                  Contraseña {modalMode === "edit" && "(dejar en blanco para conservar actual)"}
                </label>
                <input
                  type="password"
                  required={modalMode === "add"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={modalMode === "add" ? "Mín. 8 caracteres" : "Nueva contraseña (opcional)"}
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase tracking-wide">
                  Rol de Acceso
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  title="Seleccionar rol de acceso del usuario"
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2]"
                >
                  <option value="USER">Usuario (Acceso Estándar)</option>
                  <option value="MODERATOR">Moderador (Acceso Elevado)</option>
                  <option value="ADMIN_GENERAL">Administrador General (Acceso Total)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase tracking-wide">
                  Biografía
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detalles del puesto o biografía..."
                  rows={3}
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1F2023]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-[#DBDEE1] px-4 py-2 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#23A55A] hover:bg-[#1a7f43] text-white px-4 py-2 rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pestaña Variables de Entorno (Enmascarado Seguro) ───
function SettingsEnvVarsView({ envVars }: { envVars: EnvVar[] }) {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="bg-[#2B2D31] rounded-lg border border-[#1F2023] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🔑 Variables de Entorno (Enmascaramiento de Seguridad)
          </h2>
          <p className="text-xs text-[#949BA4] mt-1">
            Se muestran las variables del sistema en ejecución. Los valores están enmascarados del lado del servidor para prevenir fugas de secretos en el DOM o bundle de producción.
          </p>
        </div>

        {/* Console / Monospaced Listing */}
        <div className="bg-[#1E1F22] rounded-lg border border-[#1F2023] p-4 font-mono text-xs space-y-2.5 overflow-hidden select-text">
          <div className="text-zinc-500 italic pb-2 border-b border-[#2B2D31] flex justify-between">
            <span>LLAVE DEL SISTEMA</span>
            <span>VALOR ACTUAL ENMACHARADO (SERVER-SIDE)</span>
          </div>
          {envVars.length > 0 ? (
            envVars.map((env) => (
              <div key={env.key} className="flex justify-between items-center gap-4 py-1.5 hover:bg-[#2B2D31]/35 px-2 rounded transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="text-[#60A5FA] font-semibold truncate select-all">{env.key}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  <Shield className="w-3 h-3 text-[#23A55A]" />
                  <span className="text-[#80848E] font-bold tracking-wide select-none">{env.value}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-zinc-600 italic">No se cargaron variables de entorno desde el servidor.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Music Module View (Col 3) ────────────────────────────────────────────────

const INITIAL_SONGS: SongData[] = [];

function formatSongDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function MusicModuleView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<SongData[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<SongData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { currentSong, isPlaying, togglePlay, addToQueue, playSong, showToast } = useMusicStore();
  const { state } = useNav();
  const { activeChannel } = state;

  const displayedSongs = activeChannel === "favorites" ? favoriteSongs : songs;

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/music/favorite");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.songs) {
          const favorited: SongData[] = data.songs.map((s: any) => ({
            id: s.youtubeId,
            title: s.title,
            artist: "Biblioteca local",
            duration: s.duration,
            thumbnail: s.thumbnail,
            type: s.localFilePath ? "LOCAL" : "YOUTUBE",
            localFilePath: s.localFilePath,
          }));
          setFavoriteSongs(favorited);
          if (!searchQuery) {
            setSongs(favorited.length > 0 ? favorited : INITIAL_SONGS);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSongs(favoriteSongs.length > 0 ? favoriteSongs : INITIAL_SONGS);
    }
  }, [searchQuery, favoriteSongs]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSongs(favoriteSongs.length > 0 ? favoriteSongs : INITIAL_SONGS);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.results) {
          const searchResults: SongData[] = data.results.map((r: any) => {
            const fav = favoriteSongs.find((f) => f.id === r.id);
            return {
              id: r.id,
              title: r.title,
              artist: r.artist || "Unknown Artist",
              duration: r.durationSeconds || 0,
              thumbnail: r.thumbnail,
              type: fav?.localFilePath ? "LOCAL" : "YOUTUBE",
              localFilePath: fav?.localFilePath || null,
              url: r.url,
            };
          });
          setSongs(searchResults);
        }
      }
    } catch (err) {
      console.error("Error searching YouTube:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async (song: SongData) => {
    setDownloadingId(song.id);
    try {
      const res = await fetch("/api/music/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId: song.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.song) {
          const updatedFilePath = data.song.localFilePath;
          showToast(`"${song.title}" descargada al VPS`);
          
          setFavoriteSongs((prev) => {
            const exists = prev.some((f) => f.id === song.id);
            if (exists) {
              return prev.map((f) => f.id === song.id ? { ...f, type: "LOCAL", localFilePath: updatedFilePath } : f);
            } else {
              return [...prev, { ...song, type: "LOCAL", localFilePath: updatedFilePath }];
            }
          });

          setSongs((prev) =>
            prev.map((s) => (s.id === song.id ? { ...s, type: "LOCAL", localFilePath: updatedFilePath } : s))
          );
        } else {
          showToast(`Error al descargar: ${data.error || "proceso fallido"}`);
        }
      } else {
        showToast("Error de red al descargar");
      }
    } catch (err) {
      console.error("Download error:", err);
      showToast("Error de red en la descarga");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleFavorite = async (song: SongData) => {
    const isFav = favoriteSongs.some((f) => f.id === song.id);
    if (isFav) {
      showToast(`"${song.title}" ya está en favoritos`);
      return;
    }

    try {
      const res = await fetch("/api/music/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeId: song.id,
          title: song.title,
          duration: song.duration,
          thumbnail: song.thumbnail,
          localFilePath: song.localFilePath || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(`"${song.title}" añadida a favoritos`);
          setFavoriteSongs((prev) => [...prev, { ...song, artist: "Biblioteca local" }]);
        } else {
          showToast(`Error: ${data.error}`);
        }
      } else {
        showToast("Error de conexión al guardar favoritos");
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
      showToast("Error de red al guardar favoritos");
    }
  };

  return (
    <div className="flex-1 flex flex-row min-h-0 bg-[#313338] select-none p-4 gap-4 overflow-hidden">
      {/* Left Column: Search & Playlist */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Search Bar header */}
        {activeChannel !== "favorites" && (
          <div className="shrink-0">
            <form onSubmit={handleSearch} className="relative flex items-center bg-[#1E1F22] rounded-md overflow-hidden border border-[#1F2023] focus-within:border-[#5865F2] transition-colors">
              <input
                type="text"
                placeholder="Buscar canciones en YouTube (presiona Enter)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[#F2F3F5] text-sm pl-4 pr-10 py-3 outline-none placeholder-[#949BA4]"
              />
              <button type="submit" className="absolute right-3 text-[#949BA4] hover:text-white transition-colors" title="Buscar">
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        )}

        {/* Playlist / Songs Container */}
        <div className="flex-1 bg-[#2B2D31] rounded-lg border border-[#1F2023] overflow-hidden flex flex-col min-h-0">
          {/* Table Header */}
          <div className="bg-[#2B2D31] px-6 py-3 border-b border-[#1F2023] grid grid-cols-12 text-xs font-bold text-[#949BA4] tracking-wider uppercase shrink-0">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Título</div>
            <div className="col-span-3">Artista</div>
            <div className="col-span-2 text-right">Duración</div>
          </div>

          {/* Scrollable song list */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-[#1F2023]/30 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1E1F22] px-2 py-1">
            {displayedSongs.length === 0 ? (
              activeChannel === "favorites" ? (
                <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/40 flex items-center justify-center text-zinc-400">
                    <Heart className="w-8 h-8" />
                  </div>
                  <p className="text-[#B5BAC1] text-sm italic">
                    No tienes canciones favoritas aún. Busca en YouTube y guárdalas.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-[#B5BAC1] text-sm italic">
                  No se encontraron canciones. Intenta otra búsqueda.
                </div>
              )
            ) : (
              displayedSongs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                const isPlayingCurrent = isCurrent && isPlaying;
                const isDownloading = downloadingId === song.id;
                const isFavorite = favoriteSongs.some((f) => f.id === song.id);

                return (
                  <div
                    key={song.id}
                    className={`grid grid-cols-12 items-center px-4 py-2.5 rounded-md transition-colors duration-150 group hover:bg-[#35373C]/50 ${
                      isCurrent ? "bg-[#35373C]/30" : ""
                    }`}
                  >
                    {/* Number / Play Action */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        onClick={() => (isCurrent ? togglePlay() : playSong(song))}
                        className="text-[#B5BAC1] group-hover:text-white transition-colors"
                        title={isPlayingCurrent ? "Pausar" : "Reproducir canción"}
                      >
                        {isPlayingCurrent ? (
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.75 bg-[#23A55A] animate-pulse h-full" />
                            <span className="w-0.75 bg-[#23A55A] animate-pulse h-2/3" />
                            <span className="w-0.75 bg-[#23A55A] animate-pulse h-1/2" />
                          </div>
                        ) : (
                          <span className="group-hover:hidden text-xs font-mono">
                            {index + 1}
                          </span>
                        )}
                        <Play className="w-3.5 h-3.5 fill-current hidden group-hover:block" />
                      </button>
                    </div>

                    {/* Title & Thumbnail */}
                    <div className="col-span-6 flex items-center gap-3 min-w-0 pr-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden shrink-0">
                        {song.thumbnail ? (
                          <img
                            src={song.thumbnail}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">
                            🎵
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold text-sm truncate ${
                              isCurrent ? "text-[#5865F2]" : "text-[#F2F3F5]"
                            }`}
                          >
                            {song.title}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 rounded shrink-0 ${
                              song.type === "LOCAL"
                                ? "bg-[#23A55A]/10 text-[#23A55A] border border-[#23A55A]/20"
                                : "bg-[#F23F43]/10 text-[#F23F43] border border-[#F23F43]/20"
                            }`}
                          >
                            {song.type}
                          </span>
                          
                          {/* Heart icon for favorite status */}
                          <button
                            onClick={() => handleToggleFavorite(song)}
                            className={`focus:outline-none transition-colors ml-1 ${
                              isFavorite ? "text-[#F23F43]" : "text-[#B5BAC1] hover:text-[#F23F43]"
                            }`}
                            title={isFavorite ? "En Favoritos" : "Marcar Favorita"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Artist */}
                    <div className="col-span-3 text-[#B5BAC1] text-xs truncate">
                      {song.artist}
                    </div>

                    {/* Duration & Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-3 pr-2">
                      {/* Hover action: download to VPS */}
                      {song.type === "YOUTUBE" && (
                        <button
                          onClick={() => handleDownload(song)}
                          disabled={isDownloading}
                          className={`transition-colors flex items-center justify-center ${
                            isDownloading
                              ? "text-[#FFa500]"
                              : "text-[#B5BAC1] hover:text-[#5865F2] opacity-0 group-hover:opacity-100"
                          }`}
                          title={isDownloading ? "Descargando..." : "Descargar al VPS"}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <DownloadCloud className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <span className="text-[#B5BAC1] text-xs font-mono group-hover:hidden">
                        {formatSongDuration(song.duration)}
                      </span>
                      <button
                        onClick={() => (isCurrent ? togglePlay() : playSong(song))}
                        className="text-[#5865F2] text-xs font-bold hidden group-hover:inline focus:outline-none"
                      >
                        {isPlayingCurrent ? "PAUSAR" : "REPRODUCIR"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Synced Lyrics */}
      {currentSong && (
        <div className="w-80 bg-[#2B2D31] rounded-lg border border-[#1F2023] flex flex-col min-h-0 p-4 shrink-0 overflow-hidden">
          <div className="text-xs font-bold text-[#949BA4] uppercase border-b border-[#1F2023] pb-2 mb-2 tracking-wider flex items-center justify-between shrink-0">
            <span>🎤 Letras Sincronizadas</span>
            <span className="text-[9px] text-[#23A55A] font-bold bg-[#23A55A]/10 border border-[#23A55A]/25 px-1.5 py-0.5 rounded">LRCLIB</span>
          </div>
          <div className="grow shrink min-h-0 overflow-hidden">
            <SyncedLyricsView />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Game Settings View ──────────────────────────────────────────────────────
function GameSettingsView() {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "raw">("standard");
  const [rawContent, setRawContent] = useState("");
  const [rawLoading, setRawLoading] = useState(false);

  // States for Directorio Raíz and FolderSelector
  const [minecraftPath, setMinecraftPath] = useState("");
  const [pathLoading, setPathLoading] = useState(true);
  const [showExplorer, setShowExplorer] = useState(false);
  const [explorerPath, setExplorerPath] = useState("");
  const [explorerFolders, setExplorerFolders] = useState<string[]>([]);
  const [explorerParent, setExplorerParent] = useState("");
  const [explorerError, setExplorerError] = useState<string | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [savingPath, setSavingPath] = useState(false);

  // Fetch server.properties
  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/minecraft/properties");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProperties(data.properties || {});
        }
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  // Fetch minecraft path config
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/minecraft/config");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMinecraftPath(data.minecraftServerPath || "");
        }
      }
    } catch (err) {
      console.error("Error fetching config:", err);
    } finally {
      setPathLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProperties(), fetchConfig()]);
      setLoading(false);
    };
    init();
  }, []);

  // Directory explorer load
  const loadExplorer = async (pathStr: string) => {
    setExplorerLoading(true);
    setExplorerError(null);
    try {
      const url = `/api/vps/explorer?path=${encodeURIComponent(pathStr)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setExplorerPath(data.currentPath);
        setExplorerParent(data.parentPath);
        setExplorerFolders(data.folders || []);
      } else {
        setExplorerError(data.error || "No se pudo leer el directorio.");
      }
    } catch (err: any) {
      setExplorerError("Error de conexión con el explorador.");
    } finally {
      setExplorerLoading(false);
    }
  };

  const openExplorer = () => {
    setShowExplorer(true);
    loadExplorer(minecraftPath || "");
  };

  const handleSelectFolder = async () => {
    setSavingPath(true);
    try {
      // 1. Save config to DB
      const res = await fetch("/api/minecraft/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minecraftServerPath: explorerPath }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMinecraftPath(explorerPath);
        setShowExplorer(false);
        
        // 2. Trigger auto-discovery to sync
        const scanRes = await fetch("/api/minecraft/discovery");
        if (scanRes.ok) {
          const scanData = await scanRes.json();
          if (scanData.success) {
            setStatus({
              type: "success",
              message: `Directorio raíz actualizado a "${explorerPath}". Auto-descubrimiento detectó ${scanData.modsCount} mods.`,
            });
          }
        }
        
        // 3. Reload server properties from the new path
        await fetchProperties();
      } else {
        setStatus({ type: "error", message: data.error || "No se pudo actualizar el directorio." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Error al conectar con la base de datos." });
    } finally {
      setSavingPath(false);
    }
  };

  const handleSaveProperties = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/minecraft/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ type: "success", message: "Ajustes del servidor guardados exitosamente." });
      } else {
        setStatus({ type: "error", message: data.error || "Ocurrió un error al guardar los ajustes." });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Error de conexión al guardar los ajustes." });
    } finally {
      setSaving(false);
    }
  };

  const updateProp = (key: string, value: string) => {
    setProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading || pathLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#949BA4] text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#FFa500] border-t-transparent rounded-full animate-spin" />
          <span>Cargando configuración de juego...</span>
        </div>
      </div>
    );
  }

  const pvpChecked = properties["pvp"] === "true";
  const onlineModeChecked = properties["online-mode"] === "true";
  const allowFlightChecked = properties["allow-flight"] === "true";

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-6">
      {/* Tarjeta de Directorio Raíz */}
      <div className="max-w-2xl mx-auto bg-[#2B2D31] rounded-lg border border-[#1F2023] p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Directorio Raíz del Servidor</h2>
          <p className="text-[10px] text-[#949BA4] mt-0.5">
            Ruta física del VPS donde están instalados los archivos de Minecraft.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-[#111214] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] font-mono select-all overflow-x-auto whitespace-nowrap scrollbar-none">
            {minecraftPath || "No configurado"}
          </div>
          <button
            type="button"
            onClick={openExplorer}
            className="bg-[#4E5058] hover:bg-[#6D6F78] text-[#F2F3F5] text-xs font-semibold py-2.5 px-4 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer h-9 shadow-sm"
          >
            <FolderOpen className="w-4 h-4" />
            Examinar VPS
          </button>
        </div>
      </div>

      {/* Formulario de Ajustes del Servidor */}
      <form onSubmit={handleSaveProperties} id="ajustes-servidor" className="max-w-2xl mx-auto bg-[#2B2D31] rounded-lg border border-[#1F2023] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-zinc-400" /> Configuración de Juego
          </h2>
          <p className="text-xs text-[#949BA4] mt-1">
            Modifica las propiedades del servidor de Minecraft (Fabric 1.20.1) directamente. Los cambios requieren reiniciar el servidor.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-[#1F2023] gap-4 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("standard");
              setStatus(null);
            }}
            className={`pb-2 px-1 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "standard"
                ? "text-[#5865F2] border-b-2 border-[#5865F2]"
                : "text-[#949BA4] hover:text-[#DBDEE1]"
            }`}
          >
            Ajustes Básicos
          </button>
          <button
            type="button"
            onClick={async () => {
              setActiveTab("raw");
              setStatus(null);
              setRawLoading(true);
              try {
                const res = await fetch("/api/minecraft/properties?raw=true");
                if (res.ok) {
                  const data = await res.json();
                  if (data.success) {
                    setRawContent(data.content || "");
                  }
                }
              } catch (err) {
                console.error("Error fetching raw properties:", err);
              } finally {
                setRawLoading(false);
              }
            }}
            className={`pb-2 px-1 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "raw"
                ? "text-[#5865F2] border-b-2 border-[#5865F2]"
                : "text-[#949BA4] hover:text-[#DBDEE1]"
            }`}
          >
            Editor Raw (Avanzado)
          </button>
        </div>

        {status && (
          <div
            className={`p-3 rounded text-xs flex items-start gap-2 border ${
              status.type === "success"
                ? "bg-[#23A55A]/10 text-[#23A55A] border-[#23A55A]/30"
                : "bg-[#F23F43]/10 text-[#F23F43] border-[#F23F43]/30"
            }`}
          >
            <span className="mt-0.5 font-bold">{status.type === "success" ? "✓" : "⚠"}</span>
            <div>{status.message}</div>
          </div>
        )}

        {activeTab === "standard" && (
          <>
            {/* Section 1: General */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-[#949BA4] tracking-wider uppercase">Configuración General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nombre del Mundo (level-name)" description="Nombre del directorio del mundo en el servidor.">
                  <input
                    type="text"
                    title="Nombre del Mundo"
                    placeholder="world"
                    value={properties["level-name"] || "world"}
                    onChange={e => updateProp("level-name", e.target.value)}
                    className="w-full bg-[#111214] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors font-mono"
                  />
                </FormField>

                <FormField label="Máximo de Jugadores" description="Cantidad máxima de jugadores simultáneos permitidos.">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    title="Máximo de Jugadores"
                    placeholder="20"
                    value={properties["max-players"] || "20"}
                    onChange={e => updateProp("max-players", e.target.value)}
                    className="w-full bg-[#111214] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors font-mono"
                  />
                </FormField>
              </div>

              <FormField label="Mensaje del Día (MOTD)" description="El mensaje publicitario que se muestra en la lista de servidores del juego.">
                <input
                  type="text"
                  title="Mensaje del Día"
                  placeholder="Absolute Minecraft Server"
                  value={properties["motd"] || "A Minecraft Server"}
                  onChange={e => updateProp("motd", e.target.value)}
                  className="w-full bg-[#111214] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
                />
              </FormField>
            </div>

            {/* Section 2: Mechanics */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-[#949BA4] tracking-wider uppercase">Mecánicas de Juego</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle
                  label="Habilitar PVP"
                  description="Permite que los jugadores se inflijan daño entre sí."
                  checked={pvpChecked}
                  onChange={v => updateProp("pvp", v ? "true" : "false")}
                />

                <FormField label="Dificultad de Juego" description="Nivel de dificultad para los mobs and mecánicas de supervivencia.">
                  <select
                    value={properties["difficulty"] || "easy"}
                    onChange={e => updateProp("difficulty", e.target.value)}
                    title="Dificultad del juego"
                    className="w-full bg-[#111214] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
                  >
                    <option value="peaceful">Pacífico (Peaceful)</option>
                    <option value="easy">Fácil (Easy)</option>
                    <option value="normal">Normal (Normal)</option>
                    <option value="hard">Difícil (Hard)</option>
                  </select>
                </FormField>

                <FormField label="Modo de Juego Predeterminado" description="El modo de juego asignado por defecto al unirse.">
                  <select
                    value={properties["gamemode"] || "survival"}
                    onChange={e => updateProp("gamemode", e.target.value)}
                    title="Modo de juego predeterminado"
                    className="w-full bg-[#111214] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
                  >
                    <option value="survival">Supervivencia (Survival)</option>
                    <option value="creative">Creativo (Creative)</option>
                    <option value="adventure">Aventura (Adventure)</option>
                    <option value="spectator">Espectador (Spectator)</option>
                  </select>
                </FormField>

                <Toggle
                  label="Permitir Vuelo (allow-flight)"
                  description="Permite a los jugadores volar si usan mods habilitados."
                  checked={allowFlightChecked}
                  onChange={v => updateProp("allow-flight", v ? "true" : "false")}
                />
              </div>
            </div>

            {/* Section 3: Network & Security */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-[#949BA4] tracking-wider uppercase">Red y Seguridad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle
                  label="Modo Online (online-mode)"
                  description="Verifica cuentas con Mojang. Desactívalo para permitir cuentas 'No Premium' (Offline)."
                  checked={onlineModeChecked}
                  onChange={v => updateProp("online-mode", v ? "true" : "false")}
                />

                <FormField label="Protección de Spawn (Bloques)" description="Radio del área de spawn protegida contra modificaciones de jugadores no OPs.">
                  <input
                    type="number"
                    min="0"
                    title="Protección de Spawn"
                    placeholder="16"
                    value={properties["spawn-protection"] || "16"}
                    onChange={e => updateProp("spawn-protection", e.target.value)}
                    className="w-full bg-[#111214] text-[#DBDEE1] text-xs p-2 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors font-mono"
                  />
                </FormField>
              </div>
            </div>

            {/* Save button footer */}
            <div className="flex justify-end pt-4 border-t border-[#1F2023]">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#23A55A] hover:bg-[#1a7f43] disabled:bg-[#23A55A]/50 text-white font-semibold text-xs py-2 px-6 rounded transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 h-9"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </>
        )}

        {activeTab === "raw" && (
          <div className="space-y-4">
            {rawLoading ? (
              <div className="flex items-center justify-center h-48 text-xs text-[#949BA4] gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFa500]" />
                Cargando server.properties...
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="# Minecraft Server Properties"
                  className="w-full h-96 bg-[#111214] text-[#DBDEE1] font-mono text-xs p-4 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] resize-none whitespace-pre overflow-x-auto"
                />
                <div className="flex justify-end pt-4 border-t border-[#1F2023]">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      setStatus(null);
                      try {
                        const res = await fetch("/api/minecraft/properties", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ rawContent }),
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setStatus({ type: "success", message: "Archivo server.properties sobrescrito con éxito." });
                          await fetchProperties(); // Sync standard properties list
                        } else {
                          setStatus({ type: "error", message: data.error || "Error al sobrescribir el archivo." });
                        }
                      } catch (err) {
                        console.error(err);
                        setStatus({ type: "error", message: "Error al guardar el archivo raw." });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="bg-[#23A55A] hover:bg-[#1a7f43] disabled:bg-[#23A55A]/50 text-white font-semibold text-xs py-2 px-6 rounded transition-colors cursor-pointer shadow-sm h-9 flex items-center animate-in fade-in"
                  >
                    {saving ? "Guardando..." : "Guardar Archivo Completo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Modal del Explorador de Directorios */}
      {showExplorer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 p-4 select-none">
          <div className="bg-[#2B2D31] w-full max-w-lg rounded-lg border border-[#1F2023] shadow-2xl flex flex-col max-h-[80vh]">
            
            {/* Header del Modal */}
            <div className="p-4 border-b border-[#1F2023] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-zinc-400" /> Explorador de Directorios del VPS
              </h3>
              <button
                type="button"
                onClick={() => setShowExplorer(false)}
                className="text-[#949BA4] hover:text-white text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Path actual */}
            <div className="bg-[#1E1F22] px-4 py-2 text-[10px] text-[#B5BAC1] font-mono border-b border-[#1F2023] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <span className="text-zinc-500">Ruta:</span>
              <span>{explorerPath}</span>
            </div>

            {/* Contenido (Lista de carpetas) */}
            <div className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[400px]">
              {explorerLoading ? (
                <div className="flex items-center justify-center h-48 text-xs text-[#949BA4] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#23A55A]" />
                  Cargando directorios...
                </div>
              ) : explorerError ? (
                <div className="text-xs text-[#F23F43] p-4 text-center">
                  {explorerError}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {/* Botón para subir nivel */}
                  {explorerPath !== explorerParent && (
                    <button
                      key="go-parent"
                      type="button"
                      onClick={() => loadExplorer(explorerParent)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs text-[#DBDEE1] hover:bg-[#1E1F22] transition-colors cursor-pointer text-left font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#B5BAC1]" />
                      <span>.. (Subir un nivel)</span>
                    </button>
                  )}

                  {explorerFolders.length === 0 ? (
                    <div className="text-xs text-zinc-500 p-8 text-center">
                      No se encontraron subcarpetas.
                    </div>
                  ) : (
                    explorerFolders.map((folder) => (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => {
                          const separator = explorerPath.endsWith("/") || explorerPath.endsWith("\\") ? "" : (process.platform === "win32" ? "\\" : "/");
                          loadExplorer(explorerPath + separator + folder);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs text-[#DBDEE1] hover:bg-[#1E1F22] transition-colors cursor-pointer text-left group"
                      >
                        <Folder className="w-4 h-4 text-[#8a8e94] group-hover:text-[#F2F3F5] transition-colors" />
                        <span className="truncate">{folder}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-[#1F2023] bg-[#1E1F22] rounded-b-lg flex justify-between items-center">
              <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                Seleccionado: {explorerPath.split(process.platform === "win32" ? "\\" : "/").pop() || "/"}
              </span>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExplorer(false)}
                  className="bg-[#4E5058] hover:bg-[#6D6F78] text-white text-xs font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={explorerLoading || savingPath}
                  onClick={handleSelectFolder}
                  className="bg-[#23A55A] hover:bg-[#1a7f43] disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {savingPath ? "Guardando..." : "Seleccionar esta carpeta"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-[#1E1F22] rounded-lg border border-[#1F2023] hover:bg-[#1E1F22]/80 transition-colors">
      <div className="space-y-0.5 mr-2">
        <span className="text-xs font-bold text-[#DBDEE1] block">{label}</span>
        {description && <span className="text-[10px] text-[#949BA4] block leading-tight">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        title={label}
        aria-label={label}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
          checked ? "bg-[#23A55A]" : "bg-[#4E5058]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function FormField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 bg-[#1E1F22] rounded-lg border border-[#1F2023] hover:bg-[#1E1F22]/80 transition-colors">
      <div>
        <span className="text-xs font-bold text-[#DBDEE1] block">{label}</span>
        {description && <span className="text-[10px] text-[#949BA4] block leading-tight mt-0.5">{description}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── ChatView ─────────────────────────────────────────────────────────────────
// Real-time Discord-style internal chat using Socket.io /chat namespace.

interface ChatMessage {
  id: string;
  content: string;
  channelId: string;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  replyToId?: string | null;
  isEdited?: boolean;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatarUrl: string | null;
  };
}

function ChatView() {
  const { state } = useNav();
  const { activeChannel } = state;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<ReturnType<typeof socketIO> | null>(null);
  const currentChannelRef = useRef<string>(activeChannel);

  // Phase 5 Additions
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Phase 6 Additions
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // New additions for edits, reactions, voice recording, typing indicator
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Fetch current session userId and userName from NextAuth
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUserId(data.user.id ?? data.user.email ?? "anon");
          setUserName(data.user.name ?? data.user.email ?? "Admin-Nexus");
        }
      })
      .catch(() => {});
  }, []);

  // Connect to /chat namespace once on mount
  useEffect(() => {
    const socketUrl = typeof window !== "undefined" && window.location.port === "3000"
      ? "http://localhost:3001/chat"
      : "/chat";

    const s = socketIO(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });
    setSocket(s);

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("join-channel", currentChannelRef.current);
    });
    s.on("disconnect", () => setIsConnected(false));

    return () => {
      s.disconnect();
    };
  }, []);

  // Handle incoming messages, edits, deletions, reactions, and typing indicators
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: ChatMessage) => {
      console.log("Recibido del servidor:", msg);
      if (msg.channelId === currentChannelRef.current) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleMessageEdited = (editedMsg: ChatMessage) => {
      console.log("Mensaje editado del servidor:", editedMsg);
      if (editedMsg.channelId === currentChannelRef.current) {
        setMessages((prev) => prev.map((msg) => msg.id === editedMsg.id ? editedMsg : msg));
      }
    };

    const handleMessageDeleted = (deletedId: string) => {
      console.log("Mensaje eliminado del servidor:", deletedId);
      setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
    };

    const handleUserTypingStart = ({ channelId, userId: tUserId, userName: tUserName }: { channelId: string; userId: string; userName: string }) => {
      if (channelId === currentChannelRef.current) {
        setTypingUsers((prev) => ({ ...prev, [tUserId]: tUserName || `Usuario-${tUserId.substring(0, 4)}` }));
      }
    };

    const handleUserTypingStop = ({ channelId, userId: tUserId }: { channelId: string; userId: string }) => {
      if (channelId === currentChannelRef.current) {
        setTypingUsers((prev) => {
          const copy = { ...prev };
          delete copy[tUserId];
          return copy;
        });
      }
    };

    const handleReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
      setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, reactions } : msg));
    };

    socket.on("new-message", handleNewMessage);
    socket.on("message-edited", handleMessageEdited);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("user-typing-start", handleUserTypingStart);
    socket.on("user-typing-stop", handleUserTypingStop);
    socket.on("reaction-updated", handleReactionUpdated);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-edited", handleMessageEdited);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("user-typing-start", handleUserTypingStart);
      socket.off("user-typing-stop", handleUserTypingStop);
      socket.off("reaction-updated", handleReactionUpdated);
    };
  }, [socket]);

  // When channel changes: join new room + fetch history
  useEffect(() => {
    currentChannelRef.current = activeChannel;
    setMessages([]);
    setTypingUsers({});
    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsLoading(true);
    if (socket?.connected) {
      socket.emit("join-channel", activeChannel);
    }
    fetch(`/api/chat/messages?channelId=${activeChannel}`)
      .then((r) => r.json())
      .then((data: ChatMessage[]) => { if (Array.isArray(data)) setMessages(data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeChannel, socket]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const inputEl = inputRef.current;
    if (!inputEl) {
      setInput((prev) => prev + emoji);
      return;
    }

    const start = inputEl.selectionStart ?? 0;
    const end = inputEl.selectionEnd ?? 0;
    const text = input;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setInput(newText);

    // Reposition cursor after emoji
    setTimeout(() => {
      inputEl.focus();
      inputEl.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit("delete-message", { messageId });
  };

  const handleReactionToggle = (messageId: string, emoji: string) => {
    if (socket && userId) {
      socket.emit("toggle-reaction", { messageId, userId, emoji });
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (socket && newContent.trim()) {
      socket.emit("edit-message", { messageId, content: newContent });
    }
    setEditingMessageId(null);
    setEditInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!isTypingRef.current && userId && socket) {
      isTypingRef.current = true;
      socket.emit("typing-start", { channelId: activeChannel, userId, userName: userName || "Usuario" });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && userId && socket) {
        isTypingRef.current = false;
        socket.emit("typing-stop", { channelId: activeChannel, userId });
      }
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await uploadAudioNote(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("No se pudo iniciar la grabación de audio:", err);
      alert("Permiso de micrófono denegado o no disponible.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioNote = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "voice-note.webm");
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir nota de voz");
      const uploadData = await res.json();
      
      if (socket && userId) {
        const payload = {
          channelId: activeChannel,
          content: "",
          userId,
          attachmentUrl: uploadData.url,
          attachmentType: "audio",
          replyToId: replyingTo?.id || null,
        };
        socket.emit("send-message", payload);
        setReplyingTo(null);
      }
    } catch (err: any) {
      alert(err.message || "Error al enviar nota de voz");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed && !selectedFile) return;
    if (!userId || !socket) return;

    // Stop typing indicator on send
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("typing-stop", { channelId: activeChannel, userId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setIsUploading(true);
    let attachmentUrl: string | undefined = undefined;
    let attachmentType: string | undefined = undefined;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const res = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Error al subir archivo");
        const uploadData = await res.json();
        attachmentUrl = uploadData.url;
        attachmentType = uploadData.type;
      }

      const payload = {
        channelId: activeChannel,
        content: trimmed,
        userId,
        attachmentUrl,
        attachmentType,
        replyToId: replyingTo?.id || null,
      };

      console.log("Mensaje enviado:", payload);
      socket.emit("send-message", payload);

      setInput("");
      setSelectedFile(null);
      setReplyingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      alert(err.message || "Error al enviar mensaje");
    } finally {
      setIsUploading(false);
    }
  };

  const getAvatar = (user: ChatMessage["user"]) => {
    const src = user.avatarUrl || user.image;
    const initial = (user.name || user.email || "A")[0].toUpperCase();
    const palette = ["bg-[#5865F2]", "bg-[#23A55A]", "bg-[#F23F43]", "bg-[#FFa500]", "bg-[#60A5FA]", "bg-[#A78BFA]"];
    const bgClass = palette[initial.charCodeAt(0) % palette.length];
    if (src) {
      return <img src={src} alt={user.name ?? user.email} className="w-10 h-10 rounded-full object-cover shrink-0" />;
    }
    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${bgClass}`}
      >
        {initial}
      </div>
    );
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const t = new Date();
    const y = new Date(t);
    y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Hoy";
    if (d.toDateString() === y.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  };

  const renderAttachment = (msg: ChatMessage) => {
    if (!msg.attachmentUrl) return null;
    if (msg.attachmentType === "image") {
      return (
        <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-[#232428] shadow-md bg-[#2B2D31]">
          <img
            src={msg.attachmentUrl}
            alt="Adjunto"
            className="max-h-60 object-contain hover:scale-[1.01] transition-transform duration-200 cursor-pointer"
            onClick={() => window.open(msg.attachmentUrl!, "_blank")}
          />
        </div>
      );
    }
    if (msg.attachmentType === "audio") {
      return (
        <div className="mt-2 max-w-xs">
          <audio src={msg.attachmentUrl} controls className="w-full bg-[#2B2D31] rounded-md outline-none text-[#F2F3F5]" />
        </div>
      );
    }
    const fileName = msg.attachmentUrl.split("/").pop() || "archivo";
    return (
      <div className="mt-2 flex items-center gap-3 p-3 rounded bg-[#2B2D31] border border-[#1F2023] max-w-md shadow-sm">
        <Folder className="w-10 h-10 text-[#5865F2] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#F2F3F5] truncate" title={fileName}>
            {fileName}
          </p>
          <p className="text-[10px] text-[#949BA4]">Archivo adjunto</p>
        </div>
        <a
          href={msg.attachmentUrl}
          download
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold py-1.5 px-3.5 rounded transition-colors shrink-0 cursor-pointer text-center"
        >
          Descargar
        </a>
      </div>
    );
  };

  const groupReactions = (reactionsList: any[]) => {
    const groups: { [emoji: string]: { count: number; users: string[]; me: boolean } } = {};
    reactionsList?.forEach((r) => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { count: 0, users: [], me: false };
      }
      groups[r.emoji].count += 1;
      groups[r.emoji].users.push(r.user.name || r.user.email);
      if (r.userId === userId) {
        groups[r.emoji].me = true;
      }
    });
    return groups;
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (editingMessageId === msg.id) {
      return (
        <div className="mt-1.5 flex flex-col gap-1.5 w-full">
          <input
            type="text"
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            className="w-full bg-[#383a40] text-[#dbdee1] text-sm px-3 py-2 rounded outline-none border border-[#5865f2]"
            autoFocus
            title="Editar mensaje"
            placeholder="Editar mensaje"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleEditMessage(msg.id, editInput);
              } else if (e.key === "Escape") {
                setEditingMessageId(null);
                setEditInput("");
              }
            }}
          />
          <div className="flex gap-2 text-[10px]">
            <span className="text-[#949ba4]">
              Presiona <span className="text-[#dbdee1] font-semibold">Enter</span> para guardar • <span className="text-[#dbdee1] font-semibold">Esc</span> para cancelar
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="text-sm flex flex-col items-start">
        {msg.content && (
          <div className="text-[#dbdee1] text-sm leading-relaxed wrap-break-word whitespace-pre-wrap select-text">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  return isInline ? (
                    <code className="bg-[#1e1f22] text-[#e0c068] px-1 py-0.5 rounded font-mono text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-[#1e1f22] p-2.5 rounded text-xs font-mono text-[#dbdee1] overflow-x-auto my-1.5 border border-[#1f2023] max-w-full select-text">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                }
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        {msg.isEdited && (
          <span className="text-[10px] text-[#949ba4] mt-0.5 select-none">(editado)</span>
        )}
      </div>
    );
  };

  const renderReactions = (msg: ChatMessage) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;
    const grouped = groupReactions(msg.reactions);
    return (
      <div className="flex flex-wrap gap-1.5 mt-2 select-none">
        {Object.entries(grouped).map(([emoji, data]) => (
          <button
            key={emoji}
            onClick={() => handleReactionToggle(msg.id, emoji)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer text-xs ${
              data.me
                ? "bg-[#5865F2]/10 border-[#5865F2] text-[#5865F2]"
                : "bg-[#2B2D31] border-[#1F2023] text-[#B5BAC1] hover:bg-[#35373C]"
            }`}
            title={data.users.join(", ")}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-bold">{data.count}</span>
          </button>
        ))}
      </div>
    );
  };

  const buildActionsOverlay = (msg: ChatMessage) => {
    return (
      <div className="absolute right-4 -top-3.5 hidden group-hover:flex items-center gap-1 bg-[#313338] border border-[#1F2023] rounded px-1.5 py-0.5 shadow-md z-20">
        {/* Reacciones Popover */}
        <div className="relative">
          <button
            onClick={() => setActiveReactionPickerMessageId(activeReactionPickerMessageId === msg.id ? null : msg.id)}
            className="p-1 text-[#b5bac1] hover:text-white hover:bg-[#35373c] rounded transition-colors cursor-pointer"
            title="Reaccionar"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          {activeReactionPickerMessageId === msg.id && (
            <div className="absolute bottom-7 right-0 flex gap-1.5 bg-[#2b2d31] border border-[#1f2023] rounded-md p-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-100">
              {["👍", "❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReactionToggle(msg.id, emoji);
                    setActiveReactionPickerMessageId(null);
                  }}
                  className="hover:scale-125 transition-transform text-sm cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Responder */}
        <button
          onClick={() => setReplyingTo(msg)}
          className="p-1 text-[#b5bac1] hover:text-white hover:bg-[#35373c] rounded transition-colors cursor-pointer"
          title="Responder"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
        </button>

        {/* Editar */}
        {userId && msg.user.id === userId && (
          <button
            onClick={() => {
              setEditingMessageId(msg.id);
              setEditInput(msg.content);
            }}
            className="p-1 text-[#b5bac1] hover:text-white hover:bg-[#35373c] rounded transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Eliminar */}
        {userId && msg.user.id === userId && (
          <button
            onClick={() => handleDeleteMessage(msg.id)}
            className="p-1 text-[#f23f43] hover:bg-[#f23f43]/10 rounded transition-colors cursor-pointer"
            title="Eliminar mensaje"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const renderMessages = () => {
    const items: React.ReactNode[] = [];
    let lastDate = "";
    let lastUid = "";
    let lastTs = 0;

    messages.forEach((msg, i) => {
      const msgDate = fmtDate(msg.createdAt);
      const msgTs = new Date(msg.createdAt).getTime();
      const compact = lastUid === msg.user.id && msgTs - lastTs < 300000 && !msg.replyTo;

      if (msgDate !== lastDate) {
        items.push(
          <div key={`div-${i}`} className="flex items-center gap-3 my-4 px-4">
            <div className="flex-1 h-px bg-[#3F4147]" />
            <span className="text-[11px] font-semibold text-[#80848E] whitespace-nowrap">{msgDate}</span>
            <div className="flex-1 h-px bg-[#3F4147]" />
          </div>
        );
        lastDate = msgDate;
        lastUid = "";
      }

      const replyCitation = msg.replyTo && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#B5BAC1] pl-14 mb-0.5 select-none relative">
          <div className="absolute left-[33px] top-[9px] w-[18px] h-[10px] border-l-2 border-t-2 border-[#4F545C] rounded-tl-[4px]" />
          <span className="font-bold text-[#E3E5E8] pl-1 truncate max-w-[120px]">
            @{msg.replyTo.user.name || msg.replyTo.user.email}
          </span>
          <span className="text-[#949BA4] truncate max-w-sm italic">
            {msg.replyTo.content || "[Archivo adjunto]"}
          </span>
        </div>
      );

      if (compact) {
        items.push(
          <div key={msg.id} className="relative group flex items-start gap-3 px-4 py-0.5 hover:bg-[#2e3035] rounded">
            {buildActionsOverlay(msg)}
            <div className="w-10 shrink-0 flex justify-center items-center pt-0.5">
              <span className="text-[10px] text-[#80848E] opacity-0 group-hover:opacity-100 transition-opacity select-none leading-none">
                {fmt(msg.createdAt)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {renderMessageContent(msg)}
              {renderAttachment(msg)}
              {renderReactions(msg)}
            </div>
          </div>
        );
      } else {
        items.push(
          <div key={msg.id} className="flex flex-col mt-1.5">
            {replyCitation}
            <div className="relative group flex items-start gap-3 px-4 py-1.5 hover:bg-[#2e3035] rounded">
              {buildActionsOverlay(msg)}
              {getAvatar(msg.user)}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-semibold text-[#F2F3F5] text-sm">
                    {msg.user.name || msg.user.email}
                  </span>
                  <span className="text-[11px] text-[#80848E]">{fmt(msg.createdAt)}</span>
                </div>
                {renderMessageContent(msg)}
                {renderAttachment(msg)}
                {renderReactions(msg)}
              </div>
            </div>
          </div>
        );
        lastUid = msg.user.id;
      }
      lastTs = msgTs;
    });
    return items;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative bg-[#313338]">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-[#949BA4]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando mensajes...</span>
            </div>
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[#5865F2]" />
            </div>
            <div>
              <p className="font-bold text-[#F2F3F5] text-lg">¡Bienvenido a #{activeChannel}!</p>
              <p className="text-[#949BA4] text-sm mt-1">
                Este es el inicio del canal. ¡Sé el primero en escribir algo!
              </p>
            </div>
          </div>
        )}
        {!isLoading && renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="px-4 py-1 flex items-center gap-1.5 text-xs text-[#949BA4] select-none animate-pulse">
          <span className="font-semibold text-[#DBDEE1]">
            {Object.values(typingUsers).join(", ")}
          </span>
          <span>{Object.keys(typingUsers).length === 1 ? "está escribiendo..." : "están escribiendo..."}</span>
        </div>
      )}

      {/* Reconnecting banner */}
      {!isConnected && (
        <div className="px-4 py-1.5 bg-[#F23F43]/10 border-t border-[#F23F43]/20 shrink-0 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-[#F23F43]" />
          <p className="text-[11px] text-[#F23F43]">Reconectando al servidor de chat...</p>
        </div>
      )}

      {/* File attachment preview */}
      {selectedFile && (
        <div className="mx-4 mb-2 p-2 bg-[#2B2D31] rounded-lg border border-[#1F2023] flex items-center justify-between animate-in fade-in duration-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip className="w-4 h-4 text-[#B5BAC1]" />
            <span className="text-xs text-[#DBDEE1] truncate font-medium">
              {selectedFile.name}
            </span>
            <span className="text-[10px] text-[#949BA4]">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-[#949BA4] hover:text-white transition-colors cursor-pointer text-xs"
            title="Quitar Adjunto"
          >
            &times;
          </button>
        </div>
      )}

      {/* Input bar — pressed to the bottom */}
      <form onSubmit={handleSubmit} className="px-4 pb-6 pt-3 shrink-0 relative">
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4 z-50">
            <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
            <div className="relative shadow-2xl rounded-lg overflow-hidden border border-[#1F2023]">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={handleEmojiClick}
                width={320}
                height={400}
              />
            </div>
          </div>
        )}

        {/* Replying Preview Banner */}
        {replyingTo && (
          <div className="px-4 py-2 bg-[#2B2D31] rounded-t-lg border-x border-t border-[#1F2023] flex items-center justify-between animate-in slide-in-from-bottom-2 duration-100 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-[#B5BAC1] min-w-0">
              <span className="text-[#949BA4]">Respondiendo a</span>
              <span className="font-semibold text-white">
                @{replyingTo.user.name || replyingTo.user.email}
              </span>
              <span className="text-[#949BA4] truncate italic max-w-xs">
                "{replyingTo.content || "[Archivo adjunto]"}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-[#949BA4] hover:text-white transition-colors cursor-pointer text-xs font-bold font-mono"
              title="Cancelar respuesta"
            >
              &times;
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 bg-[#383A40] px-4 py-3 border border-[#383A40] focus-within:border-[#5865F2]/60 transition-colors ${
          replyingTo ? "rounded-b-lg border-t-0" : "rounded-lg"
        }`}>
          {/* File select button */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            title="Adjuntar archivo"
            placeholder="Adjuntar archivo"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || isUploading || isRecording}
            className="text-[#80848E] hover:text-[#DBDEE1] transition-colors disabled:opacity-30 cursor-pointer shrink-0"
            title="Adjuntar archivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Grabación de Audio */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected || isUploading}
            className={`transition-colors disabled:opacity-30 cursor-pointer shrink-0 ${
              isRecording ? "text-[#F23F43] animate-pulse scale-110" : "text-[#80848E] hover:text-[#DBDEE1]"
            }`}
            title={isRecording ? "Detener y enviar audio" : "Grabar nota de voz"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={isRecording ? "Grabando audio..." : input}
            onChange={handleInputChange}
            placeholder={isRecording ? "Haz clic en el micrófono de nuevo para detener y enviar" : `Mensaje #${activeChannel}`}
            disabled={!isConnected || isUploading || isRecording}
            className="flex-1 bg-transparent text-[#DBDEE1] text-sm placeholder-[#72767D] outline-none disabled:opacity-50"
            autoComplete="off"
          />

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!isConnected || isUploading || isRecording}
            className="text-[#80848E] hover:text-[#DBDEE1] transition-colors disabled:opacity-30 cursor-pointer shrink-0 mr-1"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="submit"
            disabled={!isConnected || (!input.trim() && !selectedFile) || isUploading || isRecording}
            className="text-[#80848E] hover:text-[#5865F2] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Enviar (Enter)"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#72767D] mt-1 px-1">
          Presiona{" "}
          <kbd className="bg-[#2B2D31] px-1 py-0.5 rounded text-[10px] font-mono text-[#B5BAC1]">
            Enter
          </kbd>{" "}
          para enviar
        </p>
      </form>
    </div>
  );
}
