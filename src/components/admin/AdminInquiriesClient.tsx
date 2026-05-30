"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
    Mail, Phone, Calendar, User, Search, Trash2, CheckCircle2, Clock, 
    Sparkles, Image as ImageIcon, DollarSign, X, ShieldCheck, Footprints,
    MessageSquare, Send, Award, Droplets
} from "lucide-react";
import { 
    deleteInquiry, 
    updateInquiryStatus, 
    markInquiryAsRead, 
    completeInquiryPayment, 
    saveAdminFinalPrice, 
    sendBilingualQuoteEmail 
} from "@/lib/actions/inquiries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

export interface PetProfileItem {
    id: string;
    name: string;
    breed: string;
    weight: number;
    age: string;
    rabiesVaccinated: boolean;
    rabiesRegistry: string | null;
    selectedServiceIds: string;
    petImageUrl: string | null;
    shampooId: string | null;
}

export interface InquiryItem {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    zipCode: string;
    petName: string;
    breed: string;
    petWeight: number;
    petAge: string;
    rabiesVaccinated: boolean;
    rabiesRegistry: string | null;
    selectedServiceIds: string;
    petImageUrl: string | null;
    message: string | null;
    discountCode: string | null;
    systemEstimatedPrice: number;
    finalAdminPrice: number | null;
    status: "PENDING_REVIEW" | "PRICED" | "CONFIRMED" | "COMPLETED" | "REJECTED";
    read: boolean;
    createdAt: Date;
    pets: PetProfileItem[];
}

interface ServiceItem {
    id: string;
    nameEs: string;
    nameEn: string;
    category: string;
    basePrice: number;
    isActive: boolean;
}

interface AdminInquiriesClientProps {
    initialItems: InquiryItem[];
    services: ServiceItem[];
}

