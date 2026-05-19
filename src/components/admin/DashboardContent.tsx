"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Scissors,
    Image as ImageIcon,
    Settings,
    LayoutDashboard,
    CalendarCheck,
    DollarSign,
    Coins,
    TrendingUp,
    Activity,
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
        monthlyIncome: { month: string; income: number; height: string }[];
        appointmentTrend: { day: string; count: number; height: string }[];
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

    const monthlyIncome = stats.monthlyIncome || [];
    const appointmentTrend = stats.appointmentTrend || [];

    const maxIncomeVal = Math.max(...monthlyIncome.map(m => m.income), 0);
    const maxTrendVal = Math.max(...appointmentTrend.map(d => d.count), 0);

    // Dynamic stylesheet generation to avoid inline styles and resolve linting errors
    const dynamicStyles = `
        ${monthlyIncome.map((bar, i) => `
            .dynamic-bar-h-${i} { height: ${bar.height || "0%"}; }
        `).join('\n')}
        ${appointmentTrend.map((point, i) => `
            .dynamic-point-b-${i} { bottom: ${point.height || "0%"}; }
        `).join('\n')}
    `;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 pb-6 bg-transparent text-white"
        >
            <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    variants={item}
                    icon={CalendarCheck}
                    title="Citas Pendientes"
                    value={stats.inquiries}
                    label="Solicitudes nuevas en espera"
                    color="primary"
                    href="/admin/inquiries"
                />
                <StatCard
                    variants={item}
                    icon={Scissors}
                    title="Servicios Activos"
                    value={stats.services}
                    label="Paquetes disponibles en catálogo"
                    color="slate"
                    href="/admin/services"
                />
                <StatCard
                    variants={item}
                    icon={ImageIcon}
                    title="Galería Grooming"
                    value={stats.gallery}
                    label="Fotos y trabajos multimedia"
                    color="slate"
                    href="/admin/gallery"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Telemetry Charts - Apple/Linear Style Side-by-Side to optimize vertical space */}
                <motion.div variants={item} className="lg:col-span-2 space-y-6">
                    <Card className="border-[#3A3A3A] shadow-xl bg-[#1A1A1A] rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-[#3A3A3A]/50 flex flex-row items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Activity className="h-4.5 w-4.5 text-[#7C3AED]" />
                                <h3 className="font-black text-xs uppercase tracking-wider text-white">Telemetría del Negocio</h3>
                            </div>
                            <span className="flex items-center gap-1.5 text-[9px] text-[#7C3AED] font-black bg-[#7C3AED]/10 border border-[#7C3AED]/25 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                                EN TIEMPO REAL
                            </span>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Bar Chart: Monthly Income */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <TrendingUp className="h-4 w-4 text-[#2ECC71]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Mensuales ($)</span>
                                        </div>
                                        <span className="text-xs font-black text-[#7C3AED]">${maxIncomeVal.toLocaleString()} Max</span>
                                    </div>
                                    <div className="h-32 flex items-end justify-between gap-2.5 pt-4 border-b border-[#3A3A3A]/50 px-1">
                                        {monthlyIncome.map((bar, i) => (
                                            <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                                <div className="w-full bg-[#252525] rounded-t-lg h-full flex items-end relative overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "w-full bg-[#7C3AED] rounded-t-lg transition-all duration-500 group-hover:opacity-90 relative",
                                                            `dynamic-bar-h-${i}`
                                                        )}
                                                    >
                                                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                                    </div>
                                                    {/* Tooltip */}
                                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#252525] text-white text-[9px] px-2 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-black border border-[#3A3A3A] shrink-0 z-10">
                                                        ${bar.income}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{bar.month}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Line Chart: Booking Fluctuation */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <CalendarCheck className="h-4 w-4 text-[#7C3AED]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluctuación de Citas Semanal</span>
                                        </div>
                                        <span className="text-xs font-black text-[#7C3AED]">{maxTrendVal} Citas Max</span>
                                    </div>
                                    <div className="h-32 flex items-end justify-between gap-2.5 pt-4 border-b border-[#3A3A3A]/50 px-1">
                                        {appointmentTrend.map((point, i) => (
                                            <div key={point.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                                <div className="w-full h-full flex flex-col justify-end items-center relative">
                                                    {/* Visual grid line */}
                                                    <div className="absolute inset-y-0 w-px bg-[#252525] left-1/2 -translate-x-1/2 border-dashed" />
                                                    {/* Stylized dot */}
                                                    <div 
                                                        className={cn(
                                                            "absolute h-3 w-3 rounded-full bg-[#7C3AED] border-2 border-[#1A1A1A] z-10 transition-all duration-300 group-hover:scale-125 shadow-[0_0_8px_rgba(124,58,237,0.4)]",
                                                            `dynamic-point-b-${i}`
                                                        )}
                                                    >
                                                        {/* Pulse Ring for high performance emphasis */}
                                                        <span className="absolute -inset-1 rounded-full bg-[#7C3AED]/30 animate-ping pointer-events-none" />
                                                    </div>
                                                    {/* Tooltip */}
                                                    <span className="absolute -top-3 bg-[#252525] text-white text-[9px] px-2 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-black border border-[#3A3A3A] shrink-0 z-20">
                                                        {point.count}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{point.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compact Banner Section - Apple Dark Theme */}
                    <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-5 flex flex-col justify-center text-white relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 blur-[80px] -mr-32 -mt-32" />
                        <h3 className="text-lg font-black tracking-tight mb-1 relative z-10 text-white">Gestión de la Plataforma</h3>
                        <p className="text-slate-400 text-xs max-w-lg font-bold relative z-10 leading-relaxed">
                            Bienvenido al panel administrativo premium de GroomingPet. Gestiona los servicios de spa, edita cupones y revisa las métricas operativas al instante.
                        </p>
                        <div className="mt-4 relative z-10 flex flex-col sm:flex-row flex-wrap gap-3">
                            <Link href="/admin/config" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto rounded-xl px-4 h-9.5 font-black bg-[#252525] text-white border border-[#3A3A3A] hover:bg-[#2D2D2D] hover:text-white cursor-pointer text-[10px] uppercase tracking-wider">
                                    <Settings className="mr-1.5 h-3.5 w-3.5" /> Configuración Global
                                </Button>
                            </Link>
                            <Link href="/admin/finanzas" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto rounded-xl px-4 h-9.5 font-black bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 cursor-pointer text-[10px] uppercase tracking-wider">
                                    <DollarSign className="mr-1.5 h-3.5 w-3.5" /> Registro de Finanzas
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* System & Finance Status */}
                <motion.div variants={item} className="space-y-6">
                    {/* Finance Summary Card */}
                    <Card className="border-[#3A3A3A] shadow-xl bg-[#1A1A1A] rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-[#3A3A3A]/50 flex flex-row items-center justify-between">
                            <div className="flex items-center space-x-2 text-white">
                                <Coins className="h-4 w-4 text-[#2ECC71]" />
                                <h4 className="font-black text-xs uppercase tracking-wider">Caja y Finanzas</h4>
                            </div>
                            <Link href="/admin/finanzas" className="text-[10px] font-black text-[#7C3AED] hover:underline uppercase tracking-wider">
                                Gestionar
                            </Link>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Balance Neto</span>
                                    <span className={cn(
                                        "font-black text-sm",
                                        (stats.netBalance ?? 0) >= 0 ? "text-[#2ECC71]" : "text-rose-500"
                                    )}>
                                        ${(stats.netBalance ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Ingresos Totales</span>
                                    <span className="text-white font-black text-sm">
                                        ${(stats.totalEarnings ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Status Card */}
                    <Card className="border-[#3A3A3A] shadow-xl bg-[#1A1A1A] rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 border-b border-[#3A3A3A]/50">
                            <div className="flex items-center space-x-2 text-white">
                                <LayoutDashboard className="h-4 w-4 text-[#7C3AED]" />
                                <h4 className="font-black text-xs uppercase tracking-wider">Estado del Sistema</h4>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Base de Datos</span>
                                    <span className="flex items-center gap-1.5 text-[#2ECC71] font-black text-[10px] tracking-widest uppercase">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71] animate-pulse" />
                                        ACTIVO
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Almacenamiento</span>
                                    <span className="text-white font-black text-xs">Supabase Storage</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Versión</span>
                                    <span className="text-slate-500 font-mono text-xs italic">v2.0.2-sleek</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: number | string;
    label: string;
    color: "primary" | "slate";
    variants?: any;
    href?: string;
}

function StatCard({ icon: Icon, title, value, label, color, variants, href }: StatCardProps) {
    const content = (
        <Card className="group border-[#3A3A3A] shadow-xl hover:border-[#7C3AED]/40 transition-all duration-300 bg-[#1A1A1A] rounded-2xl overflow-hidden h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-500">{title}</CardTitle>
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors border border-transparent",
                    color === "primary" 
                        ? "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/25" 
                        : "bg-[#252525] text-slate-400 border-[#3A3A3A]"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="text-4xl font-black text-white tracking-tight">
                    {value}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
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
