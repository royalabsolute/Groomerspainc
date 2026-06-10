import db from "@/lib/db";
import CoverageZonesClient from "./CoverageZonesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Cobertura y Zonas",
  description: "Panel logístico interactivo para habilitar códigos postales y tarifas de viaje.",
};

export const revalidate = 0;

export default async function ZonasPage() {
  const initialZones = await (db as any).serviceZone.findMany({
    orderBy: { zipCode: "asc" }
  }).catch(() => []);

  // Serialize dates for client components safety
  const serializedZones = initialZones.map((z: any) => ({
    zipCode: z.zipCode,
    name: z.name,
    distanceMiles: Number(z.distanceMiles),
    travelFee: Number(z.travelFee),
    isActive: z.isActive,
  }));

  return (
    <div className="space-y-6 text-[#E0E0E0]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border border-neutral-800 pb-6 bg-[#1A1A1A] p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
            Logística y Cobertura
          </h1>
          <p className="text-neutral-400 font-medium text-sm mt-1">
            Gestiona los códigos postales habilitados, calcula distancias y ajusta recargos de viaje desde el Punto 0 (Fort Lauderdale 33312).
          </p>
        </div>
      </div>

      <CoverageZonesClient initialZones={serializedZones} />
    </div>
  );
}
