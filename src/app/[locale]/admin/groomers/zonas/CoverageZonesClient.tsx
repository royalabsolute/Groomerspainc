"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  SOUTH_FLORIDA_ZIPS, 
  BASE_LAT, 
  BASE_LNG, 
  calculateHaversineDistance, 
  calculateTravelFee 
} from "@/lib/zipcodes";
import { 
  Search, 
  Check, 
  AlertTriangle, 
  Plus, 
  DollarSign, 
  Navigation,
  RefreshCw,
  Info,
  Trash2,
  Map as MapIcon,
  Layers,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

interface ZoneData {
  zipCode: string;
  name: string;
  distanceMiles: number;
  travelFee: number;
  isActive: boolean;
}

interface CoverageZonesClientProps {
  initialZones: ZoneData[];
}

export default function CoverageZonesClient({ initialZones }: CoverageZonesClientProps) {
  const [zones, setZones] = useState<ZoneData[]>(initialZones);
  const [searchZip, setSearchZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedZip, setSelectedZip] = useState<string | null>(null);

  // Map and layers refs to handle Leaflet client-side lifecycle safely
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const linesLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Handle adding/toggling a Zip Code
  const handleToggleOrAddZip = async (zip: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/zonas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode: zip }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process zip code");
      }

      const updatedZone: ZoneData = await response.json();
      
      // Update local state
      let nextZones: ZoneData[] = [];
      setZones((prev) => {
        const index = prev.findIndex((z) => z.zipCode === updatedZone.zipCode);
        if (index > -1) {
          const next = [...prev];
          next[index] = updatedZone;
          nextZones = next;
          return next;
        } else {
          const next = [...prev, updatedZone].sort((a, b) => a.zipCode.localeCompare(b.zipCode));
          nextZones = next;
          return next;
        }
      });

      toast.success(
        `Zip Code ${updatedZone.zipCode} is now ${updatedZone.isActive ? "Active" : "Inactive"}`
      );
      setSearchZip("");
      
      // Fly to newly added coordinates if in dictionary
      const zipInfo = SOUTH_FLORIDA_ZIPS[zip];
      if (zipInfo && mapRef.current) {
        mapRef.current.flyTo([zipInfo.lat, zipInfo.lng], 11, { duration: 1.5 });
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle manual Travel Fee updates
  const handleFeeChange = async (zipCode: string, newFee: string) => {
    const feeVal = parseFloat(newFee);
    if (isNaN(feeVal) || feeVal < 0) return;

    // Update locally immediately for instant feedback
    setZones((prev) =>
      prev.map((z) => (z.zipCode === zipCode ? { ...z, travelFee: feeVal } : z))
    );

    try {
      const response = await fetch("/api/admin/zonas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode, travelFee: feeVal }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }
    } catch (error) {
      toast.error(`Error saving travel fee for ${zipCode}`);
    }
  };

  // Handle manual toggle from the list
  const handleListToggle = async (zipCode: string, currentStatus: boolean) => {
    setZones((prev) =>
      prev.map((z) => (z.zipCode === zipCode ? { ...z, isActive: !currentStatus } : z))
    );

    try {
      const response = await fetch("/api/admin/zonas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode, isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to save status");
      }
      toast.success(`Zip Code ${zipCode} updated`);
    } catch (error) {
      toast.error(`Error updating status for ${zipCode}`);
      // Revert state on failure
      setZones((prev) =>
        prev.map((z) => (z.zipCode === zipCode ? { ...z, isActive: currentStatus } : z))
      );
    }
  };

  // Handle manual delete
  const handleDelete = async (zipCode: string) => {
    if (!confirm(`Are you sure you want to remove Zip Code ${zipCode}?`)) return;

    try {
      const response = await fetch(`/api/admin/zonas?zipCode=${zipCode}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove zone");
      }

      setZones((prev) => prev.filter((z) => z.zipCode !== zipCode));
      if (selectedZip === zipCode) setSelectedZip(null);
      toast.success(`Zip Code ${zipCode} removed successfully`);
    } catch (error) {
      toast.error(`Error deleting Zip Code ${zipCode}`);
    }
  };

  // Quick search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchZip.trim();
    if (!clean) return;

    if (clean.length !== 5 || isNaN(Number(clean))) {
      toast.error("Please enter a valid 5-digit Zip Code");
      return;
    }

    handleToggleOrAddZip(clean);
  };

  // Initialize dynamic Leaflet Satellite Map on the client side
  useEffect(() => {
    let mapInstance: any;
    
    const initMap = async () => {
      if (!mapContainerRef.current) return;
      
      const L = await import("leaflet");
      LRef.current = L;

      // Centered on South Florida (Base center between Fort Lauderdale and Miami)
      mapInstance = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([25.95, -80.20], 10);
      
      mapRef.current = mapInstance;

      // 1. High-Resolution Esri World Imagery (Real Satellite terrain)
      const satelliteTiles = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      );

      // 2. Esri World Boundaries and Places (City names, boundaries, places labels overlay)
      const boundariesTiles = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      );

      // 3. Esri World Transportation (Streets, highways overlay)
      const labelTiles = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      );

      satelliteTiles.addTo(mapInstance);
      boundariesTiles.addTo(mapInstance);
      labelTiles.addTo(mapInstance);

      // Add Zoom buttons on top-left in a serious style
      L.control.zoom({ position: "topleft" }).addTo(mapInstance);

      // Create LayerGroups for managing dynamic elements cleanly
      markersLayerRef.current = L.layerGroup().addTo(mapInstance);
      linesLayerRef.current = L.layerGroup().addTo(mapInstance);

      // Trigger initial redraw
      drawGisData();
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Redraw layers when zones state or selectedZip changes
  useEffect(() => {
    drawGisData();
  }, [zones, selectedZip]);

  // Main drawing engine for dynamic Leaflet Markers and Travel Surcharge lines
  const drawGisData = () => {
    const L = LRef.current;
    if (!L || !markersLayerRef.current || !linesLayerRef.current) return;

    // Clear previous vector layers
    markersLayerRef.current.clearLayers();
    linesLayerRef.current.clearLayers();

    // Map DB zones for quick lookup
    const dbZonesMap = new Map<string, ZoneData>();
    zones.forEach((z) => dbZonesMap.set(z.zipCode, z));

    // 1. Render Point 0 (Base Operations Center 33312)
    const baseIcon = L.divIcon({
      className: "custom-gis-base",
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-60"></div>
          <div class="absolute inset-2 rounded-full bg-amber-500/10 animate-pulse opacity-40"></div>
          <div class="relative flex items-center justify-center w-8 h-8 bg-[#1A1A1A] border-2 border-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] z-10">
            <span class="text-[9px] font-bold text-amber-400 tracking-tighter">BASE</span>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const baseMarker = L.marker([BASE_LAT, BASE_LNG], { icon: baseIcon })
      .bindTooltip("<b>Fort Lauderdale Base (33312)</b><br/>Punto de Operaciones 0", {
        direction: "top",
        className: "gis-serious-tooltip",
      })
      .addTo(markersLayerRef.current);

    // 2. Loop through all ZIP codes in South Florida coordinates directory
    Object.entries(SOUTH_FLORIDA_ZIPS).forEach(([zip, info]) => {
      if (zip === "33312") return; // Base already plotted

      const dbZone = dbZonesMap.get(zip);
      let isRegistered = false;
      let isActive = false;
      let labelFee = 0;

      if (dbZone) {
        isRegistered = true;
        isActive = dbZone.isActive;
        labelFee = dbZone.travelFee;
      }

      const isSelected = selectedZip === zip;
      const selectGlow = isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#121212] scale-110 z-50 shadow-lg" : "";
      
      let markerHtml = "";
      if (!isRegistered) {
        markerHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full font-semibold text-[10px] tracking-tight bg-black/60 text-neutral-400 border border-dashed border-neutral-600 hover:border-blue-400 hover:text-white hover:bg-neutral-900 transition-all duration-200 ${selectGlow}">
            ${zip.substring(2)}
          </div>
        `;
      } else {
        if (isActive) {
          markerHtml = `
            <div class="relative flex items-center justify-center w-8 h-8">
              <div class="absolute inset-0 rounded-full bg-blue-500/25 animate-pulse"></div>
              <div class="relative flex items-center justify-center w-7 h-7 rounded-full font-semibold text-[10px] tracking-tight bg-blue-600 text-white border border-blue-400 shadow-[0_2px_8px_rgba(37,99,235,0.5)] transition-all duration-200 ${selectGlow}">
                ${zip.substring(2)}
              </div>
            </div>
          `;
        } else {
          markerHtml = `
            <div class="flex items-center justify-center w-7 h-7 rounded-full font-semibold text-[10px] tracking-tight bg-neutral-800 text-neutral-400 border border-neutral-600 transition-all duration-200 ${selectGlow}">
              ${zip.substring(2)}
            </div>
          `;
        }
      }

      const pinIcon = L.divIcon({
        className: `custom-gis-pin-${zip}`,
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const zipMarker = L.marker([info.lat, info.lng], { icon: pinIcon })
        .addTo(markersLayerRef.current);

      // Bind dynamic tooltips based on registration details
      if (isRegistered) {
        zipMarker.bindTooltip(`
          <div class="p-1 font-sans text-xs">
            <b class="text-white uppercase tracking-tight">${zip} - ${info.name.split(" (")[0]}</b>
            <div class="text-neutral-400 mt-0.5">Distancia: <span class="text-white">${dbZone!.distanceMiles} mi</span></div>
            <div class="text-neutral-400">Recargo: <span class="text-amber-400">$${labelFee.toFixed(2)}</span></div>
            <div class="font-bold mt-1 ${isActive ? "text-blue-400" : "text-neutral-500"}">
              ${isActive ? "● ACTIVO" : "○ INACTIVO"}
            </div>
          </div>
        `, {
          direction: "top",
          className: "gis-serious-tooltip-dark",
        });

        // 3. Render connection flows (polylines) from Point 0 to registered zones
        const lineColor = isActive ? "#3B82F6" : "#4B5563";
        const lineWeight = isActive ? 2 : 1;
        const lineDash = isActive ? "3, 6" : "5, 5";

        L.polyline([[BASE_LAT, BASE_LNG], [info.lat, info.lng]], {
          color: lineColor,
          weight: lineWeight,
          dashArray: lineDash,
          opacity: isActive ? 0.7 : 0.3,
          className: "gis-connection-line",
        }).addTo(linesLayerRef.current);

      } else {
        const estimatedDist = calculateHaversineDistance(BASE_LAT, BASE_LNG, info.lat, info.lng);
        const estimatedFee = calculateTravelFee(estimatedDist);
        zipMarker.bindTooltip(`
          <div class="p-1 font-sans text-xs">
            <b class="text-white">${zip} - ${info.name.split(" (")[0]}</b>
            <div class="text-neutral-400 mt-0.5">Est. Distancia: <span class="text-neutral-200">${estimatedDist} mi</span></div>
            <div class="text-neutral-400">Est. Recargo: <span class="text-amber-500">$${estimatedFee.toFixed(2)}</span></div>
            <div class="text-amber-400 font-bold mt-1">HAGA CLIC PARA HABILITAR</div>
          </div>
        `, {
          direction: "top",
          className: "gis-serious-tooltip-dark",
        });
      }

      // Event hook when clicking marker
      zipMarker.on("click", () => {
        setSelectedZip(zip);
        setSearchZip(zip);
      });
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-[#E0E0E0]">
      {/* LEFT COLUMN: Map & Controls (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Search Panel (Sleek Dark Theme) */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3 bg-[#1A1A1A] p-4 border border-neutral-800 rounded-2xl shadow-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar o añadir Zip Code (Ej: 33131, 33139, 33326)..."
              value={searchZip}
              onChange={(e) => setSearchZip(e.target.value)}
              maxLength={5}
              className="w-full bg-[#121212] border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 font-medium text-white placeholder-neutral-600 focus:outline-none focus:border-blue-600 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-6 font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer text-sm"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Agregar
          </button>
        </form>

        {/* GIS Interactive Satellite Map Card */}
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
            <div className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-white tracking-tight text-sm">Mapa Satelital Híbrido (Real)</h2>
            </div>
            <div className="flex gap-4 text-[10px] font-semibold text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-blue-600 border border-blue-400 rounded-full shadow-[0_0_6px_rgba(37,99,235,0.4)]" /> Activo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-neutral-800 border border-neutral-600 rounded-full" /> Inactivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-[#121212] border border-neutral-600 border-dashed rounded-full" /> No Registrado
              </span>
            </div>
          </div>

          {/* Leaflet container */}
          <div className="relative w-full aspect-6/5 bg-[#121212] border border-neutral-800 rounded-xl overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full min-h-[400px] z-10" />

            {/* Quick Context Card Overlay */}
            {selectedZip && (
              <div className="absolute bottom-4 left-4 right-4 bg-[#1A1A1A]/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 shadow-2xl flex justify-between items-center z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{selectedZip}</span>
                    <span className="text-xs font-semibold text-neutral-400 truncate max-w-[180px]">
                      {SOUTH_FLORIDA_ZIPS[selectedZip]?.name || "Ubicación Procedural"}
                    </span>
                  </div>
                  {(() => {
                    const dbZone = zones.find((z) => z.zipCode === selectedZip);
                    if (dbZone) {
                      return (
                        <div className="text-[11px] font-semibold text-neutral-400 mt-1 flex gap-3">
                          <span>Distancia: <span className="text-white">{dbZone.distanceMiles} mi</span></span>
                          <span>Recargo: <span className="text-amber-400">${dbZone.travelFee.toFixed(2)}</span></span>
                          <span className={dbZone.isActive ? "text-blue-400" : "text-neutral-500"}>
                            {dbZone.isActive ? "● Activo" : "○ Inactivo"}
                          </span>
                        </div>
                      );
                    } else {
                      const zipInfo = SOUTH_FLORIDA_ZIPS[selectedZip];
                      if (!zipInfo) return null;
                      const dist = calculateHaversineDistance(BASE_LAT, BASE_LNG, zipInfo.lat, zipInfo.lng);
                      const fee = calculateTravelFee(dist);
                      return (
                        <div className="text-[11px] font-semibold text-amber-500 mt-1">
                          Distancia: {dist} mi ➔ Fee Propuesto: ${fee.toFixed(2)}
                        </div>
                      );
                    }
                  })()}
                </div>
                <div className="flex gap-2">
                  {(() => {
                    const dbZone = zones.find((z) => z.zipCode === selectedZip);
                    return dbZone ? (
                      <>
                        <button
                          onClick={() => handleListToggle(selectedZip, dbZone.isActive)}
                          className={`py-1.5 px-3 border border-neutral-700 rounded-lg font-semibold text-[10px] uppercase cursor-pointer transition-colors ${
                            dbZone.isActive 
                              ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white" 
                              : "bg-blue-600 text-white hover:bg-blue-500"
                          }`}
                        >
                          {dbZone.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDelete(selectedZip)}
                          className="bg-red-950/20 hover:bg-red-900/40 border border-red-900/60 rounded-lg py-1.5 px-3 font-semibold text-[10px] uppercase text-red-400 cursor-pointer transition-colors"
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleToggleOrAddZip(selectedZip)}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-lg py-1.5 px-4 font-semibold text-[10px] uppercase text-white cursor-pointer shadow-md transition-colors"
                      >
                        Habilitar Cobertura
                      </button>
                    );
                  })()}
                  <button 
                    onClick={() => setSelectedZip(null)}
                    className="border border-neutral-800 hover:bg-neutral-850 rounded-lg py-1.5 px-2.5 text-neutral-400 hover:text-neutral-200 font-semibold text-[10px] cursor-pointer transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Grid List Table (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col max-h-[660px] overflow-hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
            <h2 className="font-semibold text-white tracking-tight text-sm flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-500" /> Zonas de Cobertura ({zones.length})
            </h2>
            <span className="text-[10px] bg-neutral-900 border border-neutral-850 rounded-lg px-2.5 py-1.5 font-semibold text-neutral-400 shadow-md">
              Punto 0: 33312
            </span>
          </div>

          {/* 4 Column Compact Grid Table Header (Sleek Dark Theme) */}
          <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-[#121212] border border-neutral-850 rounded-xl text-neutral-400 font-semibold text-[11px] uppercase tracking-wider select-none">
            <div className="col-span-2">Zip</div>
            <div className="col-span-5">Ubicación</div>
            <div className="col-span-2 text-center">Millas</div>
            <div className="col-span-3 text-right">Recargo</div>
          </div>

          {/* Grid Rows Scroll Area */}
          <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 border-t border-neutral-900 pt-2">
            {zones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500 font-semibold border border-dashed border-neutral-800 rounded-xl">
                <ShieldAlert className="h-8 w-8 text-neutral-600 mb-2" />
                Ninguna zona de cobertura configurada
                <span className="text-[10px] font-normal mt-1 text-neutral-600">
                  Usa el buscador o haz clic en el mapa satelital.
                </span>
              </div>
            ) : (
              zones.map((zone) => (
                <div 
                  key={zone.zipCode}
                  onClick={() => {
                    setSelectedZip(zone.zipCode);
                    const info = SOUTH_FLORIDA_ZIPS[zone.zipCode];
                    if (info && mapRef.current) {
                      mapRef.current.flyTo([info.lat, info.lng], 11, { duration: 1 });
                    }
                  }}
                  className={`grid grid-cols-12 gap-1 items-center px-3 py-2 border rounded-xl transition-all text-xs font-semibold text-white cursor-pointer ${
                    selectedZip === zone.zipCode 
                      ? "bg-neutral-800 border-neutral-700 shadow-lg scale-[1.005]" 
                      : "bg-[#121212] border-neutral-850 hover:border-neutral-700"
                  }`}
                >
                  {/* Zip Code & status indicator */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleListToggle(zone.zipCode, zone.isActive);
                      }}
                      className={`inline-block w-2.5 h-2.5 rounded-full border cursor-pointer shrink-0 transition-colors ${
                        zone.isActive ? "bg-blue-500 border-white" : "bg-neutral-650 border-neutral-550"
                      }`}
                      title={zone.isActive ? "Activo - Haga clic para Desactivar" : "Inactivo - Haga clic para Activar"}
                    />
                    <span className="font-semibold text-white text-[11px]">{zone.zipCode}</span>
                  </div>

                  {/* Name location */}
                  <div className="col-span-5 truncate text-neutral-400 font-normal text-[11px]" title={zone.name}>
                    {zone.name.split(" (")[0]}
                  </div>

                  {/* Distance */}
                  <div className="col-span-2 text-center text-neutral-300 text-[11px]">
                    {zone.distanceMiles}
                  </div>

                  {/* Travel Fee editable Input */}
                  <div className="col-span-3 flex items-center justify-end relative" onClick={(e) => e.stopPropagation()}>
                    <span className="absolute left-2 text-neutral-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={zone.travelFee}
                      onChange={(e) => handleFeeChange(zone.zipCode, e.target.value)}
                      className="w-full bg-[#121212] border border-neutral-850 focus:border-blue-600 hover:border-neutral-700 focus:ring-1 focus:ring-blue-600/30 rounded-lg pl-5 pr-1 py-1.5 font-semibold text-right text-white focus:outline-none transition-all text-[11px]"
                      title="Editar tarifa y guardar instantáneamente"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Informational Box */}
          <div className="mt-4 p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-xl text-neutral-400 text-[11px] font-medium flex gap-2.5 items-start select-none">
            <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-blue-400 font-semibold uppercase block tracking-wider mb-0.5">Lógica de Cobertura y Recargos</span>
              Las primeras 10 millas desde 33312 no tienen recargo de traslado ($0.00). A partir de la milla 10 se carga $1.00 por milla adicional. El recargo se puede modificar libremente en los campos de edición.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
