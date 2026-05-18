import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Scissors, Bath, Sparkles, Heart, Droplets, Award, Gift, Clock, ShieldCheck, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import db from "@/lib/db";
import { Link } from "@/navigation";
import ServiceActions from "@/components/admin/ServiceActions";

interface PageProps {
    searchParams?: Promise<{
        search?: string;
    }>;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    scissors: Scissors,
    sparkles: Sparkles,
    droplets: Droplets,
    heart: Heart,
    award: Award,
    gift: Gift,
    clock: Clock,
    shield: ShieldCheck,
};

const getServiceIcon = (title: string, iconKey?: string | null) => {
    if (iconKey && ICON_MAP[iconKey]) {
        return ICON_MAP[iconKey];
    }
    const t = title.toLowerCase();
    if (t.includes("baño") || t.includes("bath") || t.includes("completo")) return Bath;
    if (t.includes("corte") || t.includes("estilo") || t.includes("cut")) return Scissors;
    if (t.includes("dental") || t.includes("limpieza") || t.includes("teeth")) return Sparkles;
    return Heart;
};

export default async function AdminServicesPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const search = resolvedParams?.search || "";

    const servicesData = await db.service.findMany({
        orderBy: { order: 'asc' }
    });

    const services = servicesData
        .map(s => JSON.parse(JSON.stringify(s)))
        .filter(s => {
            if (!search) return true;
            const term = search.toLowerCase();
            return (
                (s.titleEs?.toLowerCase() || "").includes(term) ||
                (s.titleEn?.toLowerCase() || "").includes(term) ||
                (s.descEs?.toLowerCase() || "").includes(term) ||
                (s.descEn?.toLowerCase() || "").includes(term)
            );
        });

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Gestión de Servicios"
                    subtitle="Administra los paquetes de grooming que ofreces"
                    action={
                        <Link href="/admin/services/new">
                            <Button className="rounded-xl bg-[#00DDEB] text-black hover:bg-[#00DDEB]/90 font-black h-11 px-6 cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                            </Button>
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.length === 0 ? (
                        <div className="col-span-full">
                            <div className="border border-dashed border-[#3A3A3A] bg-[#1A1A1A] py-24 flex flex-col items-center rounded-2xl shadow-xl">
                                <div className="h-16 w-16 bg-[#252525] border border-[#3A3A3A] rounded-full flex items-center justify-center mb-4">
                                    <Scissors className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">No hay servicios registrados</h3>
                                <p className="text-slate-500 mt-1">Comienza creando tu primer paquete.</p>
                                <Link href="/admin/services/new" className="mt-6">
                                    <Button variant="outline" className="rounded-xl border-[#3A3A3A] hover:bg-[#252525] hover:text-white text-slate-300 font-bold">
                                        Crear primer servicio
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        services.map((service) => {
                            const Icon = getServiceIcon(service.titleEs, service.icon);
                            return (
                                <Card key={service.id} className="group bg-[#1A1A1A] border-[#3A3A3A] hover:border-[#00DDEB]/40 transition-all duration-300 rounded-2xl overflow-hidden shadow-xl">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-6 gap-2">
                                            <div className="h-10 w-10 bg-[#252525] border border-[#3A3A3A] rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#00DDEB] group-hover:scale-105 transition-all duration-300 shrink-0">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <ServiceActions id={service.id} active={service.active} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-base sm:text-lg font-black text-white truncate group-hover:text-[#00DDEB] transition-colors" title={service.titleEs}>
                                                {service.titleEs}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 h-10 font-medium leading-relaxed">
                                                {service.descEs}
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-[#3A3A3A] flex justify-between items-center gap-1">
                                            <span className="text-xl sm:text-2xl font-black text-[#2ECC71] tracking-tight">
                                                ${Number(service.price || 0).toFixed(2)}
                                            </span>
                                            <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                                                PRECIO BASE
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
