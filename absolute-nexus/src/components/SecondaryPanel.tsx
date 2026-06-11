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
  Terminal,
  Archive,
  Calendar,
  Users,
  Package,
  User,
  Shield,
  Cpu,
  Database,
  Code,
} from "lucide-react";
import { useNav, MODULE_CONFIG, Channel } from "@/context/NavigationContext";
import { signOut } from "next-auth/react";

// ─── Channel icon resolver ────────────────────────────────────────────────────

function ChannelIcon({ type, className }: { type: Channel["icon"]; className?: string }) {
  const cls = className ?? "w-5 h-5 text-[#80848E] shrink-0";
  switch (type) {
    case "folder":      return <Folder       className={cls} />;
    case "activity":    return <Activity     className={cls} />;
    case "hard-drive":  return <HardDrive    className={cls} />;
    case "message":     return <MessageSquare className={cls} />;
    case "music":       return <Music        className={cls} />;
    case "settings":    return <Settings     className={cls} />;
    case "home":        return <Home         className={cls} />;
    case "terminal":    return <Terminal     className={cls} />;
    case "archive":     return <Archive      className={cls} />;
    case "calendar":    return <Calendar     className={cls} />;
    case "users":       return <Users        className={cls} />;
    case "package":     return <Package      className={cls} />;
    case "user":        return <User         className={cls} />;
    case "shield":      return <Shield       className={cls} />;
    case "cpu":         return <Cpu          className={cls} />;
    case "database":    return <Database     className={cls} />;
    case "code":        return <Code         className={cls} />;
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
    <section className="w-60 bg-[#2B2D31] flex flex-col shrink-0">
      {/* Header */}
      <div
        className="h-12 border-b border-[#1F2023] flex items-center justify-between px-4 hover:bg-[#35373C]/40 cursor-pointer transition-colors duration-150 shrink-0"
        style={{ borderTop: `2px solid ${config.color}20` }}
      >
        <span className="font-semibold text-white text-sm tracking-wide truncate">
          {config.label}
        </span>
        <ChevronDown className="w-4 h-4 text-[#B5BAC1] shrink-0" />
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1E1F22]">
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
      </div>

      {/* User Panel Footer */}
      <div className="h-[52px] bg-[#232428] flex items-center justify-between px-2 shrink-0 border-t border-[#1F2023]">
        <div className="flex items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#35373C]/60 p-1 rounded-md transition-colors duration-150 grow mr-1">
          <div className="relative shrink-0">
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

        <div className="flex items-center text-[#B5BAC1] shrink-0">
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
          ? "bg-[#404249] text-white"
          : "text-[#949BA4] hover:bg-[#313338] hover:text-white"
      }`}
    >
      <ChannelIcon
        type={channel.icon}
        className={`w-5 h-5 shrink-0 transition-colors ${
          isActive ? "text-white" : "text-[#80848E] group-hover:text-[#DBDEE1]"
        }`}
      />
      <span className="truncate">{channel.label}</span>
    </button>
  );
}
