"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createService } from "@/lib/actions/services";
import { translateText } from "@/lib/actions/translate";
import { Switch } from "@/components/ui/switch";

const serviceSchema = z.object({
    nameEs: z.string().min(3, "Requerido"),
    nameEn: z.string().min(3, "Required"),
    category: z.enum(["MAIN_GROOMING", "ADDON_TREATMENT", "SPECIAL_SHAMPOO"]),
    basePrice: z.string().refine((val) => !isNaN(parseFloat(val)), "Inválido"),
    isActive: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServiceForm({ initialData }: { initialData?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: initialData ? {
            nameEs: initialData.nameEs || "",
            nameEn: initialData.nameEn || "",
            category: initialData.category || "MAIN_GROOMING",
            basePrice: initialData.basePrice ? initialData.basePrice.toString() : "0",
            isActive: initialData.isActive !== undefined ? initialData.isActive : true
        } : { 
            nameEs: "", 
            nameEn: "", 
            category: "MAIN_GROOMING", 
            basePrice: "0", 
            isActive: true 
        }
    });

    async function onSubmit(values: ServiceFormValues) {
        setIsLoading(true);
        try {
            const res = await createService({
                id: initialData?.id,
                nameEs: values.nameEs,
                nameEn: values.nameEn,
                category: values.category,
                basePrice: parseFloat(values.basePrice),
                isActive: values.isActive
            });

            if (res.success) {
                toast.success("Servicio guardado con éxito");
                router.push("/es/admin/services");
                router.refresh();
            } else {
                throw new Error(res.error);
            }
        } catch (error) {
            toast.error("Error al guardar el servicio");
        } finally {
            setIsLoading(false);
        }
    }

    const forceTranslateToEnglish = async () => {
        const nameEs = form.getValues("nameEs");
        if (nameEs) {
            toast.loading("Traduciendo nombre...", { id: "translate-name" });
            const res = await translateText(nameEs, "es", "en");
            if (res.success && res.text) {
                form.setValue("nameEn", res.text, { shouldValidate: true });
                toast.success("Nombre traducido", { id: "translate-name" });
            } else {
                toast.error("Error al traducir el nombre", { id: "translate-name" });
            }
        } else {
            toast.error("Escribe el nombre en español primero");
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-6 bg-transparent text-white outline-none focus:ring-0 pb-10">
            <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#252525]/30 px-5 py-3 border-b border-[#3A3A3A]/50 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                        <span className="text-base">📝</span> Datos del Servicio
                    </span>
                </div>
                
                <CardContent className="p-6 space-y-6">
                    {/* Spanish Name */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre (Español)</Label>
                        <Input 
                            {...form.register("nameEs")} 
                            placeholder="Ej: Corte y Estilo"
                            className="h-11 text-sm bg-[#252525] border-[#3A3A3A] text-white focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] outline-none rounded-xl" 
                        />
                        {form.formState.errors.nameEs && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.nameEs.message}</p>}
                    </div>

                    {/* English Name with Auto Translate */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name (English)</Label>
                            <Button 
                                type="button" 
                                size="sm" 
                                onClick={forceTranslateToEnglish}
                                className="bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 border border-[#7C3AED]/25 rounded-xl h-8 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4 outline-none"
                            >
                                <Wand2 className="w-3.5 h-3.5 mr-2" />
                                Traducir
                            </Button>
                        </div>
                        <Input 
                            {...form.register("nameEn")} 
                            placeholder="Ej: Cut & Style"
                            className="h-11 text-sm bg-[#252525] border-[#3A3A3A] text-white focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] outline-none rounded-xl" 
                        />
                        {form.formState.errors.nameEn && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.nameEn.message}</p>}
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría</Label>
                        <select
                            {...form.register("category")}
                            className="flex h-11 w-full rounded-xl border border-[#3A3A3A] bg-[#252525] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7C3AED] font-bold"
                        >
                            <option value="MAIN_GROOMING">Servicio Principal (Cortes/Baños)</option>
                            <option value="ADDON_TREATMENT">Tratamiento / Add-on (Limpiezas/Extra)</option>
                            <option value="SPECIAL_SHAMPOO">Baño Especial (Champús Medicados)</option>
                        </select>
                        {form.formState.errors.category && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.category.message}</p>}
                    </div>

                    {/* Base Price & Active Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio Base estándar ($)</Label>
                            <Input 
                                type="number" 
                                step="0.01" 
                                {...form.register("basePrice")} 
                                className="h-11 text-lg font-black text-[#2ECC71] bg-[#252525] border-[#3A3A3A] focus-visible:ring-[#7C3AED] outline-none rounded-xl" 
                            />
                            {form.formState.errors.basePrice && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.basePrice.message}</p>}
                        </div>

                        <div className="border border-[#3A3A3A] bg-[#252525]/30 rounded-xl p-4 flex justify-between items-center">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Servicio Activo</Label>
                                <p className="text-[10px] text-slate-500 font-bold">Determina si aparece en el cotizador público.</p>
                            </div>
                            <Switch 
                                checked={form.watch("isActive")} 
                                onCheckedChange={(val) => form.setValue("isActive", val)} 
                                className="data-[state=checked]:bg-[#7C3AED] outline-none scale-110" 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/es/admin/services")}
                    className="flex-1 h-12 rounded-xl border-[#3A3A3A] text-slate-300 hover:bg-[#252525] hover:text-white font-bold transition-all"
                >
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-1 h-12 rounded-xl bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-black text-sm uppercase tracking-widest shadow-xl cursor-pointer"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Guardar Servicio
                </Button>
            </div>
        </form>
    );
}
