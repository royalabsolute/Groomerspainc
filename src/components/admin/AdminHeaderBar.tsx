"use client";

import { Bell, ChevronDown, CheckCircle, User, LogOut, Settings as SettingsIcon, X, Upload, Loader2, Sparkles, Key } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";
import { Link } from "@/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { updateUser } from "@/lib/actions/users";
import { uploadFile } from "@/lib/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminHeaderBarProps {
    user?: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    pendingInquiries?: any[];
}

export default function AdminHeaderBar({ user: initialUser, pendingInquiries = [] }: AdminHeaderBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, update: updateSession } = useSession();
    
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    
    // Profile Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [profileName, setProfileName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [profilePassword, setProfilePassword] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    const notificationsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Sync session data to state when modal opens
    const activeUser = session?.user || initialUser;

    const notifiedIdsRef = useRef<string[]>([]);

    // Initialize notified IDs on mount
    useEffect(() => {
        if (pendingInquiries.length > 0 && notifiedIdsRef.current.length === 0) {
            notifiedIdsRef.current = pendingInquiries.map((q: any) => q.id);
        }
    }, [pendingInquiries]);

    // Request Notification permission
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }, []);

    // Listen for new inquiries to trigger OS notifications
    useEffect(() => {
        if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
            return;
        }

        pendingInquiries.forEach((inq: any) => {
            if (!notifiedIdsRef.current.includes(inq.id)) {
                notifiedIdsRef.current.push(inq.id);
                
                new Notification("GroomingPet: Nueva Solicitud", {
                    body: `Cliente: ${inq.name} - Mascota(s): ${inq.petName || "N/A"}`,
                    icon: "/favicon.svg"
                });
            }
        });
    }, [pendingInquiries]);

    // Live global queue auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [router]);

    // Handle clicking outside to close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Open profile editor
    const openProfileModal = () => {
        setProfileName(activeUser?.name || "");
        setProfileEmail(activeUser?.email || "");
        setProfilePassword("");
        setProfileImage(activeUser?.image || "");
        setIsProfileModalOpen(true);
        setShowProfile(false);
    };

    // Handle Image Upload directly to filesystem/Supabase fallback
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Por favor selecciona una imagen de tipo visual");
            return;
        }

        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await uploadFile(formData);
            if (res.success && res.url) {
                setProfileImage(res.url);
                toast.success("Foto de perfil cargada correctamente");
            } else {
                toast.error(res.error || "Error al subir foto");
            }
        } catch {
            toast.error("Error al conectar con el servidor de subidas");
        } finally {
            setUploadingImage(false);
        }
    };

    // Save profile changes
    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileName.trim() || !profileEmail.trim()) {
            toast.error("El nombre y correo son obligatorios.");
            return;
        }

        const userId = (activeUser as any)?.id;
        if (!userId) {
            toast.error("ID de sesión no disponible.");
            return;
        }

        startTransition(async () => {
            const res = await updateUser(userId, {
                name: profileName,
                email: profileEmail,
                password: profilePassword ? profilePassword : undefined,
                image: profileImage || null
            });

            if (res.success) {
                // Update NextAuth active session context
                await updateSession({
                    name: profileName,
                    email: profileEmail,
                    image: profileImage || null
                });
                toast.success("Perfil actualizado correctamente");
                setIsProfileModalOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Error al guardar el perfil");
            }
        });
    };

    return (
        <>
            <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-[#3A3A3A] bg-[#121212]/50 backdrop-blur-md sticky top-0 z-20 w-full transition-all">
                {/* Left side empty to let dynamic data occupy space or flex end */}
                <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Panel Administrativo de Control</span>
                </div>

                {/* Right Action Icons & Profile Info */}
                <div className="flex items-center space-x-6">
                    {/* Notifications Bell Dropdown */}
                    <div className="relative" ref={notificationsRef}>
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            title="Notificaciones de Alerta"
                            aria-label="Notificaciones de Alerta"
                            className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252525] transition-all cursor-pointer"
                        >
                            <Bell className="h-4.5 w-4.5" />
                            {pendingInquiries.length > 0 && (
                                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl p-4 space-y-3 z-30 animate-in fade-in slide-in-from-top-2 duration-250">
                                <div className="flex justify-between items-center pb-2 border-b border-[#3A3A3A]">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Alertas y Solicitudes</h4>
                                    <span className="text-[9px] font-black text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/30 uppercase tracking-widest">
                                        {pendingInquiries.length} Nuevas
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {pendingInquiries.length === 0 ? (
                                        <p className="text-xs text-slate-500 py-6 text-center font-bold">No hay alertas ni pendientes.</p>
                                    ) : (
                                        pendingInquiries.map((inq: any) => (
                                            <Link 
                                                key={inq.id} 
                                                href="/admin/inquiries"
                                                onClick={() => setShowNotifications(false)}
                                                className="block p-2.5 rounded-xl hover:bg-[#252525] border border-transparent hover:border-[#3A3A3A] transition-all"
                                            >
                                                <div className="flex justify-between items-start gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] shrink-0 animate-pulse" />
                                                        <span className="text-xs font-black text-white truncate">Solicitud: {inq.name}</span>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-slate-500 shrink-0">
                                                        {new Date(inq.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#7C3AED] font-bold uppercase tracking-wider mt-0.5 ml-3">
                                                    {inq.service || "Servicio General"}
                                                </p>
                                                {inq.message && (
                                                    <p className="text-[10px] text-slate-400 truncate mt-1 italic ml-3">
                                                        "{inq.message}"
                                                    </p>
                                                )}
                                            </Link>
                                        ))
                                    )}
                                </div>
                                <div className="pt-2 border-t border-[#3A3A3A]">
                                    <Link 
                                        href="/admin/inquiries" 
                                        onClick={() => setShowNotifications(false)}
                                        className="block text-center text-[10px] font-black text-[#7C3AED] hover:underline uppercase tracking-widest"
                                    >
                                        Ver todas las solicitudes
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile dropdown */}
                    <div className="relative flex items-center" ref={profileRef}>
                        <div 
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center space-x-3 pl-4 border-l border-[#3A3A3A] cursor-pointer group select-none"
                        >
                            <div className="text-right">
                                <p className="text-xs font-bold text-white tracking-tight group-hover:text-[#7C3AED] transition-colors">{activeUser?.name || "Administrador"}</p>
                                <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest mt-0.5">ADMIN</p>
                            </div>
                            <div className="relative h-9 w-9 rounded-full overflow-hidden border border-[#3A3A3A] bg-[#252525] flex items-center justify-center text-xs font-black text-[#7C3AED] uppercase shadow-sm group-hover:border-[#7C3AED] transition-all">
                                {activeUser?.image ? (
                                    <Image
                                        src={activeUser.image}
                                        alt="User Avatar"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                ) : (
                                    (activeUser?.name ? activeUser.name.substring(0, 2) : "AD")
                                )}
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
                        </div>

                        {showProfile && (
                            <div className="absolute right-0 top-11 mt-2 w-60 bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl p-4 space-y-3 z-30 animate-in fade-in slide-in-from-top-2 duration-250">
                                <div className="pb-2 border-b border-[#3A3A3A]">
                                    <p className="text-xs font-black text-white">{activeUser?.name || "Administrador"}</p>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{activeUser?.email || "staff@groomingpet.com"}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <button 
                                        onClick={openProfileModal}
                                        className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#252525] transition-all text-xs font-semibold text-left cursor-pointer"
                                    >
                                        <User className="h-4 w-4 text-[#7C3AED]" />
                                        <span>Mi Perfil</span>
                                    </button>
                                    <Link 
                                        href="/admin/config" 
                                        onClick={() => setShowProfile(false)}
                                        className="flex items-center space-x-2.5 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#252525] transition-all text-xs font-semibold"
                                    >
                                        <SettingsIcon className="h-4 w-4 text-[#7C3AED]" />
                                        <span>Configuración Global</span>
                                    </Link>
                                    <button 
                                        onClick={() => signOut()}
                                        className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all text-xs font-semibold text-left cursor-pointer border-t border-[#3A3A3A]/40 mt-1.5 pt-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Profile Editing Dialog Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]/50">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-[#7C3AED]" />
                                <h3 className="text-base font-black text-white uppercase tracking-wider">Mi Perfil Administrativo</h3>
                            </div>
                            <button 
                                onClick={() => setIsProfileModalOpen(false)} 
                                className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#252525] text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Cerrar"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                            {/* Profile Image upload visualizer */}
                            <div className="flex flex-col items-center justify-center space-y-3 pb-2">
                                <div className="relative h-20 w-20 rounded-full border-2 border-[#7C3AED] bg-[#252525] overflow-hidden flex items-center justify-center text-xl font-black text-[#7C3AED] uppercase shadow-lg">
                                    {profileImage ? (
                                        <Image src={profileImage} alt="Preview" fill unoptimized className="object-cover" />
                                    ) : (
                                        profileName ? profileName.substring(0, 2) : "AD"
                                    )}
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 text-[#7C3AED] animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-[#7C3AED] uppercase tracking-widest px-3 py-1.5 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 rounded-xl border border-[#7C3AED]/25 cursor-pointer transition-all">
                                    <Upload className="h-3.5 w-3.5" />
                                    {uploadingImage ? "Cargando..." : "Subir Foto"}
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nombre Completo</Label>
                                <Input 
                                    value={profileName} 
                                    onChange={(e) => setProfileName(e.target.value)} 
                                    className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                    required
                                />
                            </div>

                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Correo Electrónico</Label>
                                <Input 
                                    type="email" 
                                    value={profileEmail} 
                                    onChange={(e) => setProfileEmail(e.target.value)} 
                                    className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                    required
                                />
                            </div>

                            {/* Password input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nueva Contraseña</Label>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">(Dejar en blanco para no cambiar)</span>
                                </div>
                                <div className="relative">
                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input 
                                        type="password" 
                                        value={profilePassword} 
                                        onChange={(e) => setProfilePassword(e.target.value)} 
                                        placeholder="Ej: •••••••••••"
                                        className="h-11 pl-10 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Actions buttons */}
                            <div className="flex gap-3 pt-3 border-t border-[#3A3A3A]/50">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="flex-1 rounded-xl border-[#3A3A3A] text-slate-300 bg-[#252525] hover:bg-[#2D2D2D] hover:text-white font-bold cursor-pointer"
                                    onClick={() => setIsProfileModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isPending || uploadingImage}
                                    className="flex-1 rounded-xl bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 font-black shadow-lg gap-2 cursor-pointer"
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {isPending ? "Guardando..." : "Actualizar"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export function Save(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
            <path d="M7 3v4a1 1 0 0 0 1 1h7" />
        </svg>
    )
}