export default function AdminInquiriesClient({ initialItems, services }: AdminInquiriesClientProps) {
    const router = useRouter();
    
    const [items, setItems] = useState<InquiryItem[]>(initialItems);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"PENDING_REVIEW" | "PRICED" | "CONFIRMED" | "COMPLETED" | "REJECTED">("PENDING_REVIEW");

    // Modal Details state
    const [selectedItem, setSelectedItem] = useState<InquiryItem | null>(null);
    const [finalPriceInput, setFinalPriceInput] = useState<string>("");
    const [isSavingPrice, setIsSavingPrice] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    // Live refresh every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [router]);

    const handleStatusUpdate = async (id: string, newStatus: any) => {
        const result = await updateInquiryStatus(id, newStatus);
        if (result.success) {
            setItems(items.map(item => 
                item.id === id ? { ...item, status: newStatus, read: true } : item
            ));
            toast.success(`Cotización marcada como ${newStatus}`);
            router.refresh();
        } else {
            toast.error("Error al actualizar estado");
        }
    };

    const handleDelete = async (id: string) => {
        const result = await deleteInquiry(id);
        if (result.success) {
            setItems(items.filter(item => item.id !== id));
            toast.success("Cotización eliminada correctamente");
            setSelectedItem(null);
            router.refresh();
        } else {
            toast.error("Error al eliminar cotización");
        }
    };

    const handleSavePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        
        const price = parseFloat(finalPriceInput);
        if (isNaN(price) || price < 0) {
            toast.error("Por favor ingresa un precio válido");
            return;
        }

        setIsSavingPrice(true);
        try {
            const result = await saveAdminFinalPrice(selectedItem.id, price);
            if (result.success && result.quote) {
                toast.success("Precio final guardado correctamente");
                
                // Update local state
                const updated = {
                    ...selectedItem,
                    finalAdminPrice: price,
                    status: "PRICED" as const,
                    read: true
                };
                setItems(items.map(i => i.id === selectedItem.id ? updated : i));
                setSelectedItem(updated);
                router.refresh();
            } else {
                toast.error("Error al guardar precio");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setIsSavingPrice(false);
        }
    };

    const handleDispatchEmail = async () => {
        if (!selectedItem) return;
        setIsSendingEmail(true);
        try {
            const result = await sendBilingualQuoteEmail(selectedItem.id);
            if (result.success) {
                toast.success("📧 Correo oficial bilingüe enviado al cliente");
                
                // Update status in local view to PRICED
                const updated = { ...selectedItem, status: "PRICED" as const };
                setItems(items.map(i => i.id === selectedItem.id ? updated : i));
                setSelectedItem(updated);
                router.refresh();
            } else {
                toast.error("Error al despachar correo");
            }
        } catch {
            toast.error("Error de comunicación SMTP");
        } finally {
            setIsSendingEmail(false);
        }
    };

    // Helper to generate dynamic WhatsApp bilingually
    const getWhatsAppLink = (item: InquiryItem) => {
        let cleanPhone = item.phone.replace(/[^\d]/g, "");
        if (cleanPhone.length === 10) {
            cleanPhone = "1" + cleanPhone; // Prefix standard US code
        }
        
        const price = item.finalAdminPrice || item.systemEstimatedPrice;
        
        // Dynamic dynamic service lookup
        const ids = item.selectedServiceIds.split(",").map(id => id.trim()).filter(Boolean);
        const chosen = services.filter(s => ids.includes(s.id));
        const serviceNames = chosen.map(s => s.nameEs).join(", ");
        
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groomersincpetspa.com";
        const acceptUrl = `${siteUrl}/es/quote/${item.id}/accept`;

        // Pre-written professional message
        const isEn = !!item.discountCode; // simple heuristic for demo
        const msg = isEn 
            ? `Hello ${item.name}! Your quote to pamper ${item.petName} is ready. 🐾\n\nIncluded: ${serviceNames || "Grooming"}\nOfficial Price: $${price.toFixed(2)}\n\nAccept & Book your spot here: ${acceptUrl}\n\nThank you!`
            : `¡Hola ${item.name}! El estimado para consentir a ${item.petName} está listo. 🐾\n\nIncluye: ${serviceNames || "Grooming"}\nPrecio Oficial: $${price.toFixed(2)}\n\nAcepta y Confirma tu cita aquí: ${acceptUrl}\n\n¡Gracias!`;

        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    };

    const handleOpenReviewModal = (item: InquiryItem) => {
        setSelectedItem(item);
        setFinalPriceInput(item.finalAdminPrice ? item.finalAdminPrice.toString() : item.systemEstimatedPrice.toString());
        if (!item.read) {
            markInquiryAsRead(item.id).then(() => {
                setItems(items.map(i => i.id === item.id ? { ...i, read: true } : i));
            }).catch(() => null);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.phone.includes(searchTerm) ||
            item.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.breed.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = !dateFilter || new Date(item.createdAt).toISOString().split('T')[0] === dateFilter;
        
        return matchesSearch && matchesDate && item.status === statusFilter;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'CONFIRMED': return 'bg-[#7C3AED]/15 text-[#7C3AED] border-[#7C3AED]/20';
            case 'PRICED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <AdminHeader
                    title="Gestión de Cotizaciones Móviles"
                    subtitle="Revisa solicitudes, define tarifas personalizadas y cierra citas en segundos"
                    action={
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl border border-[#7C3AED]/20 text-[10px] font-bold uppercase tracking-wider">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                            Live Queue
                        </div>
                    }
                />

                {/* Filters */}
                <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Buscar Solicitud</label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input 
                                    placeholder="Nombre, email, teléfono, mascota o raza..." 
                                    className="pl-10 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-48 space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Filtrar por Fecha</label>
                            <Input 
                                type="date" 
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED]"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            className="h-11 rounded-xl border-[#3A3A3A] hover:bg-[#252525] hover:text-white font-bold text-slate-350 w-full sm:w-auto px-6 cursor-pointer" 
                            onClick={() => { setSearchTerm(""); setDateFilter(""); }}
                        >
                            Limpiar
                        </Button>
                    </CardContent>
                </Card>

                {/* State Machine Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl">
                    {[
                        { id: "PENDING_REVIEW", label: "Nuevas (Por Revisar)", icon: Clock },
                        { id: "PRICED", label: "Cotizadas", icon: DollarSign },
                        { id: "CONFIRMED", label: "Confirmadas / Agendadas", icon: Calendar },
                        { id: "COMPLETED", label: "Completadas", icon: CheckCircle2 },
                        { id: "REJECTED", label: "Rechazadas / Historial", icon: Trash2 },
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

                {/* List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredItems.length === 0 ? (
                        <div className="md:col-span-2 bg-[#1A1A1A] border border-[#3A3A3A] border-dashed py-24 flex flex-col items-center rounded-2xl shadow-xl">
                            <Mail className="h-12 w-12 text-slate-650 mb-4" />
                            <p className="font-bold text-white">No hay cotizaciones registradas</p>
                            <p className="text-sm text-slate-500 mt-1">Prueba seleccionando otra categoría en las pestañas.</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const ids = item.selectedServiceIds.split(",").map(id => id.trim()).filter(Boolean);
                            const chosenServices = services.filter(s => ids.includes(s.id));
                            const mainGroom = chosenServices.find(s => s.category === "MAIN_GROOMING");

                            return (
                                <div 
                                    key={item.id}
                                    onClick={() => handleOpenReviewModal(item)}
                                    className={cn(
                                        "group bg-[#1A1A1A] rounded-2xl border hover:border-[#7C3AED]/40 shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer",
                                        !item.read ? "border-l-4 border-l-[#7C3AED] border-[#3A3A3A]" : "border-[#3A3A3A]"
                                    )}
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#7C3AED]/15 text-[#7C3AED] rounded-md border border-[#7C3AED]/25">
                                                        {mainGroom ? mainGroom.nameEs : "Grooming"}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                                        getStatusStyles(item.status)
                                                    )}>
                                                        {item.status === "PENDING_REVIEW" ? "Por Revisar" : item.status}
                                                    </span>
                                                </div>
                                                <h3 className="font-black text-white text-lg tracking-tight truncate group-hover:text-[#7C3AED] transition-colors mt-2">{item.name}</h3>
                                            </div>

                                            {item.petImageUrl ? (
                                                <div 
                                                    className="relative h-16 w-16 rounded-xl overflow-hidden bg-[#252525] border border-[#3A3A3A] shrink-0"
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

                                        {/* Contact Card */}
                                        <div className="bg-[#252525]/60 border border-[#3A3A3A] rounded-xl p-4 space-y-1 text-xs text-slate-300">
                                            <p className="font-bold">📧 {item.email}</p>
                                            <p className="font-bold">📞 {item.phone}</p>
                                            <p className="text-slate-400 pt-1 border-t border-[#3D3D3D] mt-1.5">📍 {item.address} (ZIP: {item.zipCode})</p>
                                        </div>

                                        {/* Pet spec */}
                                        <div className="bg-[#202020] border border-[#2D2D2D] rounded-xl p-3 flex justify-between text-xs text-slate-400">
                                            <span>🐶 <strong>{item.petName}</strong> ({item.breed})</span>
                                            <span className="text-[#F53F85] font-black">{item.petWeight} lbs</span>
                                        </div>

                                        {/* Cost */}
                                        <div className="flex justify-between items-center bg-[#252525] border border-[#3A3A3A] rounded-xl p-3">
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Estimado Inicial</span>
                                                <span className="text-sm font-black text-slate-400">${item.systemEstimatedPrice.toFixed(2)}</span>
                                            </div>
                                            {item.finalAdminPrice && (
                                                <div className="text-right">
                                                    <span className="block text-[8px] font-black text-[#2ECC71] uppercase tracking-wider">Precio Final Oficial</span>
                                                    <span className="text-sm font-black text-[#2ECC71]">${item.finalAdminPrice.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* REVIEW DETAILS DIALOG */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                {selectedItem && (() => {
                    const ids = selectedItem.selectedServiceIds.split(",").map(id => id.trim()).filter(Boolean);
                    const chosenServices = services.filter(s => ids.includes(s.id));
                    const mainGroom = chosenServices.filter(s => s.category === "MAIN_GROOMING");
                    const addonTreats = chosenServices.filter(s => s.category === "ADDON_TREATMENT");
                    const shampooTreats = chosenServices.filter(s => s.category === "SPECIAL_SHAMPOO");

                    return (
                        <DialogContent className="w-[95vw] sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-black bg-[#161616] text-white p-6 shadow-[12px_12px_0px_0px_#000] z-50">
                            <DialogHeader className="border-b border-[#3A3A3A] pb-4">
                                <DialogTitle className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                                    🔎 {selectedItem.status === "PENDING_REVIEW" ? "Revisión de Cotización" : "Detalles de Solicitud"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                    ID: {selectedItem.id}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 pt-4 text-sm text-slate-350">
                                
                                {/* 1. Owner & Address Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-[#202020] border border-[#3A3A3A] rounded-xl p-4 space-y-1.5">
                                        <h4 className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest border-b border-[#2A2A2A] pb-1.5 mb-2">👤 Cliente</h4>
                                        <p className="font-bold text-white">{selectedItem.name}</p>
                                        <p className="text-xs">✉️ {selectedItem.email}</p>
                                        <p className="text-xs">📞 {selectedItem.phone}</p>
                                    </div>
                                    <div className="bg-[#202020] border border-[#3A3A3A] rounded-xl p-4 space-y-1.5">
                                        <h4 className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest border-b border-[#2A2A2A] pb-1.5 mb-2">📍 Destino</h4>
                                        <p className="font-bold text-white">{selectedItem.address}</p>
                                        <p className="text-xs">Florida (ZIP: {selectedItem.zipCode})</p>
                                    </div>
                                </div>

                                {/* 2 & 3 & 4. Loop over each Pet in the list */}
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-[#7C3AED] uppercase tracking-widest border-b border-[#2A2A2A] pb-1.5 flex items-center gap-2">
                                        🐶 Mascotas y Servicios Solicitados ({selectedItem.pets?.length || 0})
                                    </h4>
                                    {(selectedItem.pets && selectedItem.pets.length > 0 ? selectedItem.pets : [
                                        {
                                            id: "first",
                                            name: selectedItem.petName,
                                            breed: selectedItem.breed,
                                            weight: selectedItem.petWeight,
                                            age: selectedItem.petAge,
                                            rabiesVaccinated: selectedItem.rabiesVaccinated,
                                            rabiesRegistry: selectedItem.rabiesRegistry,
                                            selectedServiceIds: selectedItem.selectedServiceIds,
                                            petImageUrl: selectedItem.petImageUrl,
                                            shampooId: null
                                        }
                                    ]).map((pet: any, idx: number) => {
                                        const petServiceIds = pet.selectedServiceIds.split(",").map((id: string) => id.trim()).filter(Boolean);
                                        const petServices = services.filter(s => petServiceIds.includes(s.id));
                                        const mainGroom = petServices.filter(s => s.category === "MAIN_GROOMING");
                                        const addonTreats = petServices.filter(s => s.category === "ADDON_TREATMENT");
                                        const shampooTreats = petServices.filter(s => s.category === "SPECIAL_SHAMPOO");

                                        return (
                                            <div key={pet.id} className="bg-[#202020] border border-[#3A3A3A] rounded-xl p-4 space-y-4">
                                                <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-2">
                                                    <span className="font-black text-xs uppercase tracking-widest text-[#7C3AED]">
                                                        🐕 Perro #{idx + 1}: {pet.name}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                                                        pet.rabiesVaccinated 
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    )}>
                                                        Rabia: {pet.rabiesVaccinated ? `Vigente (#${pet.rabiesRegistry || 'N/A'})` : 'Vencida/Faltante'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                    {/* Specs */}
                                                    <div className="space-y-2">
                                                        <div>🏷️ <span className="text-slate-500">Raza:</span> <strong className="text-white">{pet.breed}</strong></div>
                                                        <div>⚖️ <span className="text-slate-500">Peso:</span> <strong className="text-[#F53F85]">{pet.weight} lbs</strong></div>
                                                        <div>🎂 <span className="text-slate-500">Edad:</span> <strong className="text-white">{pet.age}</strong></div>
                                                        
                                                        {/* Pet services list */}
                                                        <div className="pt-2 border-t border-[#2A2A2A]/40 space-y-2 mt-2">
                                                            {mainGroom.length > 0 && (
                                                                <div>
                                                                    <span className="text-[#7C3AED] font-black uppercase text-[8px] tracking-wider block">Servicio Principal:</span>
                                                                    {mainGroom.map((s: any) => (
                                                                        <div key={s.id} className="flex justify-between text-white font-bold pl-2 mt-0.5">
                                                                            <span>• {s.nameEs} ({s.nameEn})</span>
                                                                            <span>${Number(s.basePrice).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {addonTreats.length > 0 && (
                                                                <div>
                                                                    <span className="text-amber-500 font-black uppercase text-[8px] tracking-wider block">Add-ons:</span>
                                                                    {addonTreats.map((s: any) => (
                                                                        <div key={s.id} className="flex justify-between text-white font-bold pl-2 mt-0.5">
                                                                            <span>• {s.nameEs} ({s.nameEn})</span>
                                                                            <span>+${Number(s.basePrice).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {shampooTreats.length > 0 && (
                                                                <div>
                                                                    <span className="text-sky-500 font-black uppercase text-[8px] tracking-wider block">Champú Especial:</span>
                                                                    {shampooTreats.map((s: any) => (
                                                                        <div key={s.id} className="flex justify-between text-white font-bold pl-2 mt-0.5">
                                                                            <span>• {s.nameEs} ({s.nameEn})</span>
                                                                            <span>+${Number(s.basePrice).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Photo if exists */}
                                                    {pet.petImageUrl && (
                                                        <div className="space-y-1">
                                                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1">Foto Mascota</span>
                                                            <div 
                                                                onClick={() => pet.petImageUrl && setActiveLightboxUrl(pet.petImageUrl)}
                                                                className="relative h-28 w-full rounded-xl overflow-hidden border border-[#3A3A3A] bg-[#252525] cursor-pointer hover:border-[#7C3AED]/40 transition-colors"
                                                            >
                                                                <Image 
                                                                    src={pet.petImageUrl} 
                                                                    alt={`Foto ${pet.name}`} 
                                                                    fill 
                                                                    unoptimized
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 5. Notes */}
                                {selectedItem.message && (
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Anotaciones del Dueño</h4>
                                        <p className="bg-[#202020] border border-[#3A3A3A] rounded-xl p-3 text-xs italic text-slate-350 font-bold leading-relaxed">
                                            "{selectedItem.message}"
                                        </p>
                                    </div>
                                )}

                                {/* 6. Estimation & Pricing Adjuster Form */}
                                <div className="border-3 border-black bg-black p-5 rounded-2xl shadow-lg space-y-4">
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>Estimado calculado por Sistema:</span>
                                        <span className="font-black text-white text-base">${selectedItem.systemEstimatedPrice.toFixed(2)}</span>
                                    </div>

                                    {/* Adjust Price form */}
                                    <form onSubmit={handleSavePrice} className="space-y-3 pt-2 border-t border-[#2A2A2A]">
                                        <Label htmlFor="finalPrice" className="text-xs font-black uppercase tracking-wider text-[#2ECC71]">
                                            💰 Corregir Tarifa Oficial Final ($)
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                id="finalPrice"
                                                type="number"
                                                step="0.01"
                                                placeholder="Ej. 110.00"
                                                value={finalPriceInput}
                                                onChange={(e) => setFinalPriceInput(e.target.value)}
                                                className="bg-[#161616] border-[#3A3A3A] text-white text-lg font-black h-11 focus-visible:ring-[#2ECC71] focus-visible:border-[#2ECC71] rounded-xl"
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                disabled={isSavingPrice}
                                                className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 text-black font-black uppercase text-xs tracking-wider px-6 rounded-xl border border-black shadow-[2px_2px_0_0_#000] cursor-pointer shrink-0"
                                            >
                                                {isSavingPrice ? "..." : "Guardar"}
                                            </Button>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">
                                            * Al guardar la tarifa final oficial, el estado de la cita cambiará a "Cotizada" (PRICED) y se habilitarán los despachos en un clic.
                                        </p>
                                    </form>
                                </div>

                                {/* 7. Close Operations Quick Action buttons */}
                                {selectedItem.status !== "PENDING_REVIEW" && selectedItem.finalAdminPrice !== null && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#3A3A3A]">
                                        
                                        {/* WhatsApp Quick Dispatch */}
                                        <a 
                                            href={getWhatsAppLink(selectedItem)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button 
                                                type="button"
                                                className="w-full h-12 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black uppercase text-xs tracking-widest rounded-xl border border-black shadow-[3px_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <MessageSquare className="h-4.5 w-4.5" />
                                                Enviar WhatsApp
                                            </Button>
                                        </a>

                                        {/* Nodemailer SMTP Dispatch */}
                                        <Button 
                                            type="button"
                                            onClick={handleDispatchEmail}
                                            disabled={isSendingEmail}
                                            className="w-full h-12 bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-black uppercase text-xs tracking-widest rounded-xl border border-black shadow-[3px_3px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            {isSendingEmail ? (
                                                <span className="flex items-center gap-1"><span className="animate-spin text-xs">...</span> Enviando</span>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Despachar Correo
                                                </>
                                            )}
                                        </Button>

                                    </div>
                                )}

                                {/* Admin manual operational states triggers */}
                                <div className="flex flex-wrap gap-2 pt-2 justify-end border-t border-[#2A2A2A]/50">
                                    {selectedItem.status === "CONFIRMED" && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleStatusUpdate(selectedItem.id, "COMPLETED")}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                                        >
                                            ✓ Finalizar e Marcar Pago
                                        </Button>
                                    )}
                                    {selectedItem.status !== "REJECTED" ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleStatusUpdate(selectedItem.id, "REJECTED")}
                                            className="border-red-950/40 text-red-400 hover:bg-red-950/20 text-xs font-bold rounded-xl cursor-pointer"
                                        >
                                            Rechazar Solicitud
                                        </Button>
                                    ) : (
                                        <ConfirmDeleteModal 
                                            onConfirm={() => handleDelete(selectedItem.id)}
                                            title="¿Eliminar permanentemente?"
                                            description="Esta acción destruirá esta cotización de la base de datos para siempre."
                                            trigger={
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                                                >
                                                    Eliminar para Siempre
                                                </Button>
                                            }
                                        />
                                    )}
                                </div>

                            </div>
                        </DialogContent>
                    );
                })()}
            </Dialog>

            {/* Lightbox Modal */}
            {activeLightboxUrl && (
                <div 
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 cursor-pointer" 
                    onClick={() => setActiveLightboxUrl(null)}
                >
                    <div 
                        className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" 
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setActiveLightboxUrl(null)}
                            className="absolute -top-12 right-0 z-50 h-10 w-10 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-slate-400 hover:text-white cursor-pointer"
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
