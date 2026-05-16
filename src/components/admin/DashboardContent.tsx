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
    CalendarCheck
} from "lucide-react";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";

interface DashboardContentProps {
    stats: {
        services: number;
        gallery: number;
        inquiries: number;
    };
}

export default function DashboardContent({ stats }: DashboardContentProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10"
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
                    color="blue"
                    href="/admin/services"
                />
                <StatCard
                    variants={item}
                    icon={ImageIcon}
                    title="Galería"
                    value={stats.gallery}
                    label="Elementos visuales"
                    color="purple"
                    href="/admin/gallery"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Extra Info / Banner */}
                <motion.div variants={item} className="lg:col-span-2">
                    <Card className="border-border/40 shadow-2xl shadow-primary/5 overflow-hidden bg-primary h-full relative group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                        <CardContent className="p-12 flex flex-col justify-center h-full relative z-10 text-white">
                            <h3 className="text-4xl font-black tracking-tighter mb-4">Gestión Simplificada</h3>
                            <p className="text-white/80 text-lg max-w-md font-medium">
                                El panel se ha optimizado para que te enfoques en lo que más importa: tus servicios y tu imagen.
                            </p>
                            <div className="mt-8">
                                <Link href="/admin/config">
                                    <Button variant="secondary" className="rounded-full px-8 h-12 font-bold shadow-lg">
                                        Configuración General
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* System Status Only */}
                <motion.div variants={item} className="space-y-6">
                    <Card className="border-border/40 shadow-sm bg-muted/30">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3 text-muted-foreground mb-4">
                                <LayoutDashboard className="h-5 w-5" />
                                <h4 className="font-bold text-sm">Estado del Sistema</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span>Base de Datos</span>
                                    <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Conectado</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>Almacenamiento</span>
                                    <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Local (Activo)</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>Versión CMS</span>
                                    <span className="font-mono">v1.2.1</span>
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
    const colorMap: any = {
        blue: {
            bg: "bg-blue-500/5",
            text: "text-blue-600",
            iconBg: "bg-blue-500",
            gradient: "from-blue-500/5"
        },
        purple: {
            bg: "bg-purple-500/5",
            text: "text-purple-600",
            iconBg: "bg-purple-500",
            gradient: "from-purple-500/5"
        },
        primary: {
            bg: "bg-primary/5",
            text: "text-primary",
            iconBg: "bg-primary",
            gradient: "from-primary/5"
        }
    };

    const theme = colorMap[color] || colorMap.primary;

    const content = (
        <Card className="group relative overflow-hidden border-border/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer h-full bg-white/50 backdrop-blur-sm rounded-3xl">
            <div className={`absolute inset-0 bg-linear-to-br ${theme.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10 p-8">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">{title}</CardTitle>
                <div className={`h-12 w-12 rounded-2xl ${theme.bg} flex items-center justify-center ${theme.text} group-hover:scale-110 transition-transform duration-500 border border-border/10`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardHeader>
            <CardContent className="relative z-10 px-8 pb-8">
                <div className="text-5xl font-black mb-2 group-hover:translate-x-1 transition-transform duration-500 tracking-tighter text-foreground">
                    {value}
                </div>
                <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
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

function ActionButton({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
    return (
        <Link href={href}>
            <Button variant="secondary" className="w-full justify-start h-14 rounded-2xl group bg-white/10 border-white/5 hover:bg-white/20 text-white hover:text-white transition-all">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm tracking-tight">{label}</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
        </Link>
    );
}
