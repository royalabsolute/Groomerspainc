import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Plus, Scissors, MoreVertical, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
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
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-7xl mx-auto">
                <AdminHeader
                    title="Gestión de Servicios"
                    subtitle="Administra los paquetes de grooming que ofreces a tus clientes."
                    action={
                        <Link href="/admin/services/new">
                            <Button className="rounded-full shadow-lg shadow-primary/20 h-12 px-6">
                                <Plus className="mr-2 h-5 w-5" /> Nuevo Servicio
                            </Button>
                        </Link>
                    }
                />

                <div className="grid gap-4">
                    {services.length === 0 ? (
                        <Card className="border-dashed border-2 border-border/50 bg-transparent py-20">
                            <CardContent className="flex flex-col items-center text-center">
                                <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                    <Scissors className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-bold text-muted-foreground">No hay servicios registrados</h3>
                                <p className="text-muted-foreground max-w-sm mt-2">Comienza creando tu primer paquete de servicios para promocionarlo en la web.</p>
                                <Link href="/admin/services/new" className="mt-8">
                                    <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
                                        Crear mi primer servicio
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map((service) => (
                                <Card key={service.id} className="group overflow-hidden border-border/40 hover:shadow-xl transition-all duration-500">
                                    <div className="h-2 bg-primary w-0 group-hover:w-full transition-all duration-500" />
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <Scissors className="h-6 w-6" />
                                            </div>
                                            <ServiceActions id={service.id} active={service.active} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold truncate">{service.titleEs}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 h-10">{service.descEs}</p>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-border/20 flex justify-between items-center">
                                            <span className="text-2xl font-black text-primary">${Number(service.price).toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
