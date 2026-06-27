import React from "react";
import Link from "next/link";
import { Scissors, BedDouble, Shield, ChevronRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CentralPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const isEs = locale === "es";

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0F0F11] overflow-hidden px-4 py-12 select-text font-sans">
      
      {/* Background radial ambient glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#B59410]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Content Card Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-[#B59410] font-bold animate-pulse">
            <Sparkles className="w-3 h-3 text-[#B59410]" />
            <span>Absolute Nexus Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight leading-none mt-2">
            ROYAL <span className="text-[#B59410]">ABSOLUTE</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-md mt-2">
            {isEs
              ? "Bienvenido al portal corporativo central. Seleccione el servicio al cual desea ingresar."
              : "Welcome to the central corporate portal. Please select the service you wish to access."}
          </p>
        </div>

        {/* Portal Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
          
          {/* Card 1: Groomers Inc */}
          <Link
            href={`/${locale}/groomers`}
            className="group relative bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 flex flex-col justify-between gap-8 transition-all duration-300 overflow-hidden shadow-xl"
          >
            {/* Hover visual accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
            
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Groomers Inc
                </h3>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mt-2">
                  {isEs
                    ? "Estética canina premium a domicilio. Reserva de citas, perfiles clínicos de mascotas y cuidado profesional en Florida."
                    : "Premium mobile pet grooming. Book appointments, track clinical pet profiles, and professional care in Florida."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>{isEs ? "Entrar Sitio" : "Enter Site"}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 2: Hospitality (Hostal / Finca) */}
          <Link
            href={`/${locale}/hospitality`}
            className="group relative bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 flex flex-col justify-between gap-8 transition-all duration-300 overflow-hidden shadow-xl"
          >
            {/* Hover visual accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#B59410]/5 rounded-full blur-xl group-hover:bg-[#B59410]/10 transition-colors" />

            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-[#B59410]/10 border border-[#B59410]/20 text-[#B59410] rounded-xl flex items-center justify-center">
                <BedDouble className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Hospitality
                </h3>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mt-2">
                  {isEs
                    ? "Explora nuestras estancias vacacionales de lujo. Hostal Villa María y Finca María. Disponibilidad interactiva y reservas."
                    : "Explore our luxury vacation properties. Hostal Villa Maria and Finca Maria. Interactive availability plans and booking."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-[#B59410] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>{isEs ? "Entrar Sitio" : "Enter Site"}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 3: Admin Dashboard ERP */}
          <Link
            href={`/${locale}/admin`}
            className="group relative bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-6 flex flex-col justify-between gap-8 transition-all duration-300 overflow-hidden shadow-xl"
          >
            {/* Hover visual accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-xl group-hover:bg-[#7C3AED]/10 transition-colors" />

            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#A78BFA] rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Absolute Nexus ERP
                </h3>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mt-2">
                  {isEs
                    ? "Acceso exclusivo para administradores y operadores. Control total de citas, chat interno, música y telemetría de VPS."
                    : "Exclusive access for administrators and operators. Complete control over bookings, internal chat, music, and VPS telemetry."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-[#A78BFA] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>{isEs ? "Acceso Admin" : "Admin Panel"}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

        </div>

        {/* Global Footer Credits */}
        <div className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
          © 2026 Royal Absolute Corporativo • All Rights Reserved
        </div>

      </div>

    </div>
  );
}
