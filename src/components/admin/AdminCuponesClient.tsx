"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket, CheckCircle, XCircle, Copy, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import { createDiscountCode, deleteDiscountCode, toggleDiscountCode } from "../../lib/actions/discounts";
import { cn } from "@/lib/utils";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface DiscountCode {
    id: string;
    code: string;
    description: string | null;
    discount: string | null;
    isActive: boolean;
    usedCount: number;
    maxUses: number | null;
    createdAt: Date;
}

export default function AdminCuponesClient({ initialCodes }: { initialCodes: any[] }) {
    const [codes, setCodes] = useState<DiscountCode[]>(initialCodes);
    const [isCreating, setIsCreating] = useState(false);
    const [discountType, setDiscountType] = useState<"USD" | "PERCENT">("USD");
    const [discountValue, setDiscountValue] = useState("");
    const [newCode, setNewCode] = useState({ code: "", description: "", discount: "", maxUses: "1" });

    const generateRandomCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCode({ ...newCode, code: result });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const finalDiscount = discountType === "USD" ? `$${discountValue} USD` : `${discountValue}% OFF`;
            const result = await createDiscountCode({ ...newCode, discount: finalDiscount });
            setCodes([result as any, ...codes]);
            setNewCode({ code: "", description: "", discount: "", maxUses: "1" });
            setDiscountValue("");
            toast.success("Código creado con éxito");
        } catch (error: any) {
            toast.error(error.message || "Error al crear el código");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDiscountCode(id);
            setCodes(codes.filter(c => c.id !== id));
            toast.success("Código eliminado");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await toggleDiscountCode(id, !currentStatus);
            setCodes(codes.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
            toast.success(currentStatus ? "Código desactivado" : "Código activado");
        } catch (error) {
            toast.error("Error al actualizar");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info("Código copiado al portapapeles");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
            <AdminHeader 
                title="Gestión de Cupones" 
                subtitle="Administra códigos de descuento y promociones"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to create */}
                <Card className="border-slate-200 shadow-sm rounded-xl h-fit sticky top-6 bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" /> Nuevo Cupón
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Código</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={newCode.code} 
                                        onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase().slice(0, 12) })}
                                        placeholder="EJ: VERANO24"
                                        className="h-11 border-slate-200 rounded-lg font-bold uppercase tracking-wide focus:ring-primary/20"
                                        required
                                    />
                                    <Button type="button" variant="outline" onClick={generateRandomCode} className="h-11 rounded-lg border-slate-200 text-slate-500 font-semibold px-4">
                                        Azar
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descuento</Label>
                                <div className="flex gap-2">
                                    <select 
                                        value={discountType} 
                                        onChange={(e) => setDiscountType(e.target.value as any)}
                                        className="h-11 px-3 rounded-lg border border-slate-200 bg-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        title="Tipo de descuento"
                                    >
                                        <option value="USD">$ USD</option>
                                        <option value="PERCENT">% OFF</option>
                                    </select>
                                    <Input 
                                        type="number"
                                        value={discountValue} 
                                        onChange={e => setDiscountValue(e.target.value)}
                                        placeholder="Valor"
                                        className="h-11 border-slate-200 rounded-lg font-bold focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Límite de Usos</Label>
                                <Input 
                                    type="number"
                                    value={newCode.maxUses} 
                                    onChange={e => setNewCode({ ...newCode, maxUses: e.target.value })}
                                    className="h-11 border-slate-200 rounded-lg focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descripción (Opcional)</Label>
                                <Input 
                                    value={newCode.description} 
                                    onChange={e => setNewCode({ ...newCode, description: e.target.value })}
                                    placeholder="EJ: Promoción física"
                                    className="h-11 border-slate-200 rounded-lg focus:ring-primary/20"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isCreating}
                                className="w-full h-11 rounded-lg bg-primary font-bold shadow-sm"
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar Cupón"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List of codes */}
                <div className="lg:col-span-2 space-y-4">
                    {codes.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-xl border border-slate-200 border-dashed">
                            <Ticket className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                            <p className="font-semibold text-slate-900">Sin cupones activos</p>
                            <p className="text-sm text-slate-400">Comienza creando uno para tus clientes.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {codes.map((code) => (
                                <Card key={code.id} className={cn(
                                    "border-slate-200 shadow-sm rounded-xl overflow-hidden transition-all duration-200 bg-white group",
                                    !code.isActive && "opacity-60 grayscale"
                                )}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xl font-bold uppercase tracking-tight text-slate-900">{code.code}</h4>
                                                    <button 
                                                        onClick={() => copyToClipboard(code.code)} 
                                                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-600 transition-colors" 
                                                        title="Copiar código"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{code.description || "Cupón de descuento"}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleToggle(code.id, code.isActive)} 
                                                    className={cn(
                                                        "p-2 rounded-lg border transition-all", 
                                                        code.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                                                    )} 
                                                    title={code.isActive ? "Desactivar" : "Activar"}
                                                >
                                                    {code.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                </button>
                                                <ConfirmDeleteModal 
                                                    onConfirm={() => handleDelete(code.id)}
                                                    trigger={
                                                        <button className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all" title="Eliminar cupón">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-50">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Beneficio</p>
                                                <p className="font-bold text-primary text-sm">{code.discount || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Uso</p>
                                                <p className="font-bold text-slate-900 text-sm">{code.usedCount} / {code.maxUses || "∞"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Estado</p>
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded border inline-block",
                                                    code.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                                                )}>
                                                    {code.isActive ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
