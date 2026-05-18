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
    Search,
    ArrowUpRight,
    ArrowDownRight
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
        <div className="space-y-6 pb-12 text-white">
            {/* Financial Status Cards */}
            <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-3 gap-6 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
                {/* Net Balance Card */}
                <Card className="border-[#3A3A3A] shadow-xl rounded-2xl bg-[#1A1A1A] overflow-hidden snap-start shrink-0 w-[85%] md:w-full">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance Neto</span>
                            <h3 className={cn(
                                "text-3xl font-black tracking-tight",
                                netBalance >= 0 ? "text-[#2ECC71]" : "text-rose-500"
                            )}>
                                ${netBalance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Balance disponible en caja</p>
                        </div>
                        <div className={cn(
                            "p-3.5 rounded-xl border shrink-0 bg-[#252525]",
                            netBalance >= 0 ? "border-[#2ECC71]/35 text-[#2ECC71] shadow-[0_0_10px_rgba(46,204,113,0.1)]" : "border-rose-500/35 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                        )}>
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Total Income Card */}
                <Card className="border-[#3A3A3A] shadow-xl rounded-2xl bg-[#1A1A1A] overflow-hidden snap-start shrink-0 w-[85%] md:w-full">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingresos Totales</span>
                            <h3 className="text-3xl font-black text-white tracking-tight">
                                ${totalEarnings.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Servicios y entradas</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#252525] border border-[#2ECC71]/25 text-[#2ECC71] shrink-0">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Total Expenses Card */}
                <Card className="border-[#3A3A3A] shadow-xl rounded-2xl bg-[#1A1A1A] overflow-hidden snap-start shrink-0 w-[85%] md:w-full">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gastos Totales</span>
                            <h3 className="text-3xl font-black text-white tracking-tight">
                                ${totalExpenses.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Salidas registradas</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#252525] border border-rose-500/25 text-rose-500 shrink-0">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#1A1A1A] p-4 rounded-2xl border border-[#3A3A3A] shadow-xl">
                <div className="flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Buscar por descripción o monto..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB]"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-[#252525] border border-[#3A3A3A] rounded-xl p-1 shrink-0 text-xs font-black uppercase tracking-wider">
                        <button 
                            onClick={() => setFilterType("ALL")}
                            className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", filterType === "ALL" ? "bg-[#1A1A1A] text-[#00DDEB] shadow-md border border-[#3A3A3A]" : "text-slate-400 hover:text-white")}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => setFilterType("INCOME")}
                            className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", filterType === "INCOME" ? "bg-[#1A1A1A] text-[#2ECC71] shadow-md border border-[#3A3A3A]" : "text-slate-400 hover:text-[#2ECC71]")}
                        >
                            Ingresos
                        </button>
                        <button 
                            onClick={() => setFilterType("EXPENSE")}
                            className={cn("px-4 py-2 rounded-lg transition-all cursor-pointer", filterType === "EXPENSE" ? "bg-[#1A1A1A] text-rose-500 shadow-md border border-[#3A3A3A]" : "text-slate-400 hover:text-rose-500")}
                        >
                            Gastos
                        </button>
                    </div>
                </div>

                {/* Add Transaction Dialog */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-11 px-6 rounded-xl font-black bg-[#00DDEB] text-black hover:bg-[#00DDEB]/90 shadow-lg cursor-pointer uppercase tracking-wider text-xs shrink-0">
                            <Plus className="mr-2 h-4 w-4" /> Registrar Transacción
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl border-[#3A3A3A] bg-[#1A1A1A] p-0 overflow-hidden text-white shadow-2xl">
                        <DialogHeader className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50">
                            <DialogTitle className="text-sm font-black text-white uppercase tracking-wider">Registrar flujo de caja</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Type Toggle */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de flujo</Label>
                                <div className="grid grid-cols-2 gap-2 bg-[#252525] border border-[#3A3A3A] rounded-xl p-1 text-xs font-black uppercase tracking-wider">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                                        className={cn(
                                            "h-10 rounded-lg transition-all cursor-pointer", 
                                            formData.type === "EXPENSE" ? "bg-rose-600 text-white shadow-md border border-rose-500/40" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        Gasto (Salida)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "INCOME" })}
                                        className={cn(
                                            "h-10 rounded-lg transition-all cursor-pointer", 
                                            formData.type === "INCOME" ? "bg-[#2ECC71] text-white shadow-md border-[#2ECC71]/40" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        Ingreso (Entrada)
                                    </button>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto ($ USD)</Label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">$</span>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="pl-8 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB] font-black text-base"
                                    />
                                </div>
                            </div>

                            {/* Description Input */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalle / Concepto</Label>
                                <Input 
                                    type="text"
                                    required
                                    placeholder="Ej: Pago de champú, Insumos, etc."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB]"
                                />
                            </div>

                            {/* Date Input */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha del registro</Label>
                                <Input 
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB]"
                                />
                            </div>

                            {/* Invoice attachment input */}
                            <div className="space-y-1.5 pt-2 border-t border-[#3A3A3A]/40">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                                    <Paperclip className="h-3.5 w-3.5 mr-1 text-[#00DDEB]" /> Adjuntar Factura/Comprobante (Opcional)
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
                                        className="h-10 border-[#3A3A3A] bg-[#252525] rounded-xl hover:bg-[#2F2F2F] text-slate-300 font-bold"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#00DDEB]" />
                                        ) : (
                                            <FileText className="mr-2 h-4 w-4 text-slate-500" />
                                        )}
                                        {invoiceFileUrl ? "Cambiar comprobante" : "Seleccionar archivo"}
                                    </Button>

                                    {invoiceFileUrl && (
                                        <span className="text-[9px] font-black text-[#2ECC71] uppercase tracking-wider flex items-center bg-[#2ECC71]/10 px-2 py-1 rounded-lg border border-[#2ECC71]/25">
                                            Listo ✔
                                        </span>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">Formatos: Imagen, PDF. Máx 5MB.</p>
                            </div>

                            {/* Form Actions */}
                            <div className="pt-4 flex gap-3 border-t border-[#3A3A3A]/40">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl border-[#3A3A3A] bg-[#252525] text-slate-300 font-bold hover:bg-[#2F2F2F] hover:text-white cursor-pointer uppercase tracking-wider text-xs" onClick={() => setIsOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 rounded-xl bg-[#00DDEB] text-black font-black hover:bg-[#00DDEB]/90 cursor-pointer uppercase tracking-wider text-xs" disabled={isSubmitting || isUploading}>
                                    {isSubmitting ? "Registrando..." : "Guardar Registro"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Transactions Ledger */}
            <Card className="border-[#3A3A3A] shadow-xl rounded-2xl bg-[#1A1A1A] overflow-hidden">
                <div className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50 flex justify-between items-center">
                    <h3 className="font-black text-white text-xs uppercase tracking-wider">Historial de Transacciones</h3>
                    <span className="text-[9px] bg-[#252525] text-[#00DDEB] font-black px-2.5 py-1 rounded-md border border-[#3A3A3A]">
                        {filteredTransactions.length} registros
                    </span>
                </div>
                
                {filteredTransactions.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-[#252525] border border-[#3A3A3A] rounded-full flex items-center justify-center mb-4 shadow-md">
                            <DollarSign className="h-8 w-8 text-slate-500" />
                        </div>
                        <h4 className="text-white font-bold">No hay transacciones registradas</h4>
                        <p className="text-sm text-slate-500 mt-1">Registra un ingreso o gasto manual para comenzar.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#3A3A3A]/50 bg-[#252525]/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="py-4 px-6">Tipo</th>
                                        <th className="py-4 px-6">Detalle / Concepto</th>
                                        <th className="py-4 px-6">Fecha</th>
                                        <th className="py-4 px-6">Comprobante</th>
                                        <th className="py-4 px-6 text-right">Monto</th>
                                        <th className="py-4 px-6 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#3A3A3A]/30 text-sm text-slate-300">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-[#252525]/20 transition-colors group">
                                            {/* Type */}
                                            <td className="py-4 px-6">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                                                    tx.type === "INCOME" 
                                                        ? "bg-[#2ECC71]/10 border-[#2ECC71]/25 text-[#2ECC71]" 
                                                        : "bg-rose-950/20 border-rose-500/25 text-rose-500"
                                                )}>
                                                    {tx.type === "INCOME" ? (
                                                        <><ArrowUpRight className="h-3 w-3" /> Ingreso</>
                                                    ) : (
                                                        <><ArrowDownRight className="h-3 w-3" /> Gasto</>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Description */}
                                            <td className="py-4 px-6 font-semibold text-white max-w-xs truncate" title={tx.description}>
                                                {tx.description}
                                            </td>

                                            {/* Date */}
                                            <td className="py-4 px-6 font-semibold text-slate-500">
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
                                                        className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-[#00DDEB] bg-[#00DDEB]/10 hover:bg-[#00DDEB]/20 border border-[#00DDEB]/25 px-2.5 py-1 rounded-lg transition-all"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver Factura
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-500 font-bold italic">Sin comprobante</span>
                                                )}
                                            </td>

                                            {/* Amount */}
                                            <td className={cn(
                                                "py-4 px-6 text-right font-black text-base tracking-tight",
                                                tx.type === "INCOME" ? "text-[#2ECC71]" : "text-rose-500"
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
                                                            className="h-8.5 w-8.5 text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 border border-[#3A3A3A] rounded-xl flex items-center justify-center cursor-pointer"
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

                        {/* Mobile View Cards */}
                        <div className="md:hidden block divide-y divide-[#3A3A3A]/30">
                            {filteredTransactions.map((tx) => (
                                <div key={tx.id} className="p-5 space-y-4 hover:bg-[#252525]/15 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-xl border shrink-0",
                                                tx.type === "INCOME" 
                                                    ? "bg-[#2ECC71]/10 border-[#2ECC71]/25 text-[#2ECC71]" 
                                                    : "bg-rose-950/20 border-rose-500/25 text-rose-500"
                                            )}>
                                                {tx.type === "INCOME" ? (
                                                    <ArrowUpRight className="h-5 w-5" />
                                                ) : (
                                                    <ArrowDownRight className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-sm leading-tight break-all max-w-[180px]">
                                                    {tx.description}
                                                </h4>
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mt-1">
                                                    {new Date(tx.date).toLocaleDateString("es-ES", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-lg font-black tracking-tight",
                                                tx.type === "INCOME" ? "text-[#2ECC71]" : "text-rose-500"
                                            )}>
                                                {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <div>
                                            {tx.invoiceUrl ? (
                                                <a 
                                                    href={tx.invoiceUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-[#00DDEB] bg-[#00DDEB]/10 border border-[#00DDEB]/25 px-3 py-1.5 rounded-xl"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Factura
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-500 font-bold italic">Sin comprobante</span>
                                            )}
                                        </div>
                                        <ConfirmDeleteModal 
                                            onConfirm={() => handleDelete(tx.id)}
                                            title="¿Eliminar registro?"
                                            description="Esta acción modificará el balance general permanentemente."
                                            trigger={
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 border border-[#3A3A3A] rounded-xl font-black text-[9px] uppercase px-3 h-9 cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1.5" /> Eliminar
                                                </Button>
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
