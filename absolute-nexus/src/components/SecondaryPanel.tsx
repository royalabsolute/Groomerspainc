"use client";

import React, { useState } from "react";
import {
  Hash,
  Folder,
  Activity,
  HardDrive,
  MessageSquare,
  Music,
  Settings,
  Home,
  ChevronDown,
  ChevronRight,
  Plus,
  Mic,
  MicOff,
  Headphones,
} from "lucide-react";
import { useNav, MODULE_CONFIG, Channel } from "@/context/NavigationContext";
import { signOut } from "next-auth/react";

// ─── Channel icon resolver ────────────────────────────────────────────────────

function ChannelIcon({ type, className }: { type: Channel["icon"]; className?: string }) {
  const cls = className ?? "w-5 h-5 text-[#80848E] flex-shrink-0";
  switch (type) {
    case "folder":      return <Folder       className={cls} />;
    case "activity":    return <Activity     className={cls} />;
    case "hard-drive":  return <HardDrive    className={cls} />;
    case "message":     return <MessageSquare className={cls} />;
    case "music":       return <Music        className={cls} />;
    case "settings":    return <Settings     className={cls} />;
    case "home":        return <Home         className={cls} />;
    default:            return <Hash         className={cls} />;
  }
}

// ─── Secondary Panel ──────────────────────────────────────────────────────────

