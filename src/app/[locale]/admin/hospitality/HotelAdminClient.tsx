"use client";

import React, { useState, useEffect } from "react";
import { NavigationProvider, useNav, MODULE_CONFIG } from "@/context/NavigationContext";
import AppSidebar from "@/components/AppSidebar";
import SecondaryPanel from "@/components/SecondaryPanel";
import { Hash, ExternalLink, BedDouble, Edit3, Save, CheckCircle, Loader2, Trash2, Plus, Sparkles } from "lucide-react";
import { Room } from "@/components/InteractiveHostelMap";

interface Property {
  id: string;
  name: string;
  descriptionEs: string;
  descriptionEn: string;
  rooms: Room[];
}

interface ContentText {
  key: string;
  es: string;
  en: string;
}

interface HotelAdminClientProps {
  initialProperties: Property[];
  initialContents: ContentText[];
  user: any;
}

// Subcomponent to set active module on mount
function AdminLayoutInitializer({ children }: { children: React.ReactNode }) {
  const { setModule } = useNav();
  useEffect(() => {
    setModule("hotel");
  }, [setModule]);
  return <>{children}</>;
}

// Inner component containing the hospitality content switch-case
function HotelContentArea({
  properties,
  setProperties,
  contents,
  setContents,
}: {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  contents: ContentText[];
  setContents: React.Dispatch<React.SetStateAction<ContentText[]>>;
}) {
  const { state } = useNav();
  const { activeChannel } = state;

  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New room form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomPropertyId, setNewRoomPropertyId] = useState(properties[0]?.id || "");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrice, setNewRoomPrice] = useState("");
  const [newRoomSvgId, setNewRoomSvgId] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Change room status directly (Real-time updates)
  const handleStatusChange = async (roomId: string, newStatus: string) => {
    setSavingRoomId(roomId);
    try {
      const res = await fetch("/api/hospitality/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProperties((prevProps) =>
          prevProps.map((p) => ({
            ...p,
            rooms: p.rooms.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)),
          }))
        );
        triggerToast("Estado de habitación actualizado");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRoomId(null);
    }
  };

  // Update room price or name
  const handleRoomSave = async (roomId: string, name: string, price: number) => {
    setSavingRoomId(roomId);
    try {
      const res = await fetch("/api/hospitality/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, name, price }),
      });
      const data = await res.json();
      if (data.success) {
        setProperties((prevProps) =>
          prevProps.map((p) => ({
            ...p,
            rooms: p.rooms.map((r) => (r.id === roomId ? { ...r, name, price } : r)),
          }))
        );
        triggerToast("Información de habitación guardada");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRoomId(null);
    }
  };

  // Create room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName || !newRoomPrice || !newRoomSvgId || !newRoomPropertyId) return;

    try {
      const res = await fetch("/api/hospitality/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: newRoomPropertyId,
          name: newRoomName,
          price: parseFloat(newRoomPrice),
          status: "AVAILABLE",
          svgMapId: newRoomSvgId,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setProperties((prevProps) =>
          prevProps.map((p) => {
            if (p.id === newRoomPropertyId) {
              return { ...p, rooms: [...p.rooms, data.room].sort((a, b) => a.name.localeCompare(b.name)) };
            }
            return p;
          })
        );
        setShowAddModal(false);
        setNewRoomName("");
        setNewRoomPrice("");
        setNewRoomSvgId("");
        triggerToast("Habitación agregada con éxito");
      } else {
        alert(data.error || "Error al crear la habitación");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta habitación?")) return;

    setSavingRoomId(roomId);
    try {
      const res = await fetch(`/api/hospitality/rooms?id=${roomId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProperties((prevProps) =>
          prevProps.map((p) => ({
            ...p,
            rooms: p.rooms.filter((r) => r.id !== roomId),
          }))
        );
        triggerToast("Habitación eliminada");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRoomId(null);
    }
  };

  // Save Content translation string
  const handleContentSave = async (key: string, es: string, en: string) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/hospitality/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, es, en }),
      });
      const data = await res.json();
      if (data.success) {
        setContents((prev) =>
          prev.map((c) => (c.key === key ? { ...c, es, en } : c))
        );
        triggerToast("Texto bilingüe actualizado");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(null);
    }
  };

  // Summary counts
  const totalRooms = properties.reduce((acc, p) => acc + p.rooms.length, 0);
  const availableRooms = properties.reduce(
    (acc, p) => acc + p.rooms.filter((r) => r.status === "AVAILABLE").length,
    0
  );
  const occupiedRooms = properties.reduce(
    (acc, p) => acc + p.rooms.filter((r) => r.status === "OCCUPIED").length,
    0
  );
  const maintenanceRooms = properties.reduce(
    (acc, p) => acc + p.rooms.filter((r) => r.status === "MAINTENANCE").length,
    0
  );

  return (
    <main className="flex-1 bg-[#313338] flex flex-col min-w-0 overflow-hidden relative">
      {/* Top Header */}
      <header className="h-12 border-b border-[#1F2023] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-5 h-5 text-[#80848E] shrink-0" />
          <h1 className="font-semibold text-white text-sm truncate">
            {activeChannel === "dashboard-hotel" && "Dashboard Hotelero"}
            {activeChannel === "reservas" && "Control de Habitaciones"}
            {activeChannel === "habitaciones" && "Textos & Traducciones (CMS)"}
          </h1>
          <div className="w-px h-4 bg-[#3F4147] mx-2 shrink-0" />
          <p className="text-xs text-[#949BA4] hidden sm:inline truncate">
            {activeChannel === "dashboard-hotel" && "Vista general del estado de propiedades."}
            {activeChannel === "reservas" && "Panel CRUD en tiempo real para disponibilidad y tarifas."}
            {activeChannel === "habitaciones" && "Administrador de contenidos bilingües del portal."}
          </p>
        </div>

        {/* Global Live Website Button */}
        <div>
          <button
            onClick={() => window.open("/hospitality", "_blank")}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#F43F5E] hover:bg-[#E11D48] text-white text-xs font-semibold rounded shadow-md transition-colors"
          >
            <span>Ver Página Pública (Live)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Content Scroll View */}
      <div className="flex-1 overflow-y-auto p-6 text-[#DBDEE1]">
        
        {/* Toast Alert Popup */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#23A55A] text-white px-4 py-2 rounded shadow-2xl flex items-center gap-2 text-xs font-semibold z-50 animate-in fade-in slide-in-from-bottom duration-200">
            <CheckCircle className="w-4 h-4" />
            {toastMessage}
          </div>
        )}

        {/* ─── CASE 1: DASHBOARD ─── */}
        {activeChannel === "dashboard-hotel" && (
          <div className="flex flex-col gap-8 max-w-5xl">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2B2D31] border border-[#1F2023] rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#949BA4] uppercase tracking-wider">Habitaciones Totales</span>
                <span className="text-3xl font-extrabold text-[#F2F3F5]">{totalRooms}</span>
              </div>
              <div className="bg-[#2B2D31] border border-[#1F2023] rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#23A55A] uppercase tracking-wider">Disponibles</span>
                <span className="text-3xl font-extrabold text-[#23A55A]">{availableRooms}</span>
              </div>
              <div className="bg-[#2B2D31] border border-[#1F2023] rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#F43F5E] uppercase tracking-wider">Ocupadas</span>
                <span className="text-3xl font-extrabold text-[#F43F5E]">{occupiedRooms}</span>
              </div>
              <div className="bg-[#2B2D31] border border-[#1F2023] rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#FFa500] uppercase tracking-wider">Mantenimiento</span>
                <span className="text-3xl font-extrabold text-[#FFa500]">{maintenanceRooms}</span>
              </div>
            </div>

            {/* Properties Overview */}
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-bold text-[#F2F3F5] tracking-wide">Propiedades Activas en Ecosistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((p) => (
                  <div key={p.id} className="bg-[#2B2D31] border border-[#1F2023] rounded-xl overflow-hidden shadow-lg p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-[#F2F3F5]">{p.name}</h3>
                        <span className="text-[10px] text-[#949BA4] tracking-widest uppercase">ID: {p.id}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-stone-900/60 border border-stone-800 text-[10px] font-bold tracking-wider rounded-full text-stone-300">
                        {p.rooms.length} Habitaciones
                      </span>
                    </div>
                    <p className="text-xs text-[#949BA4] leading-relaxed font-light line-clamp-3">
                      {p.descriptionEs}
                    </p>
                    <div className="h-px bg-[#3F4147] my-1" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#949BA4]">Disponibilidad</span>
                      <span className="font-semibold text-[#23A55A]">
                        {p.rooms.filter((r) => r.status === "AVAILABLE").length} libres / {p.rooms.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium CTA Panel */}
            <div className="bg-[#1E1F22] border border-[#2B2D31] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[#F2F3F5] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#FFa500]" /> Lanzamiento Exclusivo</h3>
                <p className="text-xs text-[#949BA4] font-light max-w-xl">
                  El módulo hotelero está completamente activo e integrado en el motor de base de datos. Cualquier actualización que realices en el panel se aplicará de inmediato en el portal del huésped.
                </p>
              </div>
              <button
                onClick={() => window.open("/hospitality", "_blank")}
                className="w-full sm:w-auto px-5 py-3 bg-[#23A55A] hover:bg-[#1A8244] text-white text-xs font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                <span>Explorar Portal del Huésped</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── CASE 2: HABITACIONES (CRUD TABLA) ─── */}
        {activeChannel === "reservas" && (
          <div className="flex flex-col gap-6 max-w-6xl">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-[#F2F3F5] tracking-wide">Inventario y Tarifas</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#23A55A] hover:bg-[#1A8244] text-white text-xs font-semibold rounded shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Habitación</span>
              </button>
            </div>

            {properties.map((p) => (
              <div key={p.id} className="bg-[#2B2D31] border border-[#1F2023] rounded-lg p-5 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-[#F2F3F5] uppercase tracking-wider border-b border-[#3F4147] pb-2">
                  {p.name}
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-[#949BA4] border-b border-[#3F4147] font-semibold">
                        <th className="py-2.5 px-3">Nombre</th>
                        <th className="py-2.5 px-3">Precio (USD/noche)</th>
                        <th className="py-2.5 px-3">Polígono SVG (svgMapId)</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3F4147]/40">
                      {p.rooms.map((room) => {
                        return (
                          <EditableRoomRow
                            key={room.id}
                            room={room}
                            onSave={handleRoomSave}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteRoom}
                            saving={savingRoomId === room.id}
                          />
                        );
                      })}
                      {p.rooms.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-[#949BA4] italic">
                            No hay habitaciones registradas en esta propiedad.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── CASE 3: TEXTOS BILINGÜES CMS ─── */}
        {activeChannel === "habitaciones" && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <h2 className="text-base font-bold text-[#F2F3F5] tracking-wide">CMS: Contenido Web Bilingüe (ES / EN)</h2>
            <div className="flex flex-col gap-4">
              {contents.map((item) => (
                <div key={item.key} className="bg-[#2B2D31] border border-[#1F2023] rounded-lg p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[#3F4147] pb-2">
                    <span className="font-mono text-xs font-bold text-[#FFa500]">{item.key}</span>
                    <span className="text-[10px] text-[#949BA4] uppercase">Traducciones Dinámicas</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Español */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#949BA4] uppercase">Español (ES)</label>
                      <textarea
                        defaultValue={item.es}
                        id={`es-${item.key}`}
                        rows={3}
                        className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2 text-xs text-[#F2F3F5] outline-none focus:border-[#F43F5E] transition-all resize-none font-light leading-relaxed"
                      />
                    </div>
                    {/* Inglés */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#949BA4] uppercase">Inglés (EN)</label>
                      <textarea
                        defaultValue={item.en}
                        id={`en-${item.key}`}
                        rows={3}
                        className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2 text-xs text-[#F2F3F5] outline-none focus:border-[#F43F5E] transition-all resize-none font-light leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const esVal = (document.getElementById(`es-${item.key}`) as HTMLTextAreaElement)?.value || "";
                        const enVal = (document.getElementById(`en-${item.key}`) as HTMLTextAreaElement)?.value || "";
                        handleContentSave(item.key, esVal, enVal);
                      }}
                      disabled={savingKey === item.key}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F43F5E] hover:bg-[#E11D48] disabled:opacity-50 text-white text-xs font-semibold rounded shadow transition-colors"
                    >
                      {savingKey === item.key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{savingKey === item.key ? "Guardando..." : "Guardar Cambios"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ─── ADD ROOM MODAL DIALOG ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#2B2D31] border border-[#1F2023] rounded-lg shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-[#3F4147] pb-2 text-white">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[#23A55A]" /> Agregar Nueva Habitación
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#949BA4] hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="flex flex-col gap-4 text-xs text-[#DBDEE1]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase">Propiedad</label>
                <select
                  value={newRoomPropertyId}
                  onChange={(e) => setNewRoomPropertyId(e.target.value)}
                  className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2.5 text-[#F2F3F5] outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase">Nombre de la Habitación / Suite</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Suite Luna Nueva"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2 text-[#F2F3F5] outline-none placeholder-[#4E5058]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase">Precio por Noche (USD)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 130"
                  value={newRoomPrice}
                  onChange={(e) => setNewRoomPrice(e.target.value)}
                  className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2 text-[#F2F3F5] outline-none placeholder-[#4E5058]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#949BA4] uppercase">ID Polígono SVG (svgMapId)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. room-107 o room-207"
                  value={newRoomSvgId}
                  onChange={(e) => setNewRoomSvgId(e.target.value)}
                  className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2 text-[#F2F3F5] outline-none placeholder-[#4E5058]"
                />
                <span className="text-[9px] text-[#949BA4] leading-relaxed">
                  Debe mapearse a un ID del plano SVG interactivo.
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#3F4147] hover:bg-[#4E5058] text-white font-semibold rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#23A55A] hover:bg-[#1A8244] text-white font-semibold rounded transition-colors"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

// Inner helper component for each row in the editable room list
function EditableRoomRow({
  room,
  onSave,
  onStatusChange,
  onDelete,
  saving,
}: {
  room: Room;
  onSave: (id: string, name: string, price: number) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [localName, setLocalName] = useState(room.name);
  const [localPrice, setLocalPrice] = useState(room.price.toString());

  return (
    <tr className="hover:bg-[#35373C]/20 border-b border-[#3F4147]/10 text-[#DBDEE1]">
      {/* Name Input */}
      <td className="py-2 px-3">
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          className="bg-transparent hover:bg-[#1E1F22] focus:bg-[#1E1F22] border border-transparent focus:border-[#F43F5E] px-2 py-1 rounded w-44 outline-none text-[#F2F3F5] transition-all"
        />
      </td>

      {/* Price Input */}
      <td className="py-2 px-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[#949BA4]">$</span>
          <input
            type="number"
            value={localPrice}
            onChange={(e) => setLocalPrice(e.target.value)}
            className="bg-transparent hover:bg-[#1E1F22] focus:bg-[#1E1F22] border border-transparent focus:border-[#F43F5E] px-2 py-1 rounded w-16 outline-none text-[#F2F3F5] text-right transition-all"
          />
        </div>
      </td>

      {/* SvgMapId Read-only */}
      <td className="py-2 px-3 font-mono text-[10px] text-[#B5BAC1]">
        {room.svgMapId}
      </td>

      {/* Status Dropdown selector */}
      <td className="py-2 px-3">
        <select
          value={room.status}
          onChange={(e) => onStatusChange(room.id, e.target.value)}
          className={`px-2 py-1 rounded bg-[#1E1F22] outline-none font-semibold border ${
            room.status === "AVAILABLE" ? "text-[#23A55A] border-[#23A55A]/30 bg-[#23A55A]/5" :
            room.status === "OCCUPIED" ? "text-[#F43F5E] border-[#F43F5E]/30 bg-[#F43F5E]/5" :
            "text-[#FFa500] border-[#FFa500]/30 bg-[#FFa500]/5"
          }`}
        >
          <option value="AVAILABLE" className="text-[#23A55A] bg-[#1E1F22]">Disponible</option>
          <option value="OCCUPIED" className="text-[#F43F5E] bg-[#1E1F22]">Ocupada</option>
          <option value="MAINTENANCE" className="text-[#FFa500] bg-[#1E1F22]">Mantenimiento</option>
        </select>
      </td>

      {/* Save / Delete Actions */}
      <td className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onSave(room.id, localName, parseFloat(localPrice) || 0)}
            disabled={saving || (localName === room.name && parseFloat(localPrice) === room.price)}
            title="Guardar habitación"
            className="p-1 hover:text-[#23A55A] disabled:opacity-30 disabled:hover:text-[#DBDEE1] transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(room.id)}
            disabled={saving}
            title="Eliminar habitación"
            className="p-1 hover:text-[#F43F5E] disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Main container component providing Navigation Context structure
export default function HotelAdminClient({
  initialProperties,
  initialContents,
  user,
}: HotelAdminClientProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [contents, setContents] = useState<ContentText[]>(initialContents);

  return (
    <NavigationProvider>
      <AdminLayoutInitializer>
        <div className="flex h-screen w-full select-none overflow-hidden bg-[#1E1F22] font-sans">
          
          {/* Column 1: ERP Sidebar (72px) */}
          <AppSidebar />

          {/* Column 2: Hospitality CMS secondary panel channels (240px) */}
          <SecondaryPanel />

          {/* Column 3: The hotel administration workspace content panel */}
          <HotelContentArea
            properties={properties}
            setProperties={setProperties}
            contents={contents}
            setContents={setContents}
          />

        </div>
      </AdminLayoutInitializer>
    </NavigationProvider>
  );
}
