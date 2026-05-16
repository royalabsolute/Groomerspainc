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
    Ticket
} from "lucide-react";
import { deleteInquiry, updateInquiryStatus, markInquiryAsRead } from "@/lib/actions/inquiries";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Real-time polling
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, [router]);

    // Sync state when router refreshes
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

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        const result = await deleteInquiry(deleteId);
        setIsDeleting(false);
        if (result.success) {
            setItems(items.filter(item => item.id !== deleteId));
            toast.success("Eliminado correctamente");
            setDeleteId(null);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.service?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.discountCode?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        
        const matchesDate = !dateFilter || new Date(item.createdAt).toISOString().split('T')[0] === dateFilter;
        
        return matchesSearch && matchesDate;
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'Aceptada';
            case 'REJECTED': return 'Rechazada';
            case 'PENDING': return 'Pendiente';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminHeader
                    title="Gestión de Citas y Consultas"
                    subtitle="Administra los mensajes y solicitudes de tus clientes."
                    action={
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-xs font-black uppercase tracking-widest animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Live
                        </div>
                    }
                />

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-6 rounded-3xl border border-border/40 shadow-sm">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Nombre, email o servicio..." 
                                className="pl-10 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha</label>
                        <Input 
                            type="date" 
                            className="rounded-xl"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="rounded-xl h-11" onClick={() => { setSearchTerm(""); setDateFilter(""); }}>
                        Limpiar
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredItems.length === 0 ? (
                        <Card className="border-dashed border-2 py-20 flex flex-col items-center opacity-50">
                            <Mail className="h-12 w-12 mb-4" />
                            <p className="font-bold text-xl">No se encontraron citas</p>
                            <p className="text-sm">Ajusta los filtros o espera a que lleguen nuevos mensajes.</p>
                        </Card>
                    ) : (
                        filteredItems.map((item) => (
                            <Card key={item.id} className={cn(
                                "overflow-hidden border-border/40 hover:shadow-xl transition-all duration-300 relative rounded-[2.5rem]",
                                !item.read ? "bg-white ring-1 ring-primary/20" : "bg-white",
                                item.status === 'ACCEPTED' && "border-green-500/30",
                                item.status === 'REJECTED' && "border-red-500/30"
                            )}>
                                <CardContent className="p-5 sm:p-8">
                                    <div className="flex flex-col lg:flex-row justify-between gap-6 sm:gap-10">
                                        {/* Pet Photo (Optional) */}
                                        {item.petImageUrl && (
                                            <div className="shrink-0 flex justify-center lg:justify-start">
                                                <div className="relative h-32 w-32 sm:h-48 sm:w-48 rounded-3xl overflow-hidden border-4 border-white shadow-xl rotate-1">
                                                    <Image 
                                                        src={item.petImageUrl} 
                                                        alt="Mascota" 
                                                        fill 
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex-1 space-y-4 sm:space-y-6">
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                                <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 bg-primary/10 text-primary flex items-center gap-1.5">
                                                    <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                                                    <span className="truncate max-w-[120px] sm:max-w-none">{item.service || "Consulta General"}</span>
                                                </div>
                                                <div className={cn(
                                                    "px-2 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                    getStatusColor(item.status)
                                                )}>
                                                    {getStatusLabel(item.status)}
                                                </div>
                                                {item.discountCode && (
                                                    <div className="px-2 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20 bg-accent/10 text-foreground flex items-center gap-1 sm:gap-1.5">
                                                        <Ticket className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                                                        <span className="hidden sm:inline">CUPÓN:</span> {item.discountCode}
                                                        <span className="ml-1 px-1.5 py-0.5 bg-accent text-white rounded font-black">{initialCodes?.find((c: any) => c.code === item.discountCode)?.discount || ""}</span>
                                                    </div>
                                                )}
                                                <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <div className="flex items-center text-[10px] sm:text-xs font-bold text-muted-foreground gap-1.5 sm:gap-2">
                                                        <User className="h-3 w-3" /> CLIENTE
                                                    </div>
                                                    <p className="font-black text-base sm:text-lg text-foreground truncate">{item.name}</p>
                                                </div>
                                                <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                                                    <div className="flex items-center text-[10px] sm:text-xs font-bold text-muted-foreground gap-1.5 sm:gap-2">
                                                        <Mail className="h-3 w-3" /> EMAIL
                                                    </div>
                                                    <p className="font-medium text-xs sm:text-sm text-primary underline underline-offset-4 truncate hover:text-clip" title={item.email}>{item.email}</p>
                                                </div>
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <div className="flex items-center text-[10px] sm:text-xs font-bold text-muted-foreground gap-1.5 sm:gap-2">
                                                        <Phone className="h-3 w-3" /> TELÉFONO
                                                    </div>
                                                    <p className="font-black text-xs sm:text-sm text-foreground">{item.phone || "N/A"}</p>
                                                </div>
                                            </div>

                                            <div className="bg-primary/2 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-primary/5 relative group">
                                                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                                                </div>
                                                <div className="flex items-center text-[9px] sm:text-[10px] font-black text-primary/60 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 uppercase tracking-widest">
                                                    <MessageSquare className="h-3 w-3" /> Mensaje del Cliente
                                                </div>
                                                <p className="text-sm sm:text-base text-foreground/90 font-medium leading-relaxed italic break-words">
                                                    "{item.message}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:flex lg:flex-col items-center justify-center gap-2 sm:gap-3 border-t lg:border-t-0 lg:border-l border-border/40 pt-4 sm:pt-6 lg:pt-0 lg:pl-10">
                                            <Button 
                                                size="sm" 
                                                className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl gap-1.5 sm:gap-2 text-xs sm:text-sm font-black shadow-lg shadow-green-500/20 bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                                                onClick={() => handleStatusUpdate(item.id, 'ACCEPTED')}
                                            >
                                                <CheckCircle2 className="h-4 w-4 hidden sm:block" /> Aceptar
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl gap-1.5 sm:gap-2 text-xs sm:text-sm font-black border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                            >
                                                <XCircle className="h-4 w-4 hidden sm:block" /> Rechazar
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="col-span-2 lg:col-span-1 w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground/60 hover:text-red-500 font-bold"
                                                onClick={() => setDeleteId(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" /> Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <DialogContent className="rounded-3xl max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black">¿Eliminar consulta?</DialogTitle>
                            <DialogDescription>
                                Esta acción no se puede deshacer. Se borrarán permanentemente los datos de la cita.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-red-500 hover:bg-red-600">
                                {isDeleting ? "Eliminando..." : "Eliminar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
