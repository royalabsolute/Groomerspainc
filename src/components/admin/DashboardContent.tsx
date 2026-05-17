"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Scissors,
    Image as ImageIcon,
    MessageSquare,
    Users,
    Plus,
    ArrowRight,
    ExternalLink,
    Settings,
    LayoutDashboard,
    CalendarCheck,
    DollarSign,
    Coins,
} from "lucide-react";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
    stats: {
        services: number;
        gallery: number;
        inquiries: number;
        netBalance: number;
        totalEarnings: number;
    };
}

export default function DashboardContent({ stats }: DashboardContentProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { y: 10, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    variants={item}
                    icon={CalendarCheck}
                    title="Citas Pendientes"
                    value={stats.inquiries}
                    label="Solicitudes nuevas"
                    color="primary"
                    href="/admin/inquiries"
                />
                <StatCard
                    variants={item}
                    icon={Scissors}
                    title="Servicios"
                    value={stats.services}
                    label="Paquetes activos"
                    color="slate"
                    href="/admin/services"
                />
                <StatCard
                    variants={item}
                    icon={ImageIcon}
                    title="Galería"
                    value={stats.gallery}
                    label="Elementos visuales"
                    color="slate"
                    href="/admin/gallery"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Banner Section */}
                <motion.div variants={item} className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 h-full flex flex-col justify-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                        <h3 className="text-3xl font-bold tracking-tight mb-4 relative z-10">Gestión de Plataforma</h3>
                        <p className="text-slate-400 text-lg max-w-md font-medium relative z-10">
                            Bienvenido al panel administrativo. Aquí puedes gestionar citas, servicios y el contenido visual de GroomingPet.
                        </p>
                        <div className="mt-8 relative z-10 flex flex-wrap gap-4">
                            <Link href="/admin/config">
                                <Button className="rounded-lg px-6 h-11 font-semibold bg-white text-slate-900 hover:bg-slate-100 cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" /> Configuración Global
                                </Button>
                            </Link>
                            <Link href="/admin/finanzas">
                                <Button className="rounded-lg px-6 h-11 font-semibold bg-primary text-white hover:bg-primary/95 cursor-pointer">
                                    <DollarSign className="mr-2 h-4 w-4" /> Registro de Finanzas
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* System & Finance Status */}
                <motion.div variants={item} className="space-y-6">
                    {/* Finance Summary Card */}
                    <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between">
                            <div className="flex items-center space-x-2 text-slate-600">
                                <Coins className="h-4 w-4 text-emerald-500" />
                                <h4 className="font-semibold text-xs uppercase tracking-wider">Caja y Finanzas</h4>
                            </div>
                            <Link href="/admin/finanzas" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                                Gestionar
                            </Link>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Balance Neto</span>
                                    <span className={cn(
                                        "font-bold text-sm",
                                        (stats.netBalance ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        ${(stats.netBalance ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Ingresos Totales</span>
                                    <span className="text-slate-900 font-bold text-sm">
                                        ${(stats.totalEarnings ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Status Card */}
                    <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex items-center space-x-2 text-slate-600">
                                <LayoutDashboard className="h-4 w-4" />
                                <h4 className="font-semibold text-xs uppercase tracking-wider">Estado del Sistema</h4>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Servidor de Datos</span>
                                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        ACTIVO
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Almacenamiento</span>
                                    <span className="text-slate-900 font-semibold text-xs">Local / Supabase</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Versión</span>
                                    <span className="text-slate-400 font-mono text-xs italic">v1.2.5-stable</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

function StatCard({ icon: Icon, title, value, label, color, variants, href }: any) {
    const content = (
        <Card className="group border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white rounded-2xl overflow-hidden h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</CardTitle>
                <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                    color === "primary" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">
                    {value}
                </div>
                <p className="text-xs font-medium text-slate-400 mt-1">
                    {label}
                </p>
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <motion.div variants={variants}>
                <Link href={href}>{content}</Link>
            </motion.div>
        );
    }

    return <motion.div variants={variants}>{content}</motion.div>;
}
