"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Scissors,
    Image as ImageIcon,
    Settings,
    LogOut,
    Globe,
    ChevronRight,
    Sparkles,
    CalendarCheck,
    Ticket,
    Users,
    DollarSign,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";

const menuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Citas", href: "/admin/inquiries", icon: CalendarCheck },
    { name: "Servicios", href: "/admin/services", icon: Scissors },
    { name: "Galería", href: "/admin/gallery", icon: ImageIcon },
    { name: "Transformaciones", href: "/admin/transformaciones", icon: Sparkles },
    { name: "Cupones", href: "/admin/cupones", icon: Ticket },
    { name: "Finanzas", href: "/admin/finanzas", icon: DollarSign },
    { name: "Usuarios", href: "/admin/users", icon: Users },
    { name: "Configuración", href: "/admin/config", icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const locale = useLocale();

    const handleSignOut = async () => {
        try {
            await signOut({ redirect: false });
        } catch (error) {
            console.error("Logout error:", error);
        }
        window.location.href = `/${locale}/login-admin`;
    };

    useEffect(() => {
        // Enforce dark mode as the ONLY permanent theme for the premium admin panel
        document.documentElement.classList.add("dark");
    }, []);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#1A1A1A] border-r border-[#3A3A3A] transition-colors duration-200">
            <div className="p-6 border-b border-[#3A3A3A] flex items-center justify-between">
                <Link href="/" className="flex items-center">
                    <div className="relative h-10 w-40">
                        <Image 
                            src="/favicon.svg" 
                            alt="GroomingPet Logo" 
                            fill 
                            className="object-contain object-left dark:brightness-125 dark:hue-rotate-180"
                        />
                    </div>
                </Link>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname.includes(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group border border-transparent",
                                isActive
                                    ? "bg-[#00DDEB]/10 text-[#00DDEB] border-[#00DDEB]/20 shadow-[0_0_15px_rgba(0,221,235,0.05)]"
                                    : "text-[#E0E0E0] hover:bg-[#252525] hover:text-white"
                            )}
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className={cn("h-4.5 w-4.5", isActive ? "text-[#00DDEB]" : "text-slate-400 group-hover:text-white transition-colors")} />
                                <span className="font-semibold text-sm tracking-tight">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight className="h-3.5 w-3.5 text-[#00DDEB]/75" />}
                        </Link>
                    );
                })}
            </nav>

            {/* View Site + Logout */}
            <div className="p-4 border-t border-[#3A3A3A] space-y-1">
                <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[#E0E0E0] hover:bg-[#252525] hover:text-white transition-all duration-200"
                >
                    <Globe className="h-4.5 w-4.5 text-slate-400" />
                    <span className="font-semibold text-sm tracking-tight">Ver Sitio Público</span>
                </Link>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-200"
                >
                    <LogOut className="h-4.5 w-4.5" />
                    <span className="font-semibold text-sm tracking-tight">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar — always visible on lg+ */}
            <aside className="hidden lg:flex w-64 h-screen bg-[#1A1A1A] border-r border-[#3A3A3A] flex-col sticky top-0 transition-colors duration-200 z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Bottom Swipable Ribbon Navigation Bar */}
            <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-xl z-50">
                <div className="bg-[#1A1A1A]/95 backdrop-blur-lg border border-[#3A3A3A] rounded-2xl p-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    {menuItems.map((item) => {
                        const isActive = pathname.includes(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center px-4 py-2.5 rounded-xl transition-all duration-200 select-none cursor-pointer shrink-0 snap-start gap-1.5 border border-transparent min-w-[76px]",
                                    isActive
                                        ? "bg-[#00DDEB]/10 text-[#00DDEB] border-[#00DDEB]/25 scale-105 shadow-[0_0_15px_rgba(0,221,235,0.05)]"
                                        : "text-slate-400 hover:text-white hover:bg-[#252525]"
                                )}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                <span className="text-[10px] font-bold tracking-wider uppercase shrink-0">
                                    {item.name.substring(0, 7)}
                                </span>
                            </Link>
                        );
                    })}

                    {/* View Public Site Pill */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#252525] border border-transparent transition-all duration-200 select-none cursor-pointer shrink-0 snap-start gap-1.5 min-w-[76px]"
                    >
                        <Globe className="h-5 w-5 shrink-0" />
                        <span className="text-[10px] font-bold tracking-wider uppercase shrink-0">
                            Sitio
                        </span>
                    </a>

                    {/* LogOut Pill */}
                    <button
                        onClick={handleSignOut}
                        className="flex flex-col items-center justify-center px-4 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent transition-all duration-200 select-none cursor-pointer shrink-0 snap-start gap-1.5 min-w-[76px]"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span className="text-[10px] font-bold tracking-wider uppercase shrink-0">
                            Salir
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
}
