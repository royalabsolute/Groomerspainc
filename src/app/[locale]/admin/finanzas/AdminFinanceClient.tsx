"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    Plus, 
    Trash2, 
    Calendar, 
    Paperclip, 
    FileText, 
    Loader2, 
    ExternalLink, 
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { createTransaction, deleteTransaction } from "@/lib/actions/transactions";
import { uploadFile } from "@/lib/actions/upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { cn } from "@/lib/utils";

interface Transaction {
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    date: string;
    invoiceUrl: string | null;
    inquiryId: string | null;
    createdAt: string;
}

export default function AdminFinanceClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [invoiceFileUrl, setInvoiceFileUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        type: "EXPENSE" as "INCOME" | "EXPENSE",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0]
    });

    const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Calculate Summary Stats
    const totalEarnings = transactions
        .filter(t => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalEarnings - totalExpenses;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("El archivo supera el límite de 5MB");
            return;
        }

        setIsUploading(true);
        const data = new FormData();
        data.append("file", file);

        try {
            const res = await uploadFile(data);
            if (res.success && res.url) {
                setInvoiceFileUrl(res.url);
                toast.success("Factura/Recibo subido con éxito");
            } else {
                toast.error(res.error || "Error al subir comprobante");
            }
        } catch (error) {
            toast.error("Error al subir archivo");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(formData.amount);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Por favor ingresa un monto válido");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createTransaction({
                type: formData.type,
                amount: amt,
                description: formData.description,
                date: formData.date,
                invoiceUrl: invoiceFileUrl
            });

            if (res.success) {
                toast.success("Transacción registrada con éxito");
                setIsOpen(false);
                // Reset states
                setFormData({
                    type: "EXPENSE",
                    amount: "",
                    description: "",
                    date: new Date().toISOString().split("T")[0]
                });
                setInvoiceFileUrl(null);
                window.location.reload();
            } else {
                toast.error(res.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error de red");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteTransaction(id);
            if (res.success) {
                toast.success("Transacción eliminada");
                setTransactions(prev => prev.filter(t => t.id !== id));
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        } catch (error) {
            toast.error("Error al intentar eliminar");
        }
    };

    // Filter Transactions
    const filteredTransactions = transactions.filter(t => {
        const matchesType = filterType === "ALL" || t.type === filterType;
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.amount.toString().includes(searchQuery);
        return matchesType && matchesSearch;
    });

    return (
        <div className="space-y-6 pb-12">
            {/* Financial Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Net Balance Card */}
                <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance Neto</span>
                            <h3 className={cn(
                                "text-3xl font-extrabold tracking-tight",
                                netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                                ${netBalance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-medium">Balance disponible en caja</p>
                        </div>
                        <div className={cn(
                            "p-3.5 rounded-xl border shrink-0",
                            netBalance >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                        )}>
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Total Income Card */}
                <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ingresos Totales</span>
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                ${totalEarnings.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-medium">Servicios y ganancias manuales</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-emerald-500 shrink-0">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Total Expenses Card */}
                <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gastos Totales</span>
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                ${totalExpenses.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-medium">Gastos manuales registrados</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100/50 text-rose-500 shrink-0">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar por descripción o monto..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 border-slate-200 rounded-lg focus-visible:ring-primary/20"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-slate-50 border border-slate-100 rounded-lg p-1 shrink-0 text-xs font-bold">
                        <button 
                            onClick={() => setFilterType("ALL")}
                            className={cn("px-4 py-1.5 rounded-md transition-all", filterType === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900")}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => setFilterType("INCOME")}
                            className={cn("px-4 py-1.5 rounded-md transition-all", filterType === "INCOME" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500 hover:text-emerald-600")}
                        >
                            Ingresos
                        </button>
                        <button 
                            onClick={() => setFilterType("EXPENSE")}
                            className={cn("px-4 py-1.5 rounded-md transition-all", filterType === "EXPENSE" ? "bg-white text-rose-600 shadow-xs" : "text-slate-500 hover:text-rose-600")}
                        >
                            Gastos
                        </button>
                    </div>
                </div>

                {/* Add Transaction Dialog */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-6 rounded-lg font-bold shadow-sm shrink-0">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Transacción
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-xl border-slate-200 p-0 overflow-hidden">
                        <DialogHeader className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                            <DialogTitle className="text-lg font-bold text-slate-900">Registrar flujo de caja</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Type Toggle */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo de flujo</Label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-lg p-1 text-sm font-bold">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                                        className={cn(
                                            "h-10 rounded-md transition-all", 
                                            formData.type === "EXPENSE" ? "bg-rose-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-950"
                                        )}
                                    >
                                        Gasto (Salida)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "INCOME" })}
                                        className={cn(
                                            "h-10 rounded-md transition-all", 
                                            formData.type === "INCOME" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-950"
                                        )}
                                    >
                                        Ingreso (Entrada)
                                    </button>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monto ($ USD)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="pl-8 h-11 border-slate-200 rounded-lg focus-visible:ring-primary/20 font-bold text-base"
                                    />
                                </div>
                            </div>

                            {/* Description Input */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detalle / Concepto</Label>
                                <Input 
                                    type="text"
                                    required
                                    placeholder="Ej: Pago de champú premium, Alquiler de local..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="h-11 border-slate-200 rounded-lg focus-visible:ring-primary/20"
                                />
                            </div>

                            {/* Date Input */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha del registro</Label>
                                <div className="relative">
                                    <Input 
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="h-11 border-slate-200 rounded-lg focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Invoice attachment input */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                                    <Paperclip className="h-3.5 w-3.5 mr-1" /> Adjuntar Factura/Comprobante (Opcional)
                                </Label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        title="Subir comprobante"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isUploading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-10 border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-400" />
                                        ) : (
                                            <FileText className="mr-2 h-4 w-4 text-slate-400" />
                                        )}
                                        {invoiceFileUrl ? "Cambiar archivo" : "Seleccionar archivo"}
                                    </Button>

                                    {invoiceFileUrl && (
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                            ¡Adjunto Listo! ✔
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">Formatos soportados: Imagen, PDF. Máx 5MB.</p>
                            </div>

                            {/* Form Actions */}
                            <div className="pt-4 flex gap-3 border-t border-slate-50">
                                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 font-bold" disabled={isSubmitting || isUploading}>
                                    {isSubmitting ? "Registrando..." : "Guardar Registro"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Transactions Ledger */}
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Historial de Transacciones</h3>
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                        {filteredTransactions.length} registros
                    </span>
                </div>
                
                {filteredTransactions.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <DollarSign className="h-8 w-8 text-slate-300" />
                        </div>
                        <h4 className="text-slate-900 font-bold">No hay transacciones registradas</h4>
                        <p className="text-sm text-slate-400 mt-1">Ingresa un gasto o acepta servicios para ver balance.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Tipo</th>
                                    <th className="py-4 px-6">Detalle / Concepto</th>
                                    <th className="py-4 px-6">Fecha</th>
                                    <th className="py-4 px-6">Comprobante</th>
                                    <th className="py-4 px-6 text-right">Monto</th>
                                    <th className="py-4 px-6 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                        {/* Type */}
                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                                                tx.type === "INCOME" 
                                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                                    : "bg-rose-50 border-rose-100 text-rose-700"
                                            )}>
                                                {tx.type === "INCOME" ? (
                                                    <><ArrowUpRight className="h-3 w-3" /> Ingreso</>
                                                ) : (
                                                    <><ArrowDownRight className="h-3 w-3" /> Gasto</>
                                                )}
                                            </span>
                                        </td>

                                        {/* Description */}
                                        <td className="py-4 px-6 font-semibold text-slate-900 max-w-xs truncate" title={tx.description}>
                                            {tx.description}
                                        </td>

                                        {/* Date */}
                                        <td className="py-4 px-6 font-medium text-slate-500">
                                            {new Date(tx.date).toLocaleDateString("es-ES", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            })}
                                        </td>

                                        {/* Attachment / Receipt */}
                                        <td className="py-4 px-6">
                                            {tx.invoiceUrl ? (
                                                <a 
                                                    href={tx.invoiceUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg transition-all"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver Factura
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium italic">Sin comprobante</span>
                                            )}
                                        </td>

                                        {/* Amount */}
                                        <td className={cn(
                                            "py-4 px-6 text-right font-extrabold text-base tracking-tight",
                                            tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-center">
                                            <ConfirmDeleteModal 
                                                onConfirm={() => handleDelete(tx.id)}
                                                title="¿Eliminar registro?"
                                                description="Esta acción modificará el balance general permanentemente."
                                                trigger={
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
