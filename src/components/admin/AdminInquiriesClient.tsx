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
    MessageSquare, Send, Award, Droplets, Dog, MapPin, Tag, Printer, FileText
} from "lucide-react";
import { 
    deleteInquiry, 
    updateInquiryStatus, 
    markInquiryAsRead, 
    completeInquiryPayment, 
    saveAdminFinalPrice, 
    sendBilingualQuoteEmail,
    completeInquiryWithLegal
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
    contractUrl: string | null;
    groomerNotes: string | null;
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

    // Legal Close Modal States
    const [isLegalCloseOpen, setIsLegalCloseOpen] = useState(false);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [groomerNotes, setGroomerNotes] = useState("");
    const [isSubmittingLegal, setIsSubmittingLegal] = useState(false);

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

    const handleLegalCloseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !contractFile) return;

        setIsSubmittingLegal(true);
        try {
            const formData = new FormData();
            formData.append("id", selectedItem.id);
            formData.append("groomerNotes", groomerNotes);
            formData.append("contract", contractFile);

            const result = await completeInquiryWithLegal(formData);
            if (result.success) {
                toast.success("Cita completada y registro legal/financiero guardado");
                
                // Update local state
                const updated = {
                    ...selectedItem,
                    status: "COMPLETED" as const,
                    contractUrl: result.contractUrl || null,
                    groomerNotes: groomerNotes
                };
                setItems(items.map(i => i.id === selectedItem.id ? updated : i));
                setSelectedItem(updated);
                
                // Reset fields
                setContractFile(null);
                setGroomerNotes("");
                setIsLegalCloseOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Error al completar cita");
            }
        } catch {
            toast.error("Error de red o conexión");
        } finally {
            setIsSubmittingLegal(false);
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
            ? `Hello ${item.name}! Your quote to pamper ${item.petName} is ready. [GroomingPet]\n\nIncluded: ${serviceNames || "Grooming"}\nOfficial Price: $${price.toFixed(2)}\n\nAccept & Book your spot here: ${acceptUrl}\n\nThank you!`
            : `¡Hola ${item.name}! El estimado para consentir a ${item.petName} está listo. [GroomingPet]\n\nIncluye: ${serviceNames || "Grooming"}\nPrecio Oficial: $${price.toFixed(2)}\n\nAcepta y Confirma tu cita aquí: ${acceptUrl}\n\n¡Gracias!`;

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

    const handleDownloadPDF = (item: InquiryItem) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes.");
            return;
        }

        const price = item.finalAdminPrice || item.systemEstimatedPrice;
        
        // Compile all pets in English representation
        let petsInfo = "";
        const petsList = item.pets && item.pets.length > 0 ? item.pets : [
            {
                name: item.petName,
                breed: item.breed,
                weight: item.petWeight,
                age: item.petAge,
                rabiesVaccinated: item.rabiesVaccinated,
                rabiesRegistry: item.rabiesRegistry,
                selectedServiceIds: item.selectedServiceIds
            }
        ];

        petsList.forEach((pet, idx) => {
            const ids = pet.selectedServiceIds.split(",").map(id => id.trim()).filter(Boolean);
            const chosen = services.filter(s => ids.includes(s.id));
            const servicesText = chosen.map(s => s.nameEn).join(", ") || "Grooming";

            petsInfo += `
            <div style="border: 1px solid #000; padding: 12px; margin-bottom: 12px; border-radius: 8px;">
                <p style="margin: 4px 0;"><strong>PET #${idx + 1} NAME:</strong> ${pet.name || "_______________"} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>BREED:</strong> ${pet.breed || "_______________"}</p>
                <p style="margin: 4px 0;"><strong>WEIGHT:</strong> ${pet.weight ? `${pet.weight} lbs` : "_______ lbs"} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>AGE:</strong> ${pet.age || "_______________"} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>MEDICAL ISSUES / OBSERVATIONS:</strong> ____________________________</p>
                <p style="margin: 4px 0;"><strong>RABIES VACCINE EXPIRATION DATE:</strong> ________________________ &nbsp;&nbsp;|&nbsp;&nbsp; <strong>GROOMER INITIALS:</strong> _________</p>
                <p style="margin: 4px 0;"><strong>REQUESTED SERVICES:</strong> ${servicesText}</p>
            </div>
            `;
        });

        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>GROOMERS, INC. - Liability Waiver - ${item.name}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    color: #000;
                    margin: 40px;
                    line-height: 1.5;
                    font-size: 12px;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px double #000;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
                .header p {
                    margin: 4px 0 0;
                    font-size: 11px;
                    font-weight: bold;
                }
                .section {
                    margin-bottom: 20px;
                }
                .section-title {
                    font-weight: bold;
                    text-transform: uppercase;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                    margin-bottom: 10px;
                    font-size: 13px;
                }
                .field-row {
                    display: flex;
                    justify-content: flex-start;
                    flex-wrap: wrap;
                    margin-bottom: 6px;
                }
                .field {
                    margin-right: 20px;
                    margin-bottom: 6px;
                }
                .terms {
                    text-align: justify;
                    font-size: 10px;
                    line-height: 1.4;
                    border: 1px dashed #000;
                    padding: 10px;
                    margin-bottom: 20px;
                    background: #FAFAFA;
                }
                .signatures {
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                }
                .signature-line {
                    border-top: 1px solid #000;
                    width: 45%;
                    text-align: center;
                    padding-top: 5px;
                    margin-top: 40px;
                }
                .footer-box {
                    border: 1px solid #000;
                    padding: 10px;
                    margin-top: 20px;
                    font-size: 11px;
                }
                @media print {
                    body {
                        margin: 20px;
                    }
                    button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div style="text-align: right; margin-bottom: 10px;">
                <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; cursor: pointer; background: #000; color: #FFF; border: none; border-radius: 4px;">PRINT / SAVE PDF</button>
            </div>

            <!-- HEADER -->
            <div class="header">
                <h1>GROOMERS, INC.</h1>
                <p>Mobile Pet Grooming Spa | Miami, FL</p>
                <p style="font-size: 14px; margin-top: 8px;">LIABILITY WAIVER & SERVICE AGREEMENT</p>
            </div>

            <!-- SEC 1: CLIENT INFORMATION -->
            <div class="section">
                <div class="section-title">SECTION 1: CLIENT & VEHICLE DESTINATION</div>
                <div class="field-row">
                    <div class="field"><strong>CLIENT NAME:</strong> ${item.name}</div>
                    <div class="field"><strong>PHONE:</strong> ${item.phone}</div>
                    <div class="field"><strong>EMAIL:</strong> ${item.email}</div>
                </div>
                <div class="field-row">
                    <div class="field"><strong>SERVICE ADDRESS:</strong> ${item.address}, ZIP ${item.zipCode}</div>
                </div>
            </div>

            <!-- SEC 2 & 3: PETS & RABIES REGISTRY -->
            <div class="section">
                <div class="section-title">SECTION 2 & 3: PET SPECIFICATION & SERVICES INFO (FL Law Compliance)</div>
                <p style="font-size: 10px; margin: 0 0 10px 0; font-style: italic;">* In compliance with Florida Law, rabies tags / proof of vaccine expiration date must be registered prior to service start.</p>
                ${petsInfo}
            </div>

            <div class="section">
                <div class="field-row" style="margin-top: 10px;">
                    <div class="field"><strong>TOTAL ESTIMATED SPA PRICE:</strong> $${price.toFixed(2)}</div>
                    <div class="field"><strong>SPECIFIC INSTRUCTIONS:</strong> ________________________________________________</div>
                </div>
            </div>

            <!-- SEC 4: TERMS & AGREEMENTS -->
            <div class="section">
                <div class="section-title">SECTION 4: MOBILE SPA SERVICE TERMS</div>
                <div class="terms">
                    1. MATTED COAT POLICY: Shaving a matted coat can expose pre-existing skin conditions. Groomers, Inc. is not responsible for irritation, cuts or abrasions resulting from de-matting or clipping a severely matted coat.<br/>
                    2. BEHAVIOR & SAFETY: Owner must inform the groomer if the pet exhibits aggressive behavior. We reserve the right to refuse service or use safe muzzling if required for pet and handler protection.<br/>
                    3. CASH ONLY PAYMENT: Groomers, Inc. operates strictly on a Cash-On-Delivery (COD) basis. Payments must be processed immediately upon pet check-out.<br/>
                    4. LIABILITY WAIVER: Owner releases Groomers, Inc. from any liability for injury, illness or damage arising from standard grooming procedures or sudden health events during spa sessions.
                </div>
            </div>

            <!-- SEC 5 & FOOTER: SIGNATURES & CLOSURE -->
            <div class="section">
                <div class="section-title">SECTION 5: SIGNATURES & FINAL CLOSURE</div>
                
                <div class="signatures">
                    <div class="signature-line">
                        CLIENT SIGNATURE & DATE<br/>
                        X ________________________________________
                    </div>
                    <div class="signature-line">
                        SPA GROOMER SIGNATURE & DATE<br/>
                        X ________________________________________
                    </div>
                </div>

                <div class="footer-box">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                        <label><input type="checkbox"/> [ ] SERVICE COMPLETED SUCCESSFULLY</label>
                        <span>FINAL CASH RECEIVED: $________________</span>
                    </div>
                    <div style="margin-top: 10px;">
                        <strong>GROOMER FINAL CLINICAL/BEHAVIOR NOTES:</strong><br/>
                        <p style="margin: 8px 0 0 0; line-height: 1.8;">___________________________________________________________________________________________________________________</p>
                        <p style="margin: 4px 0 0 0; line-height: 1.8;">___________________________________________________________________________________________________________________</p>
                    </div>
                </div>
            </div>
            
            <script>
                // Auto trigger browser print dialogue
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
        `);
        printWindow.document.close();
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
                                        <div className="bg-[#252525]/60 border border-[#3A3A3A] rounded-xl p-4 space-y-2 text-xs text-slate-300">
                                            <p className="font-bold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {item.email}</p>
                                            <p className="font-bold flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {item.phone}</p>
                                            <p className="text-slate-400 pt-1.5 border-t border-[#3D3D3D] mt-1.5 flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" /> <span>{item.address} (ZIP: {item.zipCode})</span></p>
                                        </div>

                                        {/* Pet spec */}
                                        <div className="bg-[#202020] border border-[#2D2D2D] rounded-xl p-3 flex justify-between items-center text-xs text-slate-400">
                                            <span className="flex items-center gap-1.5"><Dog className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" /> <span><strong>{item.petName}</strong> ({item.breed})</span></span>
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
                        <DialogContent className="w-[95vw] sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 text-zinc-100 p-6 shadow-2xl z-50">
                            <DialogHeader className="border-b border-zinc-800 pb-4">
                                <DialogTitle className="text-xl font-bold uppercase text-zinc-100 tracking-tight flex items-center gap-2">
                                    <Search className="h-5 w-5 text-[#A78BFA]" /> {selectedItem.status === "PENDING_REVIEW" ? "Revisión de Cotización" : "Detalles de Solicitud"}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                                    ID: {selectedItem.id}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 pt-4 text-sm text-zinc-300 font-medium">
                                
                                {/* 1. Owner & Address Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-md">
                                        <h4 className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest border-b border-zinc-800/80 pb-1.5 mb-2 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#A78BFA]" /> <span>Cliente</span></h4>
                                        <p className="font-bold text-zinc-100">{selectedItem.name}</p>
                                        <p className="text-xs font-bold text-zinc-400 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> {selectedItem.email}</p>
                                        <p className="text-xs font-bold text-zinc-400 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> {selectedItem.phone}</p>
                                    </div>
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-md">
                                        <h4 className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest border-b border-zinc-800/80 pb-1.5 mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#A78BFA]" /> <span>Destino</span></h4>
                                        <p className="font-bold text-zinc-100">{selectedItem.address}</p>
                                        <p className="text-xs font-bold text-zinc-400">Florida (ZIP: {selectedItem.zipCode})</p>
                                    </div>
                                </div>

                                {/* 2 & 3 & 4. Loop over each Pet in the list */}
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-widest border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                                        <Dog className="h-4 w-4 text-[#A78BFA]" /> Mascotas y Servicios Solicitados ({selectedItem.pets?.length || 0})
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
                                            <div key={pet.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-md">
                                                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
                                                    <span className="font-bold text-xs uppercase tracking-widest text-[#A78BFA] flex items-center gap-1.5">
                                                        <Dog className="h-3.5 w-3.5 text-[#A78BFA]" /> Perro #{idx + 1}: {pet.name}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-transparent",
                                                        pet.rabiesVaccinated 
                                                            ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/30" 
                                                            : "bg-red-950/50 text-red-400 border-red-800/30"
                                                    )}>
                                                        Rabia: {pet.rabiesVaccinated ? `Vigente (#${pet.rabiesRegistry || 'N/A'})` : 'Vencida/Faltante'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                                                    {/* Specs */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> <span className="text-zinc-400">Raza:</span> <strong className="text-zinc-200">{pet.breed}</strong></div>
                                                        <div className="flex items-center gap-1.5"><Footprints className="h-3.5 w-3.5 text-rose-450 shrink-0" /> <span className="text-zinc-400">Peso:</span> <strong className="text-rose-455 text-rose-400">{pet.weight} lbs</strong></div>
                                                        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> <span className="text-zinc-400">Edad:</span> <strong className="text-zinc-200">{pet.age}</strong></div>
                                                        
                                                        {/* Pet services list */}
                                                        <div className="pt-2 border-t border-zinc-800 space-y-2 mt-2">
                                                            {mainGroom.length > 0 && (
                                                                <div>
                                                                    <span className="text-[#A78BFA] font-bold uppercase text-[8px] tracking-wider block">Servicio Principal:</span>
                                                                    {mainGroom.map((s: any) => (
                                                                        <div key={s.id} className="flex justify-between text-zinc-200 font-bold pl-2 mt-0.5">
                                                                            <span>• {s.nameEs} ({s.nameEn})</span>
                                                                            <span>${Number(s.basePrice).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {addonTreats.length > 0 && (
                                                                <div>
                                                                    <span className="text-amber-500 font-bold uppercase text-[8px] tracking-wider block">Add-ons:</span>
                                                                    {addonTreats.map((s: any) => (
                                                                        <div key={s.id} className="flex justify-between text-zinc-200 font-bold pl-2 mt-0.5">
                                                                            <span>• {s.nameEs} ({s.nameEn})</span>
                                                                            <span>+${Number(s.basePrice).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {shampooTreats.length > 0 && (
                                                                <div>
                                                                    <span className="text-sky-400 font-bold uppercase text-[8px] tracking-wider block">Champú Especial:</span>
                                                                    {shampooTreats.map((s: any) => (
                                                                        <div key={s.id} className="flex justify-between text-zinc-200 font-bold pl-2 mt-0.5">
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
                                                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mb-1">Foto Mascota</span>
                                                            <div 
                                                                onClick={() => pet.petImageUrl && setActiveLightboxUrl(pet.petImageUrl)}
                                                                className="relative h-28 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-[#7C3AED] transition-colors shadow-sm"
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
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Anotaciones del Dueño</h4>
                                        <p className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs italic text-zinc-300 font-medium leading-relaxed">
                                            "{selectedItem.message}"
                                        </p>
                                    </div>
                                )}

                                {/* 6. Estimation & Pricing Adjuster Form */}
                                <div className="border border-zinc-800 bg-zinc-900 p-5 rounded-2xl shadow-md space-y-4">
                                    <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase">
                                        <span>Estimado por Sistema:</span>
                                        <span className="font-bold text-zinc-200 text-sm bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-lg">${selectedItem.systemEstimatedPrice.toFixed(2)}</span>
                                    </div>

                                    {/* Adjust Price form */}
                                    <form onSubmit={handleSavePrice} className="space-y-3 pt-4 border-t border-zinc-800 border-dashed">
                                        <Label htmlFor="finalPrice" className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                                            <DollarSign className="h-4 w-4 text-[#10B981]" /> <span>Corregir Tarifa Oficial Final ($)</span>
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                id="finalPrice"
                                                type="number"
                                                step="0.01"
                                                placeholder="Ej. 110.00"
                                                value={finalPriceInput}
                                                onChange={(e) => setFinalPriceInput(e.target.value)}
                                                className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm font-bold h-11 focus-visible:ring-zinc-800 focus-visible:border-zinc-750 rounded-xl"
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                disabled={isSavingPrice}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs tracking-wider px-6 rounded-xl border border-zinc-700 cursor-pointer transition-all active:translate-y-px"
                                            >
                                                {isSavingPrice ? "..." : "Guardar"}
                                            </Button>
                                        </div>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase leading-normal">
                                            * Al guardar la tarifa final oficial, el estado de la cita cambiará a "Cotizada" (PRICED) y se habilitarán los despachos en un clic.
                                        </p>
                                    </form>
                                </div>

                                {/* 7. Close Operations Quick Action buttons */}
                                {selectedItem.status !== "PENDING_REVIEW" && selectedItem.finalAdminPrice !== null && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800 border-dashed">
                                        
                                        {/* WhatsApp Quick Dispatch */}
                                        <a 
                                            href={getWhatsAppLink(selectedItem)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button 
                                                type="button"
                                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs tracking-widest rounded-xl border border-zinc-700 cursor-pointer flex items-center justify-center gap-1.5 transition-all active:translate-y-px"
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
                                            className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase text-xs tracking-widest rounded-xl border border-zinc-700 cursor-pointer flex items-center justify-center gap-1.5 transition-all active:translate-y-px"
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
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownloadPDF(selectedItem)}
                                        className="border-zinc-700 hover:bg-zinc-850 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Printer className="h-3.5 w-3.5" /> Descargar Contrato Físico (PDF)
                                    </Button>
                                    {selectedItem.status === "CONFIRMED" && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleStatusUpdate(selectedItem.id, "COMPLETED")}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar e Marcar Pago
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
