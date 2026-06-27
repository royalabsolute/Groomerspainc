"use client";

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { NavigationProvider } from "@/context/NavigationContext";
import { useMusicStore } from "@/store/useMusicStore";
import AppSidebar from "@/components/AppSidebar";
import SecondaryPanel from "@/components/SecondaryPanel";
import ContentArea from "@/components/ContentArea";
import RightPanel from "@/components/RightPanel";
import MusicPlayer from "@/components/MusicPlayer";

interface EnvVar {
  key: string;
  value: string;
}

interface DashboardContentProps {
  envVars: EnvVar[];
}

export default function DashboardContent({ envVars }: DashboardContentProps) {
  // ── Server state (shared between ContentArea and RightPanel) ──────────────
  const [serverStatus, setServerStatus] = useState<"RUNNING" | "STARTING" | "STOPPING" | "OFFLINE">("OFFLINE");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [uptime, setUptime] = useState("—");
  const [playersCount, setPlayersCount] = useState(0);
  const [playersMax, setPlayersMax] = useState(20);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [diskUsage, setDiskUsage] = useState(45.2);

  const toastMessage = useMusicStore((state) => state.toastMessage);

  // ── WebSocket: logs + status + telemetry ──────────────────────────────────
  useEffect(() => {
    const socketUrl = typeof window !== "undefined" && window.location.port === "3000"
      ? "http://localhost:3001"
      : (typeof window !== "undefined" ? window.location.origin : "");

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected to server");
      // Perform initial check
      fetch("/api/minecraft/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      })
        .then((res) => res.json())
        .then((d) => {
          if (d.success) {
            if (d.status === "RUNNING") {
              setServerStatus("RUNNING");
              setPlayersCount(d.playersCount ?? 0);
              setPlayersMax(d.playersMax ?? 20);
              setUptime("Online");
            } else {
              setServerStatus("OFFLINE");
              setPlayersCount(0);
              setPlayersMax(20);
              setUptime("Offline");
            }
          }
        })
        .catch((err) => console.error("Initial status check failed:", err));
    });

    socket.on("console-init", (lines: string[]) => {
      setConsoleLogs(lines);
    });

    socket.on("console-stream", (line: string) => {
      setConsoleLogs((prev) => {
        const next = [...prev, line];
        if (next.length > 500) next.shift();
        return next;
      });
    });

    socket.on("telemetry-stream", (data: { 
      cpu: string; 
      ram: string; 
      ramRaw: { used: string; total: string }; 
      ports: Record<string, boolean>;
      minecraft?: { online: number; max: number };
    }) => {
      setCpuUsage(parseFloat(data.cpu));
      setRamUsage(parseFloat(data.ramRaw.used));

      const isMcRunning = !!data.ports["25565"];
      setServerStatus((prev) => {
        if (isMcRunning) {
          setPlayersCount(data.minecraft?.online ?? 0);
          setPlayersMax(data.minecraft?.max ?? 20);
          setUptime("Online");
          return "RUNNING";
        } else {
          setPlayersCount(0);
          setPlayersMax(20);
          setUptime("Offline");
          if (prev === "STARTING") return "STARTING";
          if (prev === "STOPPING") return "STOPPING";
          return "OFFLINE";
        }
      });
    });

    socket.on("console-cmd-response", (data: { command: string; response?: string; error?: string }) => {
      const timestamp = new Date().toTimeString().split(" ")[0];
      if (data.error) {
        setConsoleLogs((prev) => [
          ...prev,
          `${timestamp} - [RCON Command] > ${data.command}`,
          `${timestamp} - [RCON Error]: ${data.error}`,
        ]);
      } else if (data.response) {
        const lines = data.response.split(/\r?\n/).filter(Boolean);
        setConsoleLogs((prev) => [
          ...prev,
          `${timestamp} - [RCON Command] > ${data.command}`,
          ...lines.map((line) => `${timestamp} - [RCON]: ${line}`),
        ]);
      }
    });

    (window as any).socket = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const currentSong = useMusicStore((state) => state.currentSong);

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 h-full w-full select-none overflow-hidden bg-transparent">
      {/* ── Col 3: Dynamic Content Area (flex-1) ── */}
      <ContentArea
        serverStatus={serverStatus}
        setServerStatus={setServerStatus}
        consoleLogs={consoleLogs}
        setConsoleLogs={setConsoleLogs}
        uptime={uptime}
        playersCount={playersCount}
        playersMax={playersMax}
        cpuUsage={cpuUsage}
        ramUsage={ramUsage}
        diskUsage={diskUsage}
        envVars={envVars}
      />

      {/* ── Col 4: Dynamic Right Panel (240px) ── */}
      <RightPanel
        cpuUsage={cpuUsage}
        ramUsage={ramUsage}
        serverStatus={serverStatus}
        playersCount={playersCount}
      />

      {/* Sutil Queue Notifications */}
      {toastMessage && (
        <div className={`fixed ${currentSong ? "bottom-28" : "bottom-6"} right-6 bg-[#5865F2] text-white px-4 py-2.5 rounded shadow-lg z-100 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200`}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
