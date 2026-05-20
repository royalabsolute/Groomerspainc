"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Mail, Phone, Calendar, User, MessageSquare, 
    Search, Trash2, CheckCircle2, XCircle, Clock, Filter, Sparkles,
    Image as ImageIcon,
    RefreshCw,
    Ticket,
    MoreVertical,
    DollarSign,
    X
} from "lucide-react";
import { deleteInquiry, updateInquiryStatus, markInquiryAsRead, completeInquiryPayment, restoreInquiry } from "@/lib/actions/inquiries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { RegisterPaymentModal } from "./RegisterPaymentModal";

interface Inquiry {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    petDetails: string | null;
    petImageUrl: string | null;
    read: boolean;
    createdAt: Date;
    service: string | null;
    status: string;
    discountCode: string | null;
    deleted: boolean;
}

interface DiscountCode {
    id: string;
    code: string;
    discount: string | null;
}

interface AdminInquiriesClientProps {
    initialItems: Inquiry[];
    initialCodes: DiscountCode[];
}

export default function AdminInquiriesClient({ initialItems, initialCodes }: AdminInquiriesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [items, setItems] = useState<Inquiry[]>(initialItems);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [dateFilter, setDateFilter] = useState("");
    const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"PENDING" | "ACCEPTED" | "COMPLETED" | "UNPAID" | "DELETED">("PENDING");

    useEffect(() => {
        setSearchTerm(searchParams.get("search") || "");
    }, [searchParams]);

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 15000);
        return () => clearInterval(interval);
    }, [router]);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const result = await updateInquiryStatus(id, newStatus);
        if (result.success) {
            setItems(items.map(item => 
                item.id === id ? { ...item, status: newStatus, read: true } : item
            ));
            toast.success(`Cita marcada como ${newStatus}`);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await deleteInquiry(id);
        if (result.success) {
            setItems(items.map(item => item.id === id ? { ...item, deleted: true } : item));
            toast.success("Cita enviada a la papelera");
        } else {
            toast.error("Error al eliminar cita");
        }
    };

    const handleRestore = async (id: string) => {
        const result = await restoreInquiry(id);
        if (result.success) {
            setItems(items.map(item => item.id === id ? { ...item, deleted: false } : item));
            toast.success("Cita restaurada correctamente");
        } else {
            toast.error("Error al restaurar cita");
        }
    };

    const handlePayment = async (id: string, amount: number, notes: string) => {
        const result = await completeInquiryPayment(id, amount, notes);
        if (result.success) {
            setItems(items.map(item => 
                item.id === id ? { ...item, status: 'COMPLETED', read: true } : item
            ));
            toast.success("Pago registrado y cita finalizada");
        } else {
            toast.error("Error al registrar pago");
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.service?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        
        const matchesDate = !dateFilter || new Date(item.createdAt).toISOString().split('T')[0] === dateFilter;
        
        if (statusFilter === "DELETED") {
            return matchesSearch && matchesDate && item.deleted;
        } else {
            return matchesSearch && matchesDate && !item.deleted && item.status === statusFilter;
        }
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Completada / Pagada';
            case 'ACCEPTED': return 'Aceptada (En curso)';
            case 'REJECTED': return 'Rechazada';
            case 'PENDING': return 'Pendiente';
            case 'UNPAID': return 'No Pagada';
            default: return status;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'ACCEPTED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'UNPAID': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getBasePrice = (serviceName: string | null) => {
        if (!serviceName) return 30;
        const s = serviceName.toLowerCase();
        if (s.includes("corte")) return 10;
        if (s.includes("dental") || s.includes("limpieza")) return 20;
        return 30; // default base price
    };

    const calculateDiscount = (discountCodeStr: string | null, basePrice: number) => {
        if (!discountCodeStr) return 0;
        const codeRecord = initialCodes.find(c => c.code.toLowerCase() === discountCodeStr.toLowerCase());
        if (!codeRecord || !codeRecord.discount) return 0;
        
        const discStr = codeRecord.discount.trim();
        if (discStr.endsWith("%")) {
            const percentage = parseFloat(discStr.replace("%", ""));
            if (isNaN(percentage)) return 0;
            return (basePrice * percentage) / 100;
        } else {
            const amount = parseFloat(discStr.replace("$", ""));
            if (isNaN(amount)) return 0;
            return amount;
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Gestión de Citas"
                    subtitle="Administra las solicitudes y mensajes entrantes"
                    action={
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl border border-[#7C3AED]/20 text-[10px] font-bold uppercase tracking-wider">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                            Live
                        </div>
                    }
                />

                {/* Search and Filters */}
                <Card className="border-[#3A3A3A] shadow-lg bg-[#1A1A1A] rounded-2xl">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Buscar Solicitud</label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input 
                                    placeholder="Nombre, email o servicio..." 
                                    className="pl-10 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Buscar Solicitud"
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-48 space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Filtrar por Fecha</label>
                            <Input 
                                type="date" 
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                aria-label="Filtrar por Fecha"
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            className="h-11 rounded-xl border-[#3A3A3A] hover:bg-[#252525] hover:text-white font-bold text-slate-300 w-full sm:w-auto px-6 cursor-pointer" 
                            onClick={() => { setSearchTerm(""); setDateFilter(""); }}
                        >
                            Limpiar
                        </Button>
                    </CardContent>
                </Card>

                {/* Stylized Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl">
                    {[
                        { id: "PENDING", label: "Pendientes", icon: Clock },
                        { id: "ACCEPTED", label: "En Curso (Aceptadas)", icon: Calendar },
                        { id: "COMPLETED", label: "Finalizadas (Listas)", icon: CheckCircle2 },
                        { id: "UNPAID", label: "No Pagadas", icon: DollarSign },
                        { id: "DELETED", label: "Eliminadas (Historial)", icon: Trash2 },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                                    isActive
                                        ? "bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.25)]"
                                        : "text-slate-400 hover:text-white hover:bg-[#252525]"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Grid of Dark Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredItems.length === 0 ? (
                        <div className="md:col-span-2 bg-[#1A1A1A] border border-[#3A3A3A] border-dashed py-24 flex flex-col items-center rounded-2xl shadow-xl">
                            <Mail className="h-12 w-12 text-[#3A3A3A] mb-4" />
                            <p className="font-bold text-white">No se encontraron registros</p>
                            <p className="text-sm text-slate-500 mt-1">Prueba ajustando los filtros de búsqueda o cambia de pestaña.</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const basePrice = getBasePrice(item.service);
                            const discountApplied = calculateDiscount(item.discountCode, basePrice);
                            const netEarnings = basePrice - discountApplied;

                            return (
                                <div 
                                    key={item.id} 
                                    className={cn(
                                        "group bg-[#1A1A1A] rounded-2xl border border-[#3A3A3A] hover:border-[#7C3AED]/40 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative",
                                    )}
                                >
                                    <div className="p-6 space-y-6">
                                        {/* Widget Header Info */}
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#7C3AED]/15 text-[#7C3AED] rounded-md border border-[#7C3AED]/25">
                                                        {item.service || "General"}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                                        getStatusStyles(item.status)
                                                    )}>
                                                        {getStatusLabel(item.status)}
                                                    </span>
                                                </div>
                                                <h3 className="font-black text-white text-lg tracking-tight truncate group-hover:text-[#7C3AED] transition-colors mt-2">{item.name}</h3>
                                            </div>

                                            {/* Pet Image or Thumbnail with Lightbox click trigger */}
                                            {item.petImageUrl ? (
                                                <div 
                                                    onClick={() => item.petImageUrl && setActiveLightboxUrl(item.petImageUrl)}
                                                    title="Click para ver pantalla completa"
                                                    className="relative h-16 w-16 rounded-xl overflow-hidden bg-[#252525] border border-[#3A3A3A] shrink-0 group-hover:scale-105 transition-transform duration-300 cursor-pointer shadow-md"
                                                >
                                                    <Image 
                                                        src={item.petImageUrl} 
                                                        alt="Pet Image" 
                                                        fill 
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-16 rounded-xl bg-[#252525] border border-[#3A3A3A] flex items-center justify-center text-slate-500 shrink-0">
                                                    <ImageIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact Detail widgets */}
                                        <div className="bg-[#252525]/60 border border-[#3A3A3A] rounded-xl p-4 space-y-2">
                                            <div className="flex items-center space-x-3 text-xs">
                                                <Mail className="h-3.5 w-3.5 text-[#7C3AED]/70" />
                                                <span className="text-slate-300 font-bold truncate">{item.email}</span>
                                            </div>
                                            {item.phone && (
                                                <div className="flex items-center space-x-3 text-xs">
                                                    <Phone className="h-3.5 w-3.5 text-[#7C3AED]/70" />
                                                    <span className="text-slate-300 font-bold">{item.phone}</span>
                                                </div>
                                            )}
                                            {item.petDetails && (
                                                <div className="flex items-center space-x-3 text-xs pt-1 border-t border-[#3A3A3A]/50">
                                                    <User className="h-3.5 w-3.5 text-[#7C3AED]/70" />
                                                    <span className="text-slate-400 italic font-semibold truncate">Mascota: {item.petDetails}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Message bubble */}
                                        <div className="space-y-1.5">
                                            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Notas / Mensaje</h4>
                                            <p className="text-xs text-slate-300 font-semibold bg-[#252525] border border-[#3A3A3A] rounded-xl p-3 leading-relaxed italic">
                                                "{item.message}"
                                            </p>
                                        </div>

                                        {/* Financial Breakdowns */}
                                        <div className="grid grid-cols-3 gap-2 bg-[#252525] border border-[#3A3A3A] rounded-xl p-3 text-center">
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Base</span>
                                                <span className="text-xs font-black text-slate-300">${basePrice.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Descuento</span>
                                                <span className={cn("text-xs font-black", discountApplied > 0 ? "text-[#E74C3C]" : "text-slate-500")}>
                                                    -${discountApplied.toFixed(2)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[8px] font-black text-[#7C3AED] uppercase tracking-widest">Ganancia</span>
                                                <span className="text-xs font-black text-[#2ECC71]">${netEarnings.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Footer */}
                                    <div className="border-t border-[#3A3A3A] bg-[#1d1d1d] px-6 py-4 flex items-center justify-between gap-4 mt-auto">
                                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-[#7C3AED]" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {item.deleted ? (
                                                <Button 
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleRestore(item.id)}
                                                    className="h-8.5 rounded-xl font-bold bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white text-xs cursor-pointer px-4 flex items-center gap-1.5"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                    Restaurar Cita
                                                </Button>
                                            ) : (
                                                <>
                                                    {item.status === 'PENDING' && (
                                                        <>
                                                            <Button 
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleStatusUpdate(item.id, 'ACCEPTED')}
                                                                className="h-8.5 rounded-xl font-bold bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white text-xs cursor-pointer px-4"
                                                            >
                                                                Aceptar
                                                            </Button>
                                                            <Button 
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                                                className="h-8.5 rounded-xl font-bold bg-red-950/40 text-red-400 border border-red-800/60 hover:bg-red-900/30 text-xs cursor-pointer px-4"
                                                            >
                                                                Rechazar
                                                            </Button>
                                                        </>
                                                    )}

                                                    {item.status === 'ACCEPTED' && (
                                                        <RegisterPaymentModal 
                                                            onConfirm={(amount, notes) => handlePayment(item.id, amount, notes)}
                                                            defaultNotes={`Servicio Pagado: ${item.service || "General"} — Cliente: ${item.name}${item.discountCode ? ` (Cupón: ${item.discountCode})` : ''}`}
                                                            trigger={
                                                                <Button 
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="h-8.5 rounded-xl font-bold bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 text-xs cursor-pointer px-4"
                                                                >
                                                                    Validar Pago
                                                                </Button>
                                                            }
                                                        />
                                                    )}

                                                    {(item.status === 'COMPLETED' || item.status === 'REJECTED') && (
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border",
                                                            item.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                                                        )}>
                                                            {item.status === 'COMPLETED' ? 'Finalizada' : 'Rechazada'}
                                                        </span>
                                                    )}

                                                    <ConfirmDeleteModal 
                                                        onConfirm={() => handleDelete(item.id)}
                                                        trigger={
                                                            <Button 
                                                                title="Eliminar registro"
                                                                aria-label="Eliminar registro"
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8.5 w-8.5 p-0 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 border border-[#3A3A3A] cursor-pointer flex items-center justify-center"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Premium Lightbox Modal for pet images */}
            {activeLightboxUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer" 
                    onClick={() => setActiveLightboxUrl(null)}
                >
                    <div 
                        className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setActiveLightboxUrl(null)}
                            className="absolute -top-12 right-0 z-50 h-10 w-10 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Cerrar Imagen"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#3A3A3A] bg-[#1A1A1A] flex items-center justify-center">
                            <Image 
                                src={activeLightboxUrl} 
                                alt="Mascota en tamaño completo" 
                                fill 
                                unoptimized
                                className="object-contain" 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
