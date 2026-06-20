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
  DownloadCloud,
  Loader2,
  Folder,
  ChevronLeft,
  Heart,
} from "lucide-react";
import { useNav, MODULE_CONFIG } from "@/context/NavigationContext";
import FileExplorer from "@/components/FileExplorer";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMusic } from "@/context/MusicContext";
import type { SongData } from "@/context/MusicContext";

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

      {/* Chat placeholder */}
      {activeModule === "chat" && <PlaceholderView icon={MessageSquare} label="Chat Interno" color="#60A5FA" subtitle="Sistema de mensajería interna (próximamente)" />}

      {/* Spotify (Absolute Nexus Music) view */}
      {activeModule === "spotify" && (
        <MusicModuleView />
      )}

      {/* Settings module */}
      {activeModule === "settings" && activeChannel === "usuarios" && (
        <SettingsUsersView />
      )}
      {activeModule === "settings" && activeChannel !== "usuarios" && (
        <PlaceholderView
          icon={Settings}
          label={`Configuración — ${channelObj?.label || activeChannel}`}
          color="#949BA4"
          subtitle="Gestión de configuración (próximamente)"
        />
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

// ─── Settings Users View ──────────────────────────────────────────────────────
function SettingsUsersView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) {
      setStatus({ type: "error", message: "Todos los campos obligatorios deben completarse." });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ type: "success", message: data.message });
        setName("");
        setEmail("");
        setPassword("");
        setRole("USER");
      } else {
        setStatus({ type: "error", message: data.error || "Error al crear el usuario." });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", message: "Error de red al intentar conectar con la API." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-md mx-auto bg-[#2B2D31] rounded-lg border border-[#1F2023] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" /> Crear Cuenta Secundaria
          </h2>
          <p className="text-xs text-[#949BA4] mt-1">
            Permite registrar un nuevo miembro del equipo asignando un rol de acceso específico.
          </p>
        </div>

        {status && (
          <div
            className={`p-3 rounded text-xs flex items-start gap-2 border ${
              status.type === "success"
                ? "bg-[#23A55A]/10 text-[#23A55A] border-[#23A55A]/30"
                : "bg-[#F23F43]/10 text-[#F23F43] border-[#F23F43]/30"
            }`}
          >
            <div className="mt-0.5 font-bold shrink-0">
              {status.type === "success" ? "✓" : "⚠"}
            </div>
            <div>{status.message}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
              Nombre Completo (Opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
              Correo Electrónico <span className="text-[#F23F43]">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@absolutenexus.com"
              className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
              Contraseña <span className="text-[#F23F43]">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña de acceso"
                  className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#949BA4] hover:text-white transition-colors"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "👁" : "👁‍┐"}
                </button>
              </div>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="bg-zinc-800 text-[#DBDEE1] border border-zinc-700 hover:bg-zinc-700 px-3 py-2.5 rounded text-xs font-semibold shrink-0 cursor-pointer transition-colors"
              >
                Generar
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#949BA4] uppercase tracking-wide block">
              Rol de Acceso <span className="text-[#F23F43]">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              title="Seleccionar rol de acceso"
              className="w-full bg-[#1E1F22] text-[#DBDEE1] text-xs p-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2] transition-colors"
            >
              <option value="USER">Usuario (Acceso Estándar)</option>
              <option value="MODERATOR">Moderador (Acceso Elevado)</option>
              <option value="ADMIN_GENERAL">Administrador General (Acceso Total)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#23A55A] hover:bg-[#1a7f43] disabled:bg-[#23A55A]/50 text-white font-semibold text-xs py-2.5 px-4 rounded transition-colors mt-2 cursor-pointer shadow-sm"
          >
            {isSubmitting ? "Registrando..." : "Crear Usuario"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Music Module View (Col 3) ────────────────────────────────────────────────

const INITIAL_SONGS: SongData[] = [
  { id: "lofi-1", title: "Midnight Coffee", artist: "Lofi Beats", duration: 154, thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=120&auto=format&fit=crop&q=60", type: "LOCAL" },
  { id: "lofi-2", title: "Coding Session", artist: "Focus Chill", duration: 210, thumbnail: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=120&auto=format&fit=crop&q=60", type: "LOCAL" },
  { id: "lofi-3", title: "Chill Rain", artist: "Rainy Day", duration: 185, thumbnail: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=120&auto=format&fit=crop&q=60", type: "YOUTUBE" },
  { id: "lofi-4", title: "Late Night Drive", artist: "Synthwave Breeze", duration: 245, thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=60", type: "YOUTUBE" },
  { id: "lofi-5", title: "Morning Walk", artist: "Sunny Day Vibe", duration: 198, thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=60", type: "LOCAL" },
];

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

  const { currentSong, isPlaying, togglePlay, addToQueue, showToast } = useMusic();

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
              artist: r.author || "Unknown Artist",
              duration: r.seconds || 0,
              thumbnail: r.thumbnail,
              type: fav?.localFilePath ? "LOCAL" : "YOUTUBE",
              localFilePath: fav?.localFilePath || null,
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#313338] select-none p-4 space-y-4">
      {/* Search Bar header */}
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
          {songs.length === 0 ? (
            <div className="p-6 text-center text-[#B5BAC1] text-sm italic">
              No se encontraron canciones. Intenta otra búsqueda.
            </div>
          ) : (
            songs.map((song, index) => {
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
                      onClick={() => (isCurrent ? togglePlay() : addToQueue(song))}
                      className="text-[#B5BAC1] group-hover:text-white transition-colors"
                      title={isPlayingCurrent ? "Pausar" : "Reproducir / Añadir a cola"}
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
                    <span className="text-[#5865F2] text-xs font-bold hidden group-hover:inline">
                      {isPlayingCurrent ? "PAUSAR" : "REPRODUCIR"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
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
