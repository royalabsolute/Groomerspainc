"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Loader2,
  Trash2,
} from "lucide-react";
import { useNav, MODULE_CONFIG, Channel } from "@/context/NavigationContext";
import { signOut } from "next-auth/react";
import { io as socketIO } from "socket.io-client";

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
        {activeModule === "spotify" ? (
          <MusicSidebar />
        ) : activeModule === "chat" ? (
          <ChatSidebar />
        ) : (
          <>
            {/* Ungrouped channels */}
            {ungrouped.map((ch) => (
              <ChannelButton
                key={ch.id}
                channel={ch}
                isActive={activeChannel === ch.id}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const pathParts = window.location.pathname.split("/").filter(Boolean);
                    const locale = (pathParts[0] === "es" || pathParts[0] === "en") ? pathParts[0] : "es";

                    if (activeModule === "grooming") {
                      if (ch.id === "dashboard-grooming") {
                        window.location.href = `/${locale}/admin/groomers`;
                      } else {
                        window.location.href = `/${locale}/admin/groomers/${ch.id}`;
                      }
                    } else if (activeModule === "hotel") {
                      const isOnHotelPage = window.location.pathname.includes("/admin/hospitality");
                      if (!isOnHotelPage) {
                        window.location.href = `/${locale}/admin/hospitality?channel=${ch.id}`;
                      } else {
                        setChannel(ch.id);
                      }
                    } else {
                      const isOnMainAdmin = window.location.pathname.endsWith("/admin") || window.location.pathname.endsWith("/admin/");
                      if (!isOnMainAdmin) {
                        window.location.href = `/${locale}/admin?module=${activeModule}&channel=${ch.id}`;
                      } else {
                        setChannel(ch.id);
                      }
                    }
                  }
                }}
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
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              const pathParts = window.location.pathname.split("/").filter(Boolean);
                              const locale = (pathParts[0] === "es" || pathParts[0] === "en") ? pathParts[0] : "es";

                              if (activeModule === "grooming") {
                                if (ch.id === "dashboard-grooming") {
                                  window.location.href = `/${locale}/admin/groomers`;
                                } else {
                                  window.location.href = `/${locale}/admin/groomers/${ch.id}`;
                                }
                              } else if (activeModule === "hotel") {
                                const isOnHotelPage = window.location.pathname.includes("/admin/hospitality");
                                if (!isOnHotelPage) {
                                  window.location.href = `/${locale}/admin/hospitality?channel=${ch.id}`;
                                } else {
                                  setChannel(ch.id);
                                }
                              } else {
                                const isOnMainAdmin = window.location.pathname.endsWith("/admin") || window.location.pathname.endsWith("/admin/");
                                if (!isOnMainAdmin) {
                                  window.location.href = `/${locale}/admin?module=${activeModule}&channel=${ch.id}`;
                                } else {
                                  setChannel(ch.id);
                                }
                              }
                            }
                          }}
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

// ─── Chat Sidebar ─────────────────────────────────────────────────────────────

interface DBChannel {
  id: string;
  name: string;
  createdAt: string;
}

