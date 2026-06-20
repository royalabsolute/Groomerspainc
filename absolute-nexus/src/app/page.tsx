"use client";

/**
 * page.tsx — Absolute Nexus Dashboard Shell
 *
 * Wrapped in MusicProvider and NavigationProvider to enable global audio playback,
 * queueing, and UI updates.
 */

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { NavigationProvider } from "@/context/NavigationContext";
import { useMusicStore } from "@/store/useMusicStore";
import AppSidebar from "@/components/AppSidebar";
import SecondaryPanel from "@/components/SecondaryPanel";
import ContentArea from "@/components/ContentArea";
import RightPanel from "@/components/RightPanel";
import MusicPlayer from "@/components/MusicPlayer";

function DashboardContent() {
  // ── Server state (shared between ContentArea and RightPanel) ──────────────
  const [serverStatus, setServerStatus] = useState<"RUNNING" | "STARTING" | "STOPPING" | "OFFLINE">("OFFLINE");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [uptime, setUptime] = useState("—");
  const [playersCount, setPlayersCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [diskUsage, setDiskUsage] = useState(45.2);

  const toastMessage = useMusicStore((state) => state.toastMessage);

  // ── WebSocket: logs + status + telemetry ──────────────────────────────────
  useEffect(() => {
    const socket = io(typeof window !== "undefined" ? window.location.origin : "", {
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
              setPlayersCount(3);
              setUptime("Online");
            } else {
              setServerStatus("OFFLINE");
              setPlayersCount(0);
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

    socket.on("telemetry-stream", (data: { cpu: string; ram: string; ramRaw: { used: string; total: string }; ports: Record<string, boolean> }) => {
      setCpuUsage(parseFloat(data.cpu));
      setRamUsage(parseFloat(data.ramRaw.used));

      const isMcRunning = !!data.ports["25565"];
      setServerStatus((prev) => {
        if (isMcRunning) {
          setPlayersCount(3); // Simulated default players count
          setUptime("Online");
          return "RUNNING";
        } else {
          setPlayersCount(0);
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

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <NavigationProvider>
      <div className="flex h-screen w-full select-none overflow-hidden bg-[#1E1F22] font-sans pb-24">
        {/* ── Col 1: App Switcher (72px) ── */}
        <AppSidebar />

        {/* ── Col 2: Dynamic Secondary Panel (240px) ── */}
        <SecondaryPanel />

        {/* ── Col 3: Dynamic Content Area (flex-1) ── */}
        <ContentArea
          serverStatus={serverStatus}
          setServerStatus={setServerStatus}
          consoleLogs={consoleLogs}
          setConsoleLogs={setConsoleLogs}
          uptime={uptime}
          playersCount={playersCount}
          cpuUsage={cpuUsage}
          ramUsage={ramUsage}
          diskUsage={diskUsage}
        />

        {/* ── Col 4: Dynamic Right Panel (240px) ── */}
        <RightPanel
          cpuUsage={cpuUsage}
          ramUsage={ramUsage}
          serverStatus={serverStatus}
          playersCount={playersCount}
        />
      </div>

      <MusicPlayer />

      {/* Sutil Queue Notifications */}
      {toastMessage && (
        <div className="fixed bottom-28 right-6 bg-[#5865F2] text-white px-4 py-2.5 rounded shadow-lg z-100 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          {toastMessage}
        </div>
      )}
    </NavigationProvider>
  );
}

export default function NexusDashboard() {
  return (
    <DashboardContent />
  );
}
