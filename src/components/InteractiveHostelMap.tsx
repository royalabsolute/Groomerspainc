import React from "react";

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  status: string; // AVAILABLE, OCCUPIED, MAINTENANCE
  price: number;
  svgMapId: string;
}

interface InteractiveHostelMapProps {
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  language: "es" | "en";
}

export default function InteractiveHostelMap({
  rooms,
  selectedRoom,
  onSelectRoom,
  language,
}: InteractiveHostelMapProps) {
  
  // Helper to get room color status
  const getRoomColors = (status: string, isSelected: boolean) => {
    switch (status) {
      case "AVAILABLE":
        return {
          fill: isSelected ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.12)",
          stroke: "#10B981",
          hoverFill: "hover:fill-emerald-500/25",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
          text: language === "es" ? "Disponible" : "Available",
        };
      case "OCCUPIED":
        return {
          fill: isSelected ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.12)",
          stroke: "#EF4444",
          hoverFill: "hover:fill-red-500/25",
          badgeBg: "bg-red-500/20 text-red-300 border border-red-500/30",
          text: language === "es" ? "Ocupada" : "Occupied",
        };
      case "MAINTENANCE":
      default:
        return {
          fill: isSelected ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.12)",
          stroke: "#F59E0B",
          hoverFill: "hover:fill-amber-500/25",
          badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          text: language === "es" ? "Mantenimiento" : "Maintenance",
        };
    }
  };

  // Define layout coordinates for 6 rooms (3 top, 3 bottom)
  // Coordinates are relative to a viewBox of "0 0 800 450"
  const mapLayouts = [
    { svgId: "room-101", svgIdAlt: "room-201", label: "101 / 201", x: 40, y: 30, w: 220, h: 140, doorX: 200, doorY: 170, bedX: 80, bedY: 50 },
    { svgId: "room-102", svgIdAlt: "room-202", label: "102 / 202", x: 280, y: 30, w: 240, h: 140, doorX: 380, doorY: 170, bedX: 340, bedY: 50 },
    { svgId: "room-103", svgIdAlt: "room-203", label: "103 / 203", x: 540, y: 30, w: 220, h: 140, doorX: 560, doorY: 170, bedX: 620, bedY: 50 },
    
    { svgId: "room-104", svgIdAlt: "room-204", label: "104 / 204", x: 40, y: 270, w: 220, h: 140, doorX: 200, doorY: 270, bedX: 80, bedY: 330 },
    { svgId: "room-105", svgIdAlt: "room-205", label: "105 / 205", x: 280, y: 270, w: 240, h: 140, doorX: 380, doorY: 270, bedX: 340, bedY: 330 },
    { svgId: "room-106", svgIdAlt: "room-206", label: "106 / 206", x: 540, y: 270, w: 220, h: 140, doorX: 560, doorY: 270, bedX: 620, bedY: 330 },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-6 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500/20 border border-emerald-500" />
          <span className="text-zinc-400 font-medium">{language === "es" ? "Disponible" : "Available"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-red-500/20 border border-red-500" />
          <span className="text-zinc-400 font-medium">{language === "es" ? "Ocupado" : "Occupied"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-amber-500/20 border border-amber-500" />
          <span className="text-zinc-400 font-medium">{language === "es" ? "Mantenimiento" : "Maintenance"}</span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-2 sm:p-4">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-auto select-none font-sans"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid pattern background (architectural blueprint vibe) */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Central Corridor */}
          <g opacity="0.3">
            <rect x="40" y="170" width="720" height="100" fill="#18181B" stroke="#27272A" strokeWidth="1.5" />
            <line x1="40" y1="220" x2="760" y2="220" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4" />
            <text x="400" y="224" fill="#52525B" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="2">
              {language === "es" ? "PASILLO CENTRAL / CORRIDOR" : "CENTRAL CORRIDOR"}
            </text>
          </g>

          {/* Main Exterior Walls */}
          <rect x="35" y="25" width="730" height="390" fill="none" stroke="#3F3F46" strokeWidth="4" rx="10" />

          {/* Render Rooms */}
          {mapLayouts.map((layout) => {
            // Find corresponding room by matching svgMapId
            const room = rooms.find(
              (r) => r.svgMapId === layout.svgId || r.svgMapId === layout.svgIdAlt
            );

            if (!room) return null;

            const isSelected = selectedRoom?.id === room.id;
            const colors = getRoomColors(room.status, isSelected);

            return (
              <g
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className="cursor-pointer group"
              >
                {/* Room space boundary */}
                <rect
                  x={layout.x}
                  y={layout.y}
                  width={layout.w}
                  height={layout.h}
                  fill={colors.fill}
                  stroke={isSelected ? "#FFFFFF" : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className={`transition-all duration-300 ${colors.hoverFill}`}
                  rx="6"
                />

                {/* Internal room design accents */}
                {/* Bed Symbol */}
                <g opacity={isSelected ? "0.8" : "0.4"} className="transition-opacity duration-300">
                  <rect
                    x={layout.bedX}
                    y={layout.y + (layout.y < 150 ? 15 : 65)}
                    width="60"
                    height="60"
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="1"
                    rx="3"
                  />
                  {/* Bed Pillows */}
                  <rect
                    x={layout.bedX + 8}
                    y={layout.y + (layout.y < 150 ? 20 : 70)}
                    width="18"
                    height="12"
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="1"
                    rx="1"
                  />
                  <rect
                    x={layout.bedX + 34}
                    y={layout.y + (layout.y < 150 ? 20 : 70)}
                    width="18"
                    height="12"
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="1"
                    rx="1"
                  />
                  {/* Bed blanket line */}
                  <line
                    x1={layout.bedX}
                    y1={layout.y + (layout.y < 150 ? 50 : 100)}
                    x2={layout.bedX + 60}
                    y2={layout.y + (layout.y < 150 ? 50 : 100)}
                    stroke={colors.stroke}
                    strokeWidth="1"
                  />
                </g>

                {/* Door Symbol (Swing arc) */}
                <path
                  d={
                    layout.y < 150
                      ? `M ${layout.doorX} 170 A 30 30 0 0 1 ${layout.doorX - 30} 140`
                      : `M ${layout.doorX} 270 A 30 30 0 0 0 ${layout.doorX - 30} 300`
                  }
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.5"
                />
                <line
                  x1={layout.doorX}
                  y1={layout.y < 150 ? 170 : 270}
                  x2={layout.doorX - 30}
                  y2={layout.y < 150 ? 170 : 270}
                  stroke={colors.stroke}
                  strokeWidth="2.5"
                />

                {/* Room Texts */}
                {/* Room Name */}
                <text
                  x={layout.x + layout.w / 2}
                  y={layout.y + (layout.y < 150 ? 100 : 45)}
                  fill={isSelected ? "#FFFFFF" : "#E4E4E7"}
                  fontSize="13"
                  fontWeight="600"
                  textAnchor="middle"
                  className="transition-colors duration-300"
                >
                  {room.name}
                </text>

                {/* Room Price */}
                <text
                  x={layout.x + layout.w / 2}
                  y={layout.y + (layout.y < 150 ? 120 : 25)}
                  fill={isSelected ? "#F43F5E" : "#A1A1AA"}
                  fontSize="11"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  ${room.price} USD / {language === "es" ? "noche" : "night"}
                </text>

                {/* Status indicator dot inside room */}
                <circle
                  cx={layout.x + 20}
                  cy={layout.y + 20}
                  r="5"
                  fill={colors.stroke}
                  className={room.status === "AVAILABLE" ? "animate-pulse" : ""}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