export default function SecondaryPanel() {
  const { state, setChannel } = useNav();
  const { activeModule, activeChannel } = state;
  const config = MODULE_CONFIG[activeModule];

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Group channels by category
  const grouped: Record<string, Channel[]> = {};
  const ungrouped: Channel[] = [];
  for (const ch of config.channels) {
    if (ch.category) {
      if (!grouped[ch.category]) grouped[ch.category] = [];
      grouped[ch.category].push(ch);
    } else {
      ungrouped.push(ch);
    }
  }

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <section className="w-60 bg-[#2B2D31] flex flex-col flex-shrink-0">
      {/* Header */}
      <div
        className="h-12 border-b border-[#1F2023] flex items-center justify-between px-4 hover:bg-[#35373C]/40 cursor-pointer transition-colors duration-150 flex-shrink-0"
        style={{ borderTop: `2px solid ${config.color}20` }}
      >
        <span className="font-semibold text-white text-sm tracking-wide truncate">
          {config.label}
        </span>
        <ChevronDown className="w-4 h-4 text-[#B5BAC1] flex-shrink-0" />
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1E1F22]">
        {activeModule === "spotify" ? (
          <MusicSidebar />
        ) : (
          <>
            {/* Ungrouped channels */}
            {ungrouped.map((ch) => (
              <ChannelButton
                key={ch.id}
                channel={ch}
                isActive={activeChannel === ch.id}
                onClick={() => setChannel(ch.id)}
              />
            ))}

            {/* Grouped channels */}
            {Object.entries(grouped).map(([category, channels]) => {
              const isCollapsed = collapsedCategories.has(category);
              return (
                <div key={category} className="pt-2">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-2 pb-1 text-xs font-bold text-[#949BA4] tracking-wider uppercase hover:text-[#DBDEE1] transition-colors group"
                  >
                    <span className="flex items-center gap-1">
                      {isCollapsed
                        ? <ChevronRight className="w-3 h-3 transition-transform" />
                        : <ChevronDown className="w-3 h-3 transition-transform" />
                      }
                      {category}
                    </span>
                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {/* Channels */}
                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {channels.map((ch) => (
                        <ChannelButton
                          key={ch.id}
                          channel={ch}
                          isActive={activeChannel === ch.id}
                          onClick={() => setChannel(ch.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* User Panel Footer */}
      <div className="h-[52px] bg-[#232428] flex items-center justify-between px-2 flex-shrink-0 border-t border-[#1F2023]">
        <div className="flex items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#35373C]/60 p-1 rounded-md transition-colors duration-150 flex-grow mr-1">
          <div className="relative flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full text-black font-bold flex items-center justify-center text-xs"
              style={{ backgroundColor: config.color }}
            >
              AN
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23A55A] rounded-full border-[2.5px] border-[#232428]" />
          </div>
          <div className="flex flex-col overflow-hidden text-left">
            <span className="text-sm font-semibold text-white leading-tight truncate">
              Admin-Nexus
            </span>
            <span className="text-[11px] text-[#949BA4] leading-none truncate">#0001</span>
          </div>
        </div>

        <div className="flex items-center text-[#B5BAC1] flex-shrink-0">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
            className={`p-1.5 hover:bg-[#35373C] hover:text-white rounded transition-colors ${isMuted ? "text-[#F23F43]" : ""}`}
          >
            {isMuted ? <MicOff className="w-[18px] h-[18px]" /> : <Mic className="w-[18px] h-[18px]" />}
          </button>
          <button
            onClick={() => setIsDeafened(!isDeafened)}
            title={isDeafened ? "Activar audio" : "Ensordecer"}
            className={`p-1.5 hover:bg-[#35373C] hover:text-white rounded transition-colors ${isDeafened ? "text-[#F23F43]" : ""}`}
          >
            <Headphones className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Cerrar sesión"
            className="p-1.5 hover:bg-[#35373C] hover:text-white rounded transition-colors"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Reusable channel button ──────────────────────────────────────────────────

function ChannelButton({
  channel,
  isActive,
  onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm font-medium transition-colors duration-150 group ${
        isActive
          ? "bg-[#35373C] text-white"
          : "text-[#949BA4] hover:bg-[#35373C]/60 hover:text-[#DBDEE1]"
      }`}
    >
      <ChannelIcon type={channel.icon} />
      <span className="truncate">{channel.label}</span>
    </button>
  );
}

// ─── Music Sidebar (Col 2) ───────────────────────────────────────────────────

function MusicSidebar() {
  const { state, setChannel } = useNav();
  const { activeChannel } = state;

  const playlists = [
    { id: "now-playing", label: "Buscador YouTube" },
    { id: "favorites", label: "Favoritos" },
    { id: "chill", label: "Chill & Lofi" },
    { id: "gaming", label: "Gaming Mix" },
  ];

  const liveRooms = [
    { id: "room-general", label: "Sala General", activeUsers: 3, isLive: false },
    { id: "room-lofi", label: "Lo-Fi Radio 24/7", activeUsers: 0, isLive: true },
  ];

  return (
    <div className="flex-grow space-y-4">
      {/* Playlists Category */}
      <div>
        <div className="px-2 pb-1 text-xs font-bold text-[#949BA4] tracking-wider uppercase">
          🎧 Tus Playlists
        </div>
        <div className="space-y-0.5">
          {playlists.map((pl) => {
            const isActive = activeChannel === pl.id;
            return (
              <button
                key={pl.id}
                onClick={() => setChannel(pl.id)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-[#35373C] text-white"
                    : "text-[#949BA4] hover:bg-[#35373C]/60 hover:text-[#DBDEE1]"
                }`}
              >
                <Music className="w-4 h-4 text-[#80848E] flex-shrink-0" />
                <span className="truncate">{pl.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Rooms Category */}
      <div>
        <div className="px-2 pb-1 text-xs font-bold text-[#949BA4] tracking-wider uppercase">
          🌐 Salas en Vivo
        </div>
        <div className="space-y-0.5">
          {liveRooms.map((room) => {
            const isActive = activeChannel === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setChannel(room.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium transition-colors duration-150 group ${
                  isActive
                    ? "bg-[#35373C] text-white"
                    : "text-[#949BA4] hover:bg-[#35373C]/60 hover:text-[#DBDEE1]"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Users className="w-4 h-4 text-[#80848E] flex-shrink-0" />
                  <span className="truncate">{room.label}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {room.isLive && (
                    <span className="bg-[#23A55A] text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none">
                      LIVE
                    </span>
                  )}
                  {room.activeUsers > 0 && (
                    <span className="text-[10px] text-[#B5BAC1] bg-[#1E1F22] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 bg-[#23A55A] rounded-full inline-block animate-pulse" />
                      {room.activeUsers}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
