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
            toast.success("Código de descuento eliminado");
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
        <div className="min-h-screen bg-transparent p-1 sm:p-4 space-y-6">
            <AdminHeader 
                title="Gestión de Cupones" 
                subtitle="Administra códigos de descuento y promociones activas"
                action={
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl border border-[#7C3AED]/25 text-[10px] font-bold uppercase tracking-wider">
                        <Ticket className="h-3.5 w-3.5" />
                        {codes.length} Cupones
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to create */}
                <Card className="border-[#3A3A3A] shadow-lg bg-[#1A1A1A] rounded-2xl h-fit sticky top-6 overflow-hidden">
                    <CardHeader className="bg-[#202020]/50 border-b border-[#3A3A3A]/50 p-6">
                        <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            <Zap className="h-4 w-4 text-[#7C3AED]" /> Nuevo Cupón
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Código del Cupón</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={newCode.code} 
                                        onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase().slice(0, 12) })}
                                        placeholder="EJ: VERANO24"
                                        className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl font-bold uppercase tracking-wide focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500"
                                        required
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={generateRandomCode} 
                                        className="h-11 rounded-xl border-[#3A3A3A] text-slate-300 bg-[#252525] hover:bg-[#2D2D2D] hover:text-white font-bold px-4 cursor-pointer"
                                    >
                                        Azar
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descuento Aplicado</Label>
                                <div className="flex gap-2">
                                    <select 
                                        value={discountType} 
                                        onChange={(e) => setDiscountType(e.target.value as any)}
                                        className="h-11 px-3 rounded-xl border border-[#3A3A3A] bg-[#252525] text-white font-bold text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] cursor-pointer"
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
                                        className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl font-bold focus:border-[#7C3AED] focus:ring-[#7C3AED]"
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
                                    className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descripción / Nota</Label>
                                <Input 
                                    value={newCode.description} 
                                    onChange={e => setNewCode({ ...newCode, description: e.target.value })}
                                    placeholder="EJ: Descuento de temporada"
                                    className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isCreating}
                                className="w-full h-11 rounded-xl bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 font-black shadow-lg cursor-pointer"
                            >
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar Cupón"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List of codes */}
                <div className="lg:col-span-2 space-y-4">
                    {codes.length === 0 ? (
                        <div className="text-center py-24 bg-[#1A1A1A] rounded-2xl border border-[#3A3A3A] border-dashed shadow-xl">
                            <Ticket className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                            <p className="font-bold text-white">Sin cupones activos</p>
                            <p className="text-sm text-slate-500 mt-1">Comienza creando uno para tus clientes.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {codes.map((code) => (
                                <Card key={code.id} className={cn(
                                    "border-[#3A3A3A] shadow-xl rounded-2xl overflow-hidden transition-all duration-300 bg-[#1A1A1A] group",
                                    !code.isActive && "opacity-50 grayscale"
                                )}>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xl font-black uppercase tracking-tight text-white">{code.code}</h4>
                                                    <button 
                                                        onClick={() => copyToClipboard(code.code)} 
                                                        className="p-1.5 hover:bg-[#252525] rounded-xl text-slate-500 hover:text-white transition-all cursor-pointer" 
                                                        title="Copiar código"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{code.description || "Cupón de descuento"}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleToggle(code.id, code.isActive)} 
                                                    className={cn(
                                                        "p-2 rounded-xl border transition-all cursor-pointer", 
                                                        code.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                                    )} 
                                                    title={code.isActive ? "Desactivar" : "Activar"}
                                                >
                                                    {code.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                </button>
                                                <ConfirmDeleteModal 
                                                    onConfirm={() => handleDelete(code.id)}
                                                    trigger={
                                                        <button className="p-2 rounded-xl bg-rose-950/20 text-rose-400 border border-rose-900/30 hover:bg-rose-600 hover:text-white transition-all cursor-pointer" title="Eliminar cupón">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#3A3A3A]/50 text-center">
                                            <div>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Beneficio</p>
                                                <p className="font-black text-[#7C3AED] text-xs">{code.discount || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Uso</p>
                                                <p className="font-black text-white text-xs">{code.usedCount} / {code.maxUses || "∞"}</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Estado</p>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded border inline-block",
                                                    code.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
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
