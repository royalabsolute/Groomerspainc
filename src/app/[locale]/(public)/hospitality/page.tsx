"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Calendar, User, CheckCircle2, ChevronRight, MapPin, Loader2, ArrowRight } from "lucide-react";
import InteractiveHostelMap, { Room } from "@/components/InteractiveHostelMap";

interface Property {
  id: string;
  name: string;
  descriptionEs: string;
  descriptionEn: string;
  rooms: Room[];
}

export default function HospitalityPublicPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [contents, setContents] = useState<Record<string, { es: string; en: string }>>({});
  const [loading, setLoading] = useState(true);

  // Form & booking states
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [bookingState, setBookingState] = useState<"idle" | "booking" | "success">("idle");

  // Load properties, rooms and bilingual content
  const fetchData = async () => {
    try {
      // 1. Fetch Rooms & Properties
      const roomsRes = await fetch("/api/hospitality/rooms");
      const roomsData = await roomsRes.json();
      
      // 2. Fetch Content translation strings
      const contentRes = await fetch("/api/hospitality/content");
      const contentData = await contentRes.json();

      if (roomsData.success && roomsData.properties) {
        setProperties(roomsData.properties);
        // Default select first property
        setSelectedProperty(roomsData.properties[0]);
      }

      if (contentData.success && contentData.contents) {
        const contentLookup: Record<string, { es: string; en: string }> = {};
        contentData.contents.forEach((c: { key: string; es: string; en: string }) => {
          contentLookup[c.key] = { es: c.es, en: c.en };
        });
        setContents(contentLookup);
      }
    } catch (err) {
      console.error("Error loading hospitality page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Translate helper
  const t = (key: string, fallback: string = ""): string => {
    if (contents[key]) {
      return contents[key][language] || fallback;
    }
    return fallback;
  };

  // Simulate reservation and update Room state in DB
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !clientName || !clientEmail) return;

    setBookingState("booking");

    try {
      // API call to set Room as OCCUPIED in database
      const res = await fetch("/api/hospitality/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRoom.id,
          status: "OCCUPIED",
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Refresh local room lists
        await fetchData();
        // Update currently selected room object to reflect state change
        setSelectedRoom((prev) => prev ? { ...prev, status: "OCCUPIED" } : null);
        
        setTimeout(() => {
          setBookingState("success");
        }, 1200);
      } else {
        alert(language === "es" ? "Error al registrar la reserva" : "Error registering booking");
        setBookingState("idle");
      }
    } catch (err) {
      console.error("Error submitting mock booking:", err);
      setBookingState("idle");
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    if (prop) {
      setSelectedProperty(prop);
      setSelectedRoom(null);
      setBookingState("idle");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] text-stone-900 select-text">
        <Loader2 className="w-12 h-12 text-[#B59410] animate-spin mb-4" />
        <p className="text-sm font-medium tracking-widest uppercase text-stone-500">
          {language === "es" ? "Cargando Experiencia..." : "Loading Experience..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto select-text bg-[#FAF9F6] text-stone-900 font-sans scroll-smooth pb-24 sm:pb-0">
      
      {/* ─── FLOATING LANGUAGE SELECTOR ─── */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === "es" ? "en" : "es")}
          className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-md hover:bg-white text-stone-800 text-xs font-semibold rounded-full shadow-lg border border-stone-200/50 transition-all duration-300 active:scale-95"
          aria-label="Toggle language"
        >
          <Globe className="w-3.5 h-3.5 text-[#B59410]" />
          <span>{language === "es" ? "English (EN)" : "Español (ES)"}</span>
        </button>
      </div>

      {/* ─── PUBLIC NAVBAR ─── */}
      <nav className="w-full bg-white/70 backdrop-blur-md border-b border-stone-200/40 py-4 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/Favicon.svg" alt="Nexus Logo" className="w-6 h-6 object-contain" />
          <span className="font-serif text-lg tracking-wider font-semibold text-stone-900">
            Absolute <span className="text-[#B59410]">Hospitality</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-semibold text-stone-600">
          <a href="#properties" className="hover:text-[#B59410] transition-colors">{language === "es" ? "Propiedades" : "Properties"}</a>
          <a href="#map" className="hover:text-[#B59410] transition-colors">{language === "es" ? "Habitaciones" : "Rooms"}</a>
          <a href="/login" className="px-4 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all">
            {language === "es" ? "Acceso Admin" : "Admin Login"}
          </a>
        </div>
      </nav>

      {/* ─── TAREA 3.1: HERO SECTION (SPLIT SCREEN) ─── */}
      <section id="properties" className="relative w-full h-[85vh] flex flex-col md:flex-row overflow-hidden border-b border-stone-200">
        
        {/* Hostal Villa María */}
        <div
          onClick={() => properties[0] && handlePropertyChange(properties[0].id)}
          className={`relative flex-1 group overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
            selectedProperty?.name === "Hostal Villa María" ? "md:flex-[1.4]" : "md:flex-[0.8] opacity-75 hover:opacity-100"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] ease-out group-hover:scale-105"
            style={{ backgroundImage: "url('/villa_maria.png')" }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent opacity-80" />

          {/* Label Tag */}
          <div className="absolute top-6 left-6 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-widest font-semibold rounded-full">
            {language === "es" ? "Naturaleza & Descanso" : "Nature & Relaxation"}
          </div>

          {/* Hero Content */}
          <div className="absolute bottom-12 left-8 right-8 flex flex-col items-start text-white gap-2 max-w-md">
            <span className="text-[#B59410] text-xs uppercase tracking-widest font-bold">Hostal</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide">
              Hostal Villa María
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm line-clamp-3 leading-relaxed mt-2 font-light">
              {language === "es"
                ? "Un hostal acogedor rodeado de colinas y jardines floridos. Perfecto para caminatas y descansar en un ambiente familiar."
                : "A cozy hostel surrounded by hills and blooming gardens. Perfect for hiking and relaxing in a family atmosphere."}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#B59410] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>{language === "es" ? "Explorar Disponibilidad" : "Explore Availability"}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Finca María */}
        <div
          onClick={() => properties[1] && handlePropertyChange(properties[1].id)}
          className={`relative flex-1 group overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
            selectedProperty?.name === "Finca María" ? "md:flex-[1.4]" : "md:flex-[0.8] opacity-75 hover:opacity-100"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] ease-out group-hover:scale-105"
            style={{ backgroundImage: "url('/finca_maria.png')" }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent opacity-80" />

          {/* Label Tag */}
          <div className="absolute top-6 left-6 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-widest font-semibold rounded-full">
            {language === "es" ? "Lujo & Exclusividad" : "Luxury & Exclusivity"}
          </div>

          {/* Hero Content */}
          <div className="absolute bottom-12 left-8 right-8 flex flex-col items-start text-white gap-2 max-w-md">
            <span className="text-[#B59410] text-xs uppercase tracking-widest font-bold">Finca Campestre</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide">
              Finca María
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm line-clamp-3 leading-relaxed mt-2 font-light">
              {language === "es"
                ? "Una finca campestre de lujo con piscina privada, establos y senderos ecológicos. La máxima expresión de confort rústico."
                : "A luxury country estate with a private pool, stables, and ecological trails. The ultimate expression of rustic comfort."}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#B59410] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>{language === "es" ? "Explorar Disponibilidad" : "Explore Availability"}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

      </section>

      {/* ─── DYNAMIC PROPERTY DESCRIPTION & CONTENT ─── */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7 flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest font-bold text-[#B59410]">
            {language === "es" ? "Propiedad Seleccionada" : "Selected Property"}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-none">
            {selectedProperty?.name}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
            {language === "es" ? selectedProperty?.descriptionEs : selectedProperty?.descriptionEn}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-500 uppercase tracking-widest mt-2">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#B59410]" /> Colombia, Campo</span>
            <span>•</span>
            <span>{selectedProperty?.rooms.length} {language === "es" ? "Habitaciones Totales" : "Total Rooms"}</span>
          </div>
        </div>

        <div className="md:col-span-5 bg-white border border-stone-200/60 shadow-xl rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="font-serif text-xl font-bold text-stone-900">
            {t("hero_title", "Un Refugio Exclusivo de Tranquilidad")}
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-light">
            {t("hero_desc", "Descubre la perfecta armonía entre el lujo rústico y el descanso en nuestras exclusivas propiedades.")}
          </p>
        </div>
      </section>

      {/* ─── TAREA 3.3: FIXED BOOKING BAR (MOBILE / DESKTOP) ─── */}
      <div className="w-full bg-stone-900 text-white py-4 px-6 sticky top-20 z-20 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B59410] animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-semibold text-stone-300">
              {language === "es" ? "Consulta disponibilidad y reserva" : "Check availability & book"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
            {/* Input Check In */}
            <div className="flex items-center gap-2 bg-stone-800/80 px-3 py-2 rounded-lg border border-stone-700/50 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#B59410]" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="bg-transparent border-none outline-none text-white w-28"
                placeholder={language === "es" ? "Llegada" : "Check-In"}
              />
            </div>
            
            {/* Input Check Out */}
            <div className="flex items-center gap-2 bg-stone-800/80 px-3 py-2 rounded-lg border border-stone-700/50 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#B59410]" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="bg-transparent border-none outline-none text-white w-28"
                placeholder={language === "es" ? "Salida" : "Check-Out"}
              />
            </div>

            {/* Guests */}
            <div className="flex items-center gap-2 bg-stone-800/80 px-3 py-2 rounded-lg border border-stone-700/50 text-xs">
              <User className="w-3.5 h-3.5 text-[#B59410]" />
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="bg-transparent border-none outline-none text-white pr-2"
              >
                <option value="1" className="bg-stone-900">1 {language === "es" ? "Huésped" : "Guest"}</option>
                <option value="2" className="bg-stone-900">2 {language === "es" ? "Huéspedes" : "Guests"}</option>
                <option value="3" className="bg-stone-900">3 {language === "es" ? "Huéspedes" : "Guests"}</option>
                <option value="4" className="bg-stone-900">4+ {language === "es" ? "Huéspedes" : "Guests"}</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* ─── TAREA 3.4: INTERACTIVE MAP SECTION ─── */}
      <section id="map" className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        <div className="text-center max-w-xl flex flex-col gap-3 mb-10">
          <span className="text-xs uppercase tracking-widest font-bold text-[#B59410]">
            {language === "es" ? "Plano del Hotel" : "Hotel Blueprint"}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            {t("map_title", "Plano Interactivo de Disponibilidad")}
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm leading-relaxed font-light">
            {t("map_desc", "Visualiza el estado de nuestras habitaciones en tiempo real. Haz clic sobre cualquier espacio del plano para ver precios, detalles e iniciar tu reserva ficticia.")}
          </p>
        </div>

        {/* The SVG interactive plan */}
        {selectedProperty && (
          <InteractiveHostelMap
            rooms={selectedProperty.rooms}
            selectedRoom={selectedRoom}
            onSelectRoom={(room) => {
              setSelectedRoom(room);
              setBookingState("idle");
              // Smooth scroll to the details/form area if needed on mobile
              if (window.innerWidth < 640) {
                document.getElementById("booking-card")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            language={language}
          />
        )}

        {/* Selected Room Booking Details / Modal Card */}
        <AnimatePresence mode="wait">
          {selectedRoom && (
            <motion.div
              id="booking-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-2xl bg-white border border-stone-200 shadow-2xl rounded-2xl p-6 sm:p-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedRoom(null)}
                className="absolute top-4 right-4 w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center text-stone-500 transition-colors"
              >
                &times;
              </button>

              {/* Room Meta Details */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#B59410]">
                  {selectedProperty?.name}
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-950">
                  {selectedRoom.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${
                    selectedRoom.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" :
                    selectedRoom.status === "OCCUPIED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedRoom.status === "AVAILABLE" ? (language === "es" ? "Disponible" : "Available") :
                     selectedRoom.status === "OCCUPIED" ? (language === "es" ? "Ocupada" : "Occupied") :
                     (language === "es" ? "Mantenimiento" : "Maintenance")}
                  </span>
                  <span className="text-stone-400 text-xs">•</span>
                  <span className="text-stone-900 font-bold text-sm">
                    ${selectedRoom.price} USD / {language === "es" ? "noche" : "night"}
                  </span>
                </div>
                
                <p className="text-stone-500 text-xs sm:text-sm font-light leading-relaxed mt-2">
                  {language === "es" 
                    ? "Esta suite premium cuenta con vistas panorámicas al valle, sábanas de lino de 400 hilos, baño privado con ducha de hidromasaje y minibar local."
                    : "This premium suite features panoramic valley views, 400-thread count linen bedding, a private bathroom with hydro-massage shower, and local minibar."}
                </p>
              </div>

              {/* Dynamic Booking Status Action Panel */}
              <div className="flex flex-col justify-center bg-stone-50 border border-stone-200/50 rounded-xl p-5">
                {bookingState === "idle" && (
                  <>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-stone-800 mb-3">
                      {language === "es" ? "Información de Reserva" : "Booking Details"}
                    </h4>
                    {selectedRoom.status === "AVAILABLE" ? (
                      <form onSubmit={handleBookingSubmit} className="flex flex-col gap-3">
                        <input
                          type="text"
                          required
                          placeholder={language === "es" ? "Nombre Completo" : "Full Name"}
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-white text-xs px-3 py-2 border border-stone-200 rounded outline-none focus:border-[#B59410] text-stone-900 transition-colors"
                        />
                        <input
                          type="email"
                          required
                          placeholder={language === "es" ? "Correo Electrónico" : "Email Address"}
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full bg-white text-xs px-3 py-2 border border-stone-200 rounded outline-none focus:border-[#B59410] text-stone-900 transition-colors"
                        />
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white text-xs font-semibold rounded transition-all mt-2"
                        >
                          {t("cta_book", "Simular Reserva")}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-4 flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-stone-500">
                          {selectedRoom.status === "OCCUPIED" 
                            ? (language === "es" ? "Esta habitación se encuentra ocupada actualmente." : "This room is currently occupied.")
                            : (language === "es" ? "Esta habitación está en mantenimiento temporal." : "This room is in temporary maintenance.")}
                        </span>
                        <button
                          disabled
                          className="w-full py-2.5 bg-stone-300 text-stone-500 text-xs font-semibold rounded cursor-not-allowed mt-2"
                        >
                          {language === "es" ? "No Disponible" : "Not Available"}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {bookingState === "booking" && (
                  <div className="flex flex-col items-center justify-center py-8 text-stone-600 gap-2">
                    <Loader2 className="w-8 h-8 text-[#B59410] animate-spin" />
                    <span className="text-xs font-semibold tracking-wider uppercase">
                      {language === "es" ? "Registrando Reserva..." : "Registering Booking..."}
                    </span>
                  </div>
                )}

                {bookingState === "success" && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center text-center py-6 text-emerald-800 gap-2"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <h4 className="font-serif text-lg font-bold">
                      {language === "es" ? "¡Reserva Exitosa!" : "Booking Successful!"}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-stone-500 font-light max-w-xs">
                      {language === "es" 
                        ? "Tu reserva ficticia ha quedado registrada. El estado en base de datos ha cambiado a OCUPADO."
                        : "Your mock booking has been saved. Database status updated to OCCUPIED."}
                    </p>
                    <button
                      onClick={() => setBookingState("idle")}
                      className="mt-4 px-4 py-1.5 border border-stone-200 hover:bg-stone-100 rounded text-[10px] text-stone-600 font-semibold"
                    >
                      {language === "es" ? "Aceptar" : "Close"}
                    </button>
                  </motion.div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="w-full bg-stone-900 border-t border-stone-800 text-stone-400 py-12 px-6 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/Favicon.svg" alt="Nexus Logo" className="w-5 h-5 object-contain" />
            <span className="font-serif text-sm tracking-widest text-white">Absolute Nexus</span>
          </div>
          <p className="font-light">
            {t("footer_text", "© 2026 Ecosistema Corporativo Absolute Nexus - Módulo de Gestión Hotelera.")}
          </p>
        </div>
      </footer>

      {/* FIXED BOTTOM MOBILE BOOKING BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-stone-900 border-t border-stone-800 py-3 px-4 flex sm:hidden items-center justify-between z-40">
        <div>
          <span className="text-[10px] text-stone-400 uppercase tracking-widest">{language === "es" ? "Desde" : "From"}</span>
          <p className="text-white text-sm font-bold">$80 USD / {language === "es" ? "noche" : "night"}</p>
        </div>
        <a
          href="#map"
          className="px-4 py-2 bg-[#B59410] hover:bg-[#A3820F] text-white text-xs font-bold rounded-lg shadow-lg"
        >
          {language === "es" ? "Ver Plano" : "View Map"}
        </a>
      </div>

    </div>
  );
}
