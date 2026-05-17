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
    MoreVertical
} from "lucide-react";
import { deleteInquiry, updateInquiryStatus, markInquiryAsRead, completeInquiryPayment } from "@/lib/actions/inquiries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
}

interface AdminInquiriesClientProps {
    initialItems: any[];
    initialCodes: any[];
}

export default function AdminInquiriesClient({ initialItems, initialCodes }: AdminInquiriesClientProps) {
    const router = useRouter();
    const [items, setItems] = useState<Inquiry[]>(initialItems);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

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
            setItems(items.filter(item => item.id !== id));
            toast.success("Eliminado correctamente");
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
        return matchesSearch && matchesDate;
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Completada / Pagada';
            case 'ACCEPTED': return 'Aceptada (En curso)';
            case 'REJECTED': return 'Rechazada';
            case 'PENDING': return 'Pendiente';
            default: return status;
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'ACCEPTED': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Gestión de Citas"
                    subtitle="Administra las solicitudes y mensajes entrantes"
                    action={
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </div>
                    }
                />

                {/* Search and Filters */}
                <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Buscar Solicitud</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Nombre, email o servicio..." 
                                    className="pl-9 h-11 border-slate-200 rounded-lg focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-48 space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Filtrar por Fecha</label>
                            <Input 
                                type="date" 
                                className="h-11 border-slate-200 rounded-lg"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            className="h-11 rounded-lg border-slate-200 font-semibold text-slate-600 w-full sm:w-auto px-6" 
                            onClick={() => { setSearchTerm(""); setDateFilter(""); }}
                        >
                            Limpiar
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                    {filteredItems.length === 0 ? (
                        <div className="bg-white border border-slate-200 border-dashed py-20 flex flex-col items-center rounded-xl">
                            <Mail className="h-12 w-12 text-slate-200 mb-4" />
                            <p className="font-semibold text-slate-900">No se encontraron registros</p>
                            <p className="text-sm text-slate-400">Prueba ajustando los filtros de búsqueda.</p>
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div key={item.id} className={cn(
                                "group bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 overflow-hidden",
                                !item.read && "border-l-4 border-l-primary"
                            )}>
                                <div className="p-5 sm:p-6 lg:p-8">
                                    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
                                        {/* Optional Pet Image */}
                                        {item.petImageUrl && (
                                            <div className="relative h-24 w-24 sm:h-40 sm:w-40 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 mx-auto sm:mx-0">
                                                <Image 
                                                    src={item.petImageUrl} 
                                                    alt="Pet" 
                                                    fill 
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1 w-full space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                                    {item.service || "Consulta"}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border",
                                                    getStatusStyles(item.status)
                                                )}>
                                                    {getStatusLabel(item.status)}
                                                </span>
                                                {item.discountCode && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100 flex items-center gap-1.5">
                                                        <Ticket className="h-3 w-3" />
                                                        CUPÓN: {item.discountCode}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 ml-auto">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</h4>
                                                    <p className="font-bold text-slate-900">{item.name}</p>
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email / Teléfono</h4>
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-medium text-primary hover:underline truncate">{item.email}</p>
                                                        <p className="text-xs text-slate-500">{item.phone || "Sin teléfono"}</p>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2 lg:col-span-1">
                                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mensaje</h4>
                                                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        "{item.message}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex lg:flex-col gap-2 w-full lg:w-32 pt-4 lg:pt-0 lg:pl-6 lg:border-l border-slate-100">
                                            {item.status === 'PENDING' && (
                                                <>
                                                    <Button 
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(item.id, 'ACCEPTED')}
                                                        className="flex-1 lg:w-full h-10 rounded-lg font-bold bg-amber-500 hover:bg-amber-600 text-white"
                                                    >
                                                        Aceptar Trabajo
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                                        className="flex-1 lg:w-full h-10 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
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
                                                            className="flex-1 lg:w-full h-10 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            Validar Pago
                                                        </Button>
                                                    }
                                                />
                                            )}

                                            {(item.status === 'COMPLETED' || item.status === 'REJECTED') && (
                                                <div className="flex-1 lg:w-full h-10 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                    {item.status === 'COMPLETED' ? 'Finalizada' : 'Rechazada'}
                                                </div>
                                            )}

                                            <div className="shrink-0 lg:w-full">
                                                <ConfirmDeleteModal 
                                                    onConfirm={() => handleDelete(item.id)}
                                                    trigger={
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 lg:w-full lg:h-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
