import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Plus, Scissors } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import db from "@/lib/db";
import { Link } from "@/navigation";
import ServiceActions from "@/components/admin/ServiceActions";

export default async function AdminServicesPage() {
    const servicesData = await db.service.findMany({
        orderBy: { order: 'asc' }
    });

    const services = servicesData.map(s => JSON.parse(JSON.stringify(s)));

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Gestión de Servicios"
                    subtitle="Administra los paquetes de grooming que ofreces"
                    action={
                        <Link href="/admin/services/new">
                            <Button className="rounded-lg shadow-sm h-11 px-6 font-semibold">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                            </Button>
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.length === 0 ? (
                        <div className="col-span-full">
                            <div className="border-2 border-dashed border-slate-200 bg-white py-24 flex flex-col items-center rounded-xl">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Scissors className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No hay servicios registrados</h3>
                                <p className="text-slate-500 mt-1">Comienza creando tu primer paquete.</p>
                                <Link href="/admin/services/new" className="mt-6">
                                    <Button variant="outline" className="rounded-lg border-slate-200">
                                        Crear primer servicio
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        services.map((service) => (
                            <Card key={service.id} className="group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-100">
                                            <Scissors className="h-5 w-5" />
                                        </div>
                                        <ServiceActions id={service.id} active={service.active} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-lg font-bold text-slate-900 truncate">{service.titleEs}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 h-10 font-medium">{service.descEs}</p>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-2xl font-bold text-slate-900 tracking-tight">${Number(service.price).toFixed(2)}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">PRECIO BASE</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
