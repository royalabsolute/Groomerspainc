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
    Menu,
    X,
    Globe,
    ChevronRight,
    Sparkles,
    CalendarCheck,
    Ticket,
    Users,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";

const menuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Citas", href: "/admin/inquiries", icon: CalendarCheck },
    { name: "Servicios", href: "/admin/services", icon: Scissors },
    { name: "Galería", href: "/admin/gallery", icon: ImageIcon },
    { name: "Transformaciones", href: "/admin/transformaciones", icon: Sparkles },
    { name: "Cupones", href: "/admin/cupones", icon: Ticket },
    { name: "Usuarios", href: "/admin/users", icon: Users },
    { name: "Configuración", href: "/admin/config", icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Prevent body scroll when open on mobile
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-8 border-b border-border/10 flex items-center justify-between">
                <Link href="/" className="flex items-center">
                    <div className="relative h-12 w-48">
                        <Image 
                            src="/assets/logo_horizontal.svg" 
                            alt="GroomingPet Logo" 
                            fill 
                            className="object-contain object-left"
                        />
                    </div>
                </Link>
                {/* Close button only on mobile */}
                <button
                    className="lg:hidden h-9 w-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    onClick={() => setMobileOpen(false)}
                    title="Cerrar menú"
                >
                    <X className="h-4 w-4" />
                </button>
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
                                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                <span className="font-semibold text-sm">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight className="h-4 w-4" />}
                        </Link>
                    );
                })}
            </nav>

            {/* View Site + Logout */}
            <div className="p-4 border-t border-border/20 space-y-1">
                <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300"
                >
                    <Globe className="h-5 w-5" />
                    <span className="font-semibold text-sm">Ver Sitio Público</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold text-sm">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar — always visible on lg+ */}
            <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-border/50 flex-col sticky top-0">
                <SidebarContent />
            </aside>

            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/10 flex items-center justify-between px-6 h-16 shadow-xs">
                <Link href="/" className="flex items-center">
                    <div className="relative h-8 w-36">
                        <Image 
                            src="/assets/logo_horizontal.svg" 
                            alt="GroomingPet Logo" 
                            fill 
                            className="object-contain object-left"
                        />
                    </div>
                </Link>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            <div
                className={cn(
                    "lg:hidden fixed inset-0 z-200 transition-all duration-300",
                    mobileOpen ? "pointer-events-auto" : "pointer-events-none"
                )}
            >
                {/* Backdrop */}
                <div
                    className={cn(
                        "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
                        mobileOpen ? "opacity-100" : "opacity-0"
                    )}
                    onClick={() => setMobileOpen(false)}
                />

                {/* Drawer */}
                <div
                    className={cn(
                        "absolute top-0 left-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out",
                        mobileOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <SidebarContent />
                </div>
            </div>
        </>
    );
}
