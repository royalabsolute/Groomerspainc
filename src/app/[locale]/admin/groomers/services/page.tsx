import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Scissors, Bath, Sparkles, Droplets, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import db from "@/lib/db";
import { Link } from "@/navigation";
import ServiceActions from "@/components/admin/ServiceActions";

export const revalidate = 0;

export default async function AdminServicesPage() {
    const servicesData = await (db as any).serviceItem.findMany({
        orderBy: { category: 'asc' }
    });

    const services = servicesData.map((s: any) => JSON.parse(JSON.stringify(s)));

    const categories = {
        MAIN_GROOMING: {
            title: "Servicios Principales (Grooming & Baños)",
            icon: Bath,
            color: "text-[#7C3AED]",
            items: services.filter((s: any) => s.category === "MAIN_GROOMING")
        },
        ADDON_TREATMENT: {
            title: "Tratamientos Adicionales (Add-ons)",
            icon: Sparkles,
            color: "text-amber-500",
            items: services.filter((s: any) => s.category === "ADDON_TREATMENT")
        },
        SPECIAL_SHAMPOO: {
            title: "Champús Medicados & Especiales",
            icon: Droplets,
            color: "text-sky-500",
            items: services.filter((s: any) => s.category === "SPECIAL_SHAMPOO")
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4 pb-16">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminHeader
                    title="Gestión de Servicios (PostgreSQL)"
                    subtitle="Administra y categoriza dinámicamente tus servicios del cotizador público"
                    action={
                        <Link href="/admin/services/new">
                            <Button className="rounded-xl bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 font-black h-11 px-6 cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                            </Button>
                        </Link>
                    }
                />

                {services.length === 0 ? (
                    <div className="border border-dashed border-[#3A3A3A] bg-[#1A1A1A] py-24 flex flex-col items-center rounded-2xl shadow-xl">
                        <div className="h-16 w-16 bg-[#252525] border border-[#3A3A3A] rounded-full flex items-center justify-center mb-4">
                            <Scissors className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">No hay servicios registrados</h3>
                        <p className="text-slate-500 mt-1">Comienza creando tu primer servicio dinámico.</p>
                        <Link href="/admin/services/new" className="mt-6">
                            <Button variant="outline" className="rounded-xl border-[#3A3A3A] hover:bg-[#252525] hover:text-white text-slate-300 font-bold">
                                Crear primer servicio
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(categories).map(([key, cat]) => {
                            const CatIcon = cat.icon;
                            if (cat.items.length === 0) return null;

                            return (
                                <div key={key} className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-[#2D2D2D] pb-2">
                                        <CatIcon className={`h-5 w-5 ${cat.color}`} />
                                        <h2 className="text-sm font-black uppercase text-white tracking-widest">{cat.title}</h2>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#252525] border border-[#3A3A3A] text-slate-400">
                                            {cat.items.length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {cat.items.map((service: any) => {
                                            return (
                                                <Card key={service.id} className="group bg-[#1A1A1A] border-[#3A3A3A] hover:border-[#7C3AED]/40 transition-all duration-300 rounded-2xl overflow-hidden shadow-xl">
                                                    <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                                <div className="h-9 w-9 bg-white text-neutral-900 rounded-xl flex items-center justify-center shadow-md shrink-0">
                                                                    <CatIcon className="h-5 w-5" />
                                                                </div>
                                                                <ServiceActions id={service.id} active={service.isActive} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h3 className="text-sm sm:text-base font-black text-white truncate" title={service.nameEs}>
                                                                    {service.nameEs}
                                                                </h3>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                                    EN: {service.nameEn}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t border-[#3A3A3A]/60 flex justify-between items-center gap-1">
                                                            <span className="text-lg font-black text-[#2ECC71] tracking-tight">
                                                                ${Number(service.basePrice || 0).toFixed(2)}
                                                            </span>
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                                                                PRECIO BASE
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
