"use client";

import { useState, useEffect } from "react";
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
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 pb-6 bg-transparent text-white"
        >
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
                {/* Telemetry Charts - Modern Recharts side by side */}
                <motion.div variants={item} className="lg:col-span-2 space-y-6">
                    <Card className="border-[#3A3A3A] shadow-xl bg-[#1A1A1A] rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-[#3A3A3A]/50 flex flex-row items-center justify-between select-none">
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
                                    <div className="flex justify-between items-center select-none">
                                        <div className="flex items-center space-x-2">
                                            <TrendingUp className="h-4 w-4 text-[#2ECC71]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Mensuales ($)</span>
                                        </div>
                                        <span className="text-xs font-black text-[#7C3AED]">${maxIncomeVal.toLocaleString()} Max</span>
                                    </div>
                                    <div className="h-44 w-full pt-4 border-b border-[#3A3A3A]/20">
                                        {mounted ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={monthlyIncome}>
                                                    <XAxis 
                                                        dataKey="month" 
                                                        stroke="#64748B" 
                                                        fontSize={9} 
                                                        tickLine={false} 
                                                        axisLine={false} 
                                                    />
                                                    <YAxis 
                                                        stroke="#64748B" 
                                                        fontSize={9} 
                                                        tickLine={false} 
                                                        axisLine={false} 
                                                        tickFormatter={(val) => `$${val}`}
                                                        width={35}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: '#1E1E1E', 
                                                            borderColor: '#3A3A3A', 
                                                            borderRadius: '12px' 
                                                        }} 
                                                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }} 
                                                        labelStyle={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }} 
                                                        formatter={(value) => [`$${value}`, 'Ingreso']}
                                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                    />
                                                    <Bar 
                                                        dataKey="income" 
                                                        fill="#7C3AED" 
                                                        radius={[4, 4, 0, 0]} 
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full w-full bg-[#252525]/30 animate-pulse rounded-xl" />
                                        )}
                                    </div>
                                </div>

                                {/* Line Chart: Booking Fluctuation */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center select-none">
                                        <div className="flex items-center space-x-2">
                                            <CalendarCheck className="h-4 w-4 text-[#7C3AED]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluctuación de Citas Semanal</span>
                                        </div>
                                        <span className="text-xs font-black text-[#7C3AED]">{maxTrendVal} Max</span>
                                    </div>
                                    <div className="h-44 w-full pt-4 border-b border-[#3A3A3A]/20">
                                        {mounted ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={appointmentTrend}>
                                                    <CartesianGrid 
                                                        strokeDasharray="3 3" 
                                                        stroke="#222" 
                                                        vertical={false} 
                                                    />
                                                    <XAxis 
                                                        dataKey="day" 
                                                        stroke="#64748B" 
                                                        fontSize={9} 
                                                        tickLine={false} 
                                                        axisLine={false} 
                                                    />
                                                    <YAxis 
                                                        stroke="#64748B" 
                                                        fontSize={9} 
                                                        tickLine={false} 
                                                        axisLine={false} 
                                                        width={20}
                                                        allowDecimals={false}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: '#1E1E1E', 
                                                            borderColor: '#3A3A3A', 
                                                            borderRadius: '12px' 
                                                        }} 
                                                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }} 
                                                        labelStyle={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }} 
                                                        formatter={(value) => [value, 'Citas']} 
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="count" 
                                                        stroke="#10B981" 
                                                        strokeWidth={2.5} 
                                                        dot={{ r: 3, stroke: '#1A1A1A', strokeWidth: 1.5, fill: '#10B981' }} 
                                                        activeDot={{ r: 5 }} 
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full w-full bg-[#252525]/30 animate-pulse rounded-xl" />
                                        )}
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