function ChatSidebar() {
  const { state, setChannel } = useNav();
  const { activeChannel } = state;
  const [channels, setChannels] = useState<DBChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null);

  // Ref to track the current activeChannel to avoid closure issues in socket callbacks
  const activeChannelRef = useRef(activeChannel);
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // Fetch channels list
  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/chat/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();

    // Setup socket to listen for channel creation and deletion
    const socketUrl = typeof window !== "undefined" && window.location.port === "3000"
      ? "http://localhost:3001/chat"
      : "/chat";

    const socket = socketIO(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("channel-created", (newChannel: DBChannel) => {
      setChannels((prev) => {
        if (prev.some((c) => c.id === newChannel.id)) return prev;
        return [...prev, newChannel];
      });
    });

    socket.on("channel-deleted", (deletedChannelId: string) => {
      setChannels((prev) => prev.filter((c) => c.id !== deletedChannelId));
      if (activeChannelRef.current === deletedChannelId) {
        setChannel("general");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newChannelName.trim();
    if (!name) return;

    setError("");
    setCreating(true);

    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear el canal");
      }

      // Emit socket event to notify other clients
      if (socketRef.current) {
        socketRef.current.emit("channel-created", data);
      }

      setChannels((prev) => {
        if (prev.some((c) => c.id === data.id)) return prev;
        return [...prev, data];
      });

      // Switch to the newly created channel
      setChannel(data.id);

      // Close modal
      setNewChannelName("");
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (id === "general") return;
    const confirm = window.confirm(`¿Estás seguro de que deseas eliminar el canal #${name}? Esta acción no se puede deshacer y se borrarán todos sus mensajes.`);
    if (!confirm) return;

    try {
      const res = await fetch(`/api/chat/channels?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar el canal");
      }

      // Emit socket event to notify other clients
      if (socketRef.current) {
        socketRef.current.emit("channel-deleted", id);
      }

      // Remove channel from local state
      setChannels((prev) => prev.filter((c) => c.id !== id));

      // If active channel was deleted, redirect to general
      if (activeChannel === id) {
        setChannel("general");
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar el canal");
    }
  };

  return (
    <div className="flex-grow space-y-4">
      <div className="pt-2">
        {/* Category Header with "+" button */}
        <div className="w-full flex items-center justify-between px-2 pb-1 text-xs font-bold text-[#949BA4] tracking-wider uppercase">
          <span className="flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            Canales de Texto
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[#949BA4] hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-[#35373C]"
            title="Crear Canal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Loading / Channels List */}
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#949BA4]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Cargando canales...</span>
          </div>
        ) : (
          <div className="space-y-0.5 mt-1">
            {channels.map((ch) => {
              const isActive = activeChannel === ch.id;
              return (
                <div
                  key={ch.id}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium transition-colors duration-150 group ${
                    isActive
                      ? "bg-[#404249] text-white"
                      : "text-[#949BA4] hover:bg-[#313338] hover:text-white"
                  }`}
                >
                  <button
                    onClick={() => setChannel(ch.id)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <Hash
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-[#80848E] group-hover:text-[#DBDEE1]"
                      }`}
                    />
                    <span className="truncate">{ch.name}</span>
                  </button>
                  {ch.id !== "general" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChannel(ch.id, ch.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#949BA4] hover:text-[#F23F43] transition-all cursor-pointer p-0.5 rounded hover:bg-[#35373C]/80"
                      title="Eliminar Canal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-lg bg-[#313338] shadow-xl border border-[#1F2023] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1F2023] flex justify-between items-center bg-[#2B2D31]">
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Crear canal de texto</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError("");
                  setNewChannelName("");
                }}
                className="text-[#949BA4] hover:text-white transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateChannel}>
              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="channel-name" className="text-xs font-bold text-[#949BA4] uppercase tracking-wider">
                    Nombre del canal
                  </label>
                  <div className="relative flex items-center">
                    <Hash className="absolute left-3 w-4 h-4 text-[#949BA4]" />
                    <input
                      id="channel-name"
                      type="text"
                      required
                      placeholder="nuevo-canal"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="w-full bg-[#1E1F22] text-[#DBDEE1] text-sm pl-9 pr-3 py-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2]/60 transition-colors placeholder-[#72767D]"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <span className="text-[10px] text-[#949BA4]">
                    Los nombres deben ser en minúsculas, sin espacios y pueden contener guiones.
                  </span>
                </div>

                {error && (
                  <div className="p-3 bg-[#F23F43]/10 border border-[#F23F43]/20 rounded text-xs text-[#F23F43]">
                    {error}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#2B2D31] border-t border-[#1F2023] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError("");
                    setNewChannelName("");
                  }}
                  className="bg-transparent hover:underline text-white text-xs font-semibold py-2 px-4 rounded transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newChannelName.trim()}
                  className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-xs font-semibold py-2 px-5 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {creating ? "Creando..." : "Crear canal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
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

// ─── Music Sidebar (Col 2) ───────────────────────────────────────────────────

interface DBPlaylist {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
}

interface DBRoom {
  id: string;
  name: string;
  description: string | null;
  isLive: boolean;
  activeUsers: number;
  createdAt: string;
}

function MusicSidebar() {
  const { state, setChannel } = useNav();
  const { activeChannel } = state;

  // ── Playlists state ──────────────────────────────────────────────────────
  const [playlists, setPlaylists] = useState<DBPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [playlistError, setPlaylistError] = useState("");

  // ── Rooms state ──────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<DBRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState("");

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchPlaylists = async () => {
    try {
      setLoadingPlaylists(true);
      const res = await fetch("/api/music/playlists");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPlaylists(data.playlists);
      }
    } catch (e) {
      console.error("[MusicSidebar] Error fetching playlists:", e);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await fetch("/api/music/rooms");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setRooms(data.rooms);
      }
    } catch (e) {
      console.error("[MusicSidebar] Error fetching rooms:", e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    fetchRooms();
  }, []);

  // ── Create playlist ──────────────────────────────────────────────────────
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlaylistName.trim();
    if (!name) return;

    setPlaylistError("");
    setCreatingPlaylist(true);
    try {
      const res = await fetch("/api/music/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear");

      setPlaylists((prev) => [...prev, data.playlist]);
      setNewPlaylistName("");
      setShowPlaylistModal(false);
      // Switch to new playlist channel
      setChannel(`playlist-${data.playlist.id}`);
    } catch (err: any) {
      setPlaylistError(err.message);
    } finally {
      setCreatingPlaylist(false);
    }
  };

  // ── Delete playlist ──────────────────────────────────────────────────────
  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la playlist "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/music/playlists?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        if (activeChannel === `playlist-${id}`) setChannel("now-playing");
      }
    } catch (e) {
      console.error("[MusicSidebar] Error deleting playlist:", e);
    }
  };

  // ── Create room ──────────────────────────────────────────────────────────
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;

    setRoomError("");
    setCreatingRoom(true);
    try {
      const res = await fetch("/api/music/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear");

      setRooms((prev) => [...prev, data.room]);
      setNewRoomName("");
      setShowRoomModal(false);
      setChannel(`room-${data.room.id}`);
    } catch (err: any) {
      setRoomError(err.message);
    } finally {
      setCreatingRoom(false);
    }
  };

  // ── Delete room ──────────────────────────────────────────────────────────
  const handleDeleteRoom = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la sala "${name}"?`)) return;
    try {
      const res = await fetch(`/api/music/rooms?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== id));
        if (activeChannel === `room-${id}`) setChannel("now-playing");
      }
    } catch (e) {
      console.error("[MusicSidebar] Error deleting room:", e);
    }
  };

  return (
    <div className="flex-grow space-y-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1E1F22]">
      {/* ── Playlists ─────────────────────────────────────────────────────── */}
      <div>
        {/* Fixed navigation items */}
        <div className="space-y-0.5 mb-2">
          {[
            { id: "now-playing", label: "Buscador YouTube" },
            { id: "favorites", label: "Favoritos" },
          ].map((item) => {
            const isActive = activeChannel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setChannel(item.id)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm font-medium transition-colors duration-150 ${
                  isActive ? "bg-[#35373C] text-white" : "text-[#949BA4] hover:bg-[#35373C]/60 hover:text-[#DBDEE1]"
                }`}
              >
                <Music className="w-4 h-4 text-[#80848E] flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic playlists section */}
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-bold text-[#949BA4] tracking-wider uppercase">
            🎧 Tus Playlists
          </span>
          <button
            onClick={() => { setShowPlaylistModal(true); setPlaylistError(""); setNewPlaylistName(""); }}
            className="text-[#949BA4] hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-[#35373C]"
            title="Crear Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-0.5">
          {loadingPlaylists ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#949BA4]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-[#949BA4] italic">
              No hay playlists aún
            </div>
          ) : (
            playlists.map((pl) => {
              const isActive = activeChannel === `playlist-${pl.id}`;
              return (
                <div
                  key={pl.id}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium transition-colors duration-150 group ${
                    isActive ? "bg-[#35373C] text-white" : "text-[#949BA4] hover:bg-[#35373C]/60 hover:text-[#DBDEE1]"
                  }`}
                >
                  <button
                    onClick={() => setChannel(`playlist-${pl.id}`)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <Music className="w-4 h-4 text-[#80848E] flex-shrink-0" />
                    <span className="truncate">{pl.name}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(pl.id, pl.name); }}
                    className="opacity-0 group-hover:opacity-100 text-[#949BA4] hover:text-[#F23F43] transition-all cursor-pointer p-0.5 rounded hover:bg-[#35373C]/80"
                    title="Eliminar Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Live Rooms ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-bold text-[#949BA4] tracking-wider uppercase">
            🌐 Salas en Vivo
          </span>
          <button
            onClick={() => { setShowRoomModal(true); setRoomError(""); setNewRoomName(""); }}
            className="text-[#949BA4] hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-[#35373C]"
            title="Crear Sala en Vivo"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-0.5">
          {loadingRooms ? (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#949BA4]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-[#949BA4] italic">
              No hay salas creadas
            </div>
          ) : (
            rooms.map((room) => {
              const isActive = activeChannel === `room-${room.id}`;
              return (
                <div
                  key={room.id}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm font-medium transition-colors duration-150 group ${
                    isActive ? "bg-[#35373C] text-white" : "text-[#949BA4] hover:bg-[#35373C]/60 hover:text-[#DBDEE1]"
                  }`}
                >
                  <button
                    onClick={() => setChannel(`room-${room.id}`)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#80848E] flex-shrink-0" />
                    <span className="truncate">{room.name}</span>
                    {room.isLive && (
                      <span className="bg-[#23A55A] text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none flex-shrink-0">
                        LIVE
                      </span>
                    )}
                    {room.activeUsers > 0 && (
                      <span className="text-[10px] text-[#B5BAC1] bg-[#1E1F22] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-[#23A55A] rounded-full inline-block animate-pulse" />
                        {room.activeUsers}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id, room.name); }}
                    className="opacity-0 group-hover:opacity-100 text-[#949BA4] hover:text-[#F23F43] transition-all cursor-pointer p-0.5 rounded hover:bg-[#35373C]/80"
                    title="Eliminar Sala"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Create Playlist Modal ──────────────────────────────────────────── */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg bg-[#2B2D31] shadow-xl border border-[#1F2023] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1F2023] flex justify-between items-center bg-[#313338]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Nueva Playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} className="text-[#949BA4] hover:text-white text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleCreatePlaylist} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#949BA4] uppercase tracking-wider block mb-1.5">
                  Nombre
                </label>
                <div className="relative flex items-center">
                  <Music className="absolute left-3 w-4 h-4 text-[#949BA4]" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Mi Playlist..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    maxLength={60}
                    className="w-full bg-[#1E1F22] text-[#DBDEE1] text-sm pl-9 pr-3 py-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2]/60 transition-colors placeholder-[#72767D]"
                  />
                </div>
              </div>
              {playlistError && (
                <div className="p-2.5 bg-[#F23F43]/10 border border-[#F23F43]/20 rounded text-xs text-[#F23F43]">
                  {playlistError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPlaylistModal(false)}
                  className="text-white text-xs font-semibold py-2 px-4 hover:underline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPlaylist || !newPlaylistName.trim()}
                  className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-xs font-semibold py-2 px-5 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {creatingPlaylist ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {creatingPlaylist ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Room Modal ──────────────────────────────────────────────── */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg bg-[#2B2D31] shadow-xl border border-[#1F2023] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1F2023] flex justify-between items-center bg-[#313338]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Nueva Sala en Vivo</h3>
              <button onClick={() => setShowRoomModal(false)} className="text-[#949BA4] hover:text-white text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleCreateRoom} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#949BA4] uppercase tracking-wider block mb-1.5">
                  Nombre de la Sala
                </label>
                <div className="relative flex items-center">
                  <Users className="absolute left-3 w-4 h-4 text-[#949BA4]" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Sala General..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    maxLength={60}
                    className="w-full bg-[#1E1F22] text-[#DBDEE1] text-sm pl-9 pr-3 py-2.5 rounded border border-[#1F2023] outline-none focus:border-[#5865F2]/60 transition-colors placeholder-[#72767D]"
                  />
                </div>
              </div>
              {roomError && (
                <div className="p-2.5 bg-[#F23F43]/10 border border-[#F23F43]/20 rounded text-xs text-[#F23F43]">
                  {roomError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="text-white text-xs font-semibold py-2 px-4 hover:underline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom || !newRoomName.trim()}
                  className="bg-[#23A55A] hover:bg-[#1a8547] disabled:opacity-50 text-white text-xs font-semibold py-2 px-5 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {creatingRoom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {creatingRoom ? "Creando..." : "Crear Sala"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
