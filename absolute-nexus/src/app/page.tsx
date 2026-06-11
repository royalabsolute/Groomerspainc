"use client";

/**
 * page.tsx — Absolute Nexus Dashboard Shell
 *
 * This component is intentionally thin. It only:
 *  1. Wraps everything in <NavigationProvider>
 *  2. Manages server-state that needs to be shared between
 *     ContentArea (console UI) and RightPanel (metrics)
 *  3. Composes the 4-column Discord layout
 *
 * All navigation logic lives in NavigationContext.
 * All sidebar logic lives in AppSidebar & SecondaryPanel.
 * All content routing lives in ContentArea.
 */

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { NavigationProvider } from "@/context/NavigationContext";
import AppSidebar from "@/components/AppSidebar";
import SecondaryPanel from "@/components/SecondaryPanel";
import ContentArea from "@/components/ContentArea";
import RightPanel from "@/components/RightPanel";
import MusicPlayer, { SongData } from "@/components/MusicPlayer";

export default function NexusDashboard() {
  // ── Server state (shared between ContentArea and RightPanel) ──────────────
  const [serverStatus, setServerStatus] = useState<"RUNNING" | "STARTING" | "STOPPING" | "OFFLINE">("OFFLINE");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [uptime, setUptime] = useState("—");
  const [playersCount, setPlayersCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [diskUsage, setDiskUsage] = useState(45.2);

  // ── Music Player States ────────────────────────────────────────────────────
  const [currentSong, setCurrentSong] = useState<SongData | null>({
    id: "lofi-focus",
    title: "Lofi Focus Beat",
    artist: "Absolute Nexus Music",
    duration: 180,
    thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120&auto=format&fit=crop&q=60",
    type: "LOCAL",
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(45);
  const [volume, setVolume] = useState(50);
  const [isSyncActive, setIsSyncActive] = useState(false);

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

  // ── Music Track Progression Timer ──────────────────────────────────────────
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentSong) {
      timer = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= currentSong.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentSong]);

  const handlePlaySong = (song: SongData) => {
    setCurrentSong(song);
    setPlaybackProgress(0);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    setPlaybackProgress(seconds);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
  };

  const handleToggleSync = () => {
    setIsSyncActive(!isSyncActive);
  };

  const handleSkipBack = () => {
    setPlaybackProgress(0);
  };

  const handleSkipForward = () => {
    setPlaybackProgress(0);
  };

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
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlaySong={handlePlaySong}
          onTogglePlay={handleTogglePlay}
        />

        {/* ── Col 4: Dynamic Right Panel (240px) ── */}
        <RightPanel
          cpuUsage={cpuUsage}
          ramUsage={ramUsage}
          serverStatus={serverStatus}
          playersCount={playersCount}
        />

      </div>

      <MusicPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        playbackProgress={playbackProgress}
        volume={volume}
        isSyncActive={isSyncActive}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleSync={handleToggleSync}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
      />
    </NavigationProvider>
  );
}
