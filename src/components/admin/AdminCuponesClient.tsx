"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket, CheckCircle, XCircle, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import { createDiscountCode, deleteDiscountCode, toggleDiscountCode } from "../../lib/actions/discounts";

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
        if (!confirm("¿Estás seguro de eliminar este código?")) return;
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
        <div className="space-y-8">
            <AdminHeader 
                title="Gestión de Cupones" 
                subtitle="Crea y administra códigos de descuento para tus clientes."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to create */}
                <Card className="border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-3xl h-fit">
                    <CardHeader className="bg-primary/5 border-b-4 border-black p-6">
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Nuevo Cupón</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest">Código (Máx 8 caracteres)</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={newCode.code} 
                                        onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase().slice(0, 8) })}
                                        placeholder="EJ: VERANO24"
                                        className="border-2 border-black font-black uppercase"
                                        required
                                    />
                                    <Button type="button" variant="outline" onClick={generateRandomCode} className="border-2 border-black">
                                        Azar
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest">Descuento</Label>
                                <div className="flex gap-2">
                                    <select 
                                        value={discountType} 
                                        onChange={(e) => setDiscountType(e.target.value as any)}
                                        className="h-10 px-3 rounded-md border-2 border-black bg-background font-bold text-sm"
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
                                        className="border-2 border-black font-black"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest">Límite de Usos</Label>
                                <Input 
                                    type="number"
                                    value={newCode.maxUses} 
                                    onChange={e => setNewCode({ ...newCode, maxUses: e.target.value })}
                                    className="border-2 border-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest">Descripción</Label>
                                <Input 
                                    value={newCode.description} 
                                    onChange={e => setNewCode({ ...newCode, description: e.target.value })}
                                    placeholder="EJ: Campaña tarjetas físicas"
                                    className="border-2 border-black"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isCreating}
                                className="w-full bg-primary border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#000] transition-all font-black uppercase h-12"
                            >
                                {isCreating ? <Loader2 className="animate-spin" /> : "Crear Cupón"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List of codes */}
                <div className="lg:col-span-2 space-y-4">
                    {codes.length === 0 ? (
                        <div className="text-center p-12 bg-muted/20 rounded-3xl border-4 border-black border-dashed">
                            <Ticket className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="font-bold text-muted-foreground">No hay códigos registrados aún.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {codes.map((code) => (
                                <Card key={code.id} className={cn("border-4 border-black shadow-[4px_4px_0px_0px_#000] rounded-2xl overflow-hidden transition-all", !code.isActive && "opacity-60 grayscale")}>
                                    <div className={cn("h-2 w-full", code.isActive ? "bg-primary" : "bg-muted")} />
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-2xl font-black uppercase tracking-tight">{code.code}</h4>
                                                    <button onClick={() => copyToClipboard(code.code)} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Copiar código">
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase">{code.description || "Sin descripción"}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleToggle(code.id, code.isActive)} className={cn("p-2 rounded-xl border-2 border-black transition-all", code.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")} title={code.isActive ? "Desactivar" : "Activar"}>
                                                    {code.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                </button>
                                                <button onClick={() => handleDelete(code.id)} className="p-2 rounded-xl border-2 border-black bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all" title="Eliminar cupón">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 pt-4 border-t-2 border-black border-dashed">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Valor</p>
                                                <p className="font-black text-primary">{code.discount || "-"}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Usos</p>
                                                <p className="font-black">{code.usedCount} / {code.maxUses || "∞"}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Estado</p>
                                                <p className={cn("text-[10px] font-black uppercase", code.isActive ? "text-emerald-600" : "text-red-600")}>
                                                    {code.isActive ? "Activo" : "Inactivo"}
                                                </p>
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

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
