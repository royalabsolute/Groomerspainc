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
import { NavigationProvider } from "@/context/NavigationContext";
import AppSidebar from "@/components/AppSidebar";
import SecondaryPanel from "@/components/SecondaryPanel";
import ContentArea from "@/components/ContentArea";
import RightPanel from "@/components/RightPanel";

export default function NexusDashboard() {
  // ── Server state (shared between ContentArea and RightPanel) ──────────────
  const [serverStatus, setServerStatus] = useState<"RUNNING" | "STARTING" | "STOPPING" | "OFFLINE">("OFFLINE");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [uptime, setUptime] = useState("—");
  const [playersCount, setPlayersCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [diskUsage, setDiskUsage] = useState(45.2);

  // ── Polling: logs + status ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchLogsAndStatus = async () => {
      try {
        const [logsRes, statusRes] = await Promise.all([
          fetch("/api/minecraft/control"),
          fetch("/api/minecraft/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "status" }),
          }),
        ]);

        if (logsRes.ok) {
          const d = await logsRes.json();
          if (d.success && d.logs) setConsoleLogs(d.logs);
        }

        if (statusRes.ok) {
          const d = await statusRes.json();
          if (d.success) {
            if (d.status === "RUNNING") {
              setServerStatus("RUNNING");
              setPlayersCount(3);
              setUptime("2d 14h 42m");
            } else if (d.status === "OFFLINE") {
              setServerStatus("OFFLINE");
              setPlayersCount(0);
              setUptime("Offline");
            }
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    fetchLogsAndStatus();
    const interval = setInterval(fetchLogsAndStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Simulated hardware variation ───────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (serverStatus === "RUNNING") {
        setCpuUsage(p => Math.max(12, Math.min(85, +(p + (Math.random() * 10 - 5)).toFixed(1))));
        setRamUsage(p => Math.max(5.8, Math.min(8.5, +(p + (Math.random() * 0.4 - 0.2)).toFixed(1))));
      } else if (serverStatus === "STARTING") {
        setCpuUsage(p => Math.max(70, Math.min(95, +(p + Math.random() * 5).toFixed(1))));
        setRamUsage(p => Math.min(6.0, p + 0.3));
      } else if (serverStatus === "STOPPING") {
        setCpuUsage(p => Math.max(50, Math.min(80, +(p + Math.random() * 5).toFixed(1))));
        setRamUsage(p => Math.max(0.5, p - 0.5));
      } else {
        setCpuUsage(0.8);
        setRamUsage(0.4);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [serverStatus]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <NavigationProvider>
      <div className="flex h-screen w-full select-none overflow-hidden bg-[#1E1F22] font-sans">

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
    </NavigationProvider>
  );
}
