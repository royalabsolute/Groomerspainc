"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { 
    Loader2, Scissors, Save, X, Wand2, 
    Sparkles, Droplets, Heart, Award, Gift, Clock, ShieldCheck, HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createService } from "@/lib/actions/services";
import { translateText } from "@/lib/actions/translate";
import LocalImageUpload from "./LocalImageUpload";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// El selector forzará foco nulo para evitar anillos residuales
export const ICON_MAP: Record<string, React.ComponentType<any>> = {
    scissors: Scissors,
    sparkles: Sparkles,
    droplets: Droplets,
    heart: Heart,
    award: Award,
    gift: Gift,
    clock: Clock,
    shield: ShieldCheck,
};

// Las 10 Opciones Premium
export const DEFAULT_INCLUSIONS = [
    { key: "premium_bath", label: "Baño con Champú Premium (Premium Shampoo Bath)" },
    { key: "blow_dry", label: "Secado a Mano Termorregulado (Blow Dry)" },
    { key: "breed_haircut", label: "Corte de Pelo Estilizado según Raza (Breed-Specific Haircut)" },
    { key: "ear_cleaning", label: "Limpieza e Higiene de Oídos (Ear Cleaning & Sanitization)" },
    { key: "nail_trimming", label: "Corte y Limado de Uñas Táctil (Nail Trimming & Grinding)" },
    { key: "teeth_brushing", label: "Cepillado de Dientes y Aliento Fresco (Teeth Brushing)" },
    { key: "anal_glands", label: "Drenaje de Glándulas Analgésicas (Anal Gland Expression)" },
    { key: "dematting", label: "Desenredado y Eliminación de Pelo Muerto (De-matting & De-shedding)" },
    { key: "paw_balm", label: "Tratamiento de Hidratación de Almohadillas (Paw Balm Treatment)" },
    { key: "pet_cologne", label: "Perfume o Colonia Hipoalergénica (Premium Pet Cologne)" }
];

const serviceSchema = z.object({
    titleEs: z.string().min(3, "Requerido"),
    titleEn: z.string().min(3, "Required"),
    descEs: z.string().min(10, "Muy corta"),
    descEn: z.string().min(10, "Too short"),
    price: z.string().refine((val) => !isNaN(parseFloat(val)), "Inválido"),
    active: z.boolean(),
    imageUrl: z.string().optional(),
    icon: z.string().optional(),
    recommendedProducts: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServiceForm({ initialData }: { initialData?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [selectedIcon, setSelectedIcon] = useState<string>(initialData?.icon || "scissors");
    
    // Convertir string "a,b,c" de BD a Array para el UI
    const [selectedInclusions, setSelectedInclusions] = useState<string[]>(
        initialData?.recommendedProducts ? initialData.recommendedProducts.split(",").filter((s:string) => s.trim() !== "") : []
    );

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: initialData ? {
            ...initialData,
            price: initialData.price.toString()
        } : { titleEs: "", titleEn: "", descEs: "", descEn: "", price: "0", active: true }
    });

    const toggleInclusion = (key: string) => {
        setSelectedInclusions(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    async function onSubmit(values: ServiceFormValues) {
        setIsLoading(true);
        try {
            const finalInclusions = selectedInclusions.join(",");
            const res = await createService({
                ...values,
                id: initialData?.id,
                price: parseFloat(values.price),
                icon: selectedIcon,
                recommendedProducts: finalInclusions // Guardado como keys
            });

            if (res.success) {
                toast.success("Servicio guardado");
                router.push("/es/admin/services");
                router.refresh();
            } else throw new Error(res.error);
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    }

    const forceTranslateToEnglish = async () => {
        const titleEs = form.getValues("titleEs");
        const descEs = form.getValues("descEs");
        
        if (titleEs) {
            toast.loading("Traduciendo título...", { id: "translate-title" });
            const res = await translateText(titleEs, "es", "en");
            if (res.success && res.text) {
                form.setValue("titleEn", res.text, { shouldValidate: true });
                toast.success("Título traducido", { id: "translate-title" });
            } else {
                toast.error("Error al traducir el título", { id: "translate-title" });
            }
        }
        
        if (descEs) {
            toast.loading("Traduciendo descripción...", { id: "translate-desc" });
            const res = await translateText(descEs, "es", "en");
            if (res.success && res.text) {
                form.setValue("descEn", res.text, { shouldValidate: true });
                toast.success("Descripción traducida", { id: "translate-desc" });
            } else {
                toast.error("Error al traducir descripción", { id: "translate-desc" });
            }
        }
        
        if (!titleEs && !descEs) {
            toast.error("Escribe algo en español primero");
        }
    };

    return (
        // Grid optimizado de 12 columnas para aprovechar mejor el espacio en escritorio
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-transparent text-white outline-none focus:ring-0 pb-10">
            
            {/* ⬅️ COLUMNA IZQUIERDA: Textos y Datos (Ocupa 7/12 en LG, 8/12 en 2XL) */}
            <div className="space-y-6 lg:col-span-7 2xl:col-span-8">
                <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-[#252525]/30 px-5 py-3 border-b border-[#3A3A3A]/50 flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2"><span className="text-base">🇪🇸</span> Español</span>
                    </div>
                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Título</Label>
                            <Input {...form.register("titleEs")} className="h-11 text-sm bg-[#252525] border-[#3A3A3A] focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] outline-none rounded-xl" />
                            {form.formState.errors.titleEs && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.titleEs.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</Label>
                            <Textarea {...form.register("descEs")} className="h-24 text-sm resize-none bg-[#252525] border-[#3A3A3A] focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] outline-none rounded-xl" />
                            {form.formState.errors.descEs && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.descEs.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-[#252525]/30 px-5 py-3 border-b border-[#3A3A3A]/50 flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2"><span className="text-base">🇺🇸</span> English</span>
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
                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</Label>
                            <Input {...form.register("titleEn")} className="h-11 text-sm bg-[#252525] border-[#3A3A3A] focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] outline-none rounded-xl" />
                            {form.formState.errors.titleEn && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.titleEn.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</Label>
                            <Textarea {...form.register("descEn")} className="h-24 text-sm resize-none bg-[#252525] border-[#3A3A3A] focus-visible:ring-[#7C3AED] focus-visible:border-[#7C3AED] outline-none rounded-xl" />
                            {form.formState.errors.descEn && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.descEn.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-6">
                    <Card className="flex-1 border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl p-5 shadow-xl">
                        <Label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Precio Base</Label>
                        <Input type="number" step="0.01" {...form.register("price")} className="h-12 text-xl font-black text-[#2ECC71] bg-[#252525] border-[#3A3A3A] focus-visible:ring-[#7C3AED] outline-none rounded-xl" />
                        {form.formState.errors.price && <p className="text-xs text-rose-500 font-bold mt-1">{form.formState.errors.price.message}</p>}
                    </Card>
                    <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl p-5 flex flex-col justify-center items-center shadow-xl w-full sm:w-1/3">
                        <Label className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Activo</Label>
                        <Switch checked={form.watch("active")} onCheckedChange={(val) => form.setValue("active", val)} className="data-[state=checked]:bg-[#7C3AED] outline-none scale-110" />
                    </Card>
                </div>
            </div>

            {/* ➡️ COLUMNA DERECHA: Tags Premium e Imagen (Ocupa 5/12 en LG, 4/12 en 2XL) */}
            <div className="space-y-6 flex flex-col lg:col-span-5 2xl:col-span-4">
                <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-[#252525]/30 px-5 py-3 border-b border-[#3A3A3A]/50">
                        <h3 className="font-black text-xs uppercase tracking-widest text-white">Incluye en sesión (Selección Interactiva)</h3>
                    </div>
                    <CardContent className="p-5">
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_INCLUSIONS.map(inc => {
                                const isSelected = selectedInclusions.includes(inc.key);
                                return (
                                    <button 
                                        type="button" 
                                        key={inc.key} 
                                        onClick={() => toggleInclusion(inc.key)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer outline-none focus:ring-0 select-none",
                                            isSelected 
                                            ? "bg-[#7C3AED]/20 border-[#7C3AED] text-[#7C3AED] shadow-sm" 
                                            : "bg-[#252525] border-[#3A3A3A] text-slate-400 hover:border-slate-500"
                                        )}
                                    >
                                        {inc.label.split("(")[0].trim()}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl p-5 shadow-xl">
                    <Label className="text-xs font-semibold text-slate-400 mb-3 block uppercase tracking-wider">Icono Vectorial (Fondo Blanco Limpio)</Label>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(ICON_MAP).map(([key, IconComp]) => (
                            <button
                                key={key} type="button" onClick={() => setSelectedIcon(key)}
                                title={`Seleccionar icono ${key}`}
                                aria-label={`Seleccionar icono ${key}`}
                                className={cn(
                                    "p-3 rounded-2xl transition-all cursor-pointer outline-none focus:ring-0",
                                    selectedIcon === key ? "bg-white text-neutral-950 scale-110 shadow-[0_0_15px_rgba(124,58,237,0.4)]" : "bg-[#252525] text-slate-500 hover:bg-[#3A3A3A]"
                                )}
                            >
                                <IconComp className={cn("h-5 w-5 transition-transform duration-200", selectedIcon === key ? "text-neutral-950 scale-110" : "text-slate-500")} />
                            </button>
                        ))}
                    </div>
                </Card>

                <Card className="border-[#3A3A3A] bg-[#1A1A1A] rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
                    <Label className="text-xs font-semibold text-slate-400 mb-3 block uppercase tracking-wider">Imagen de Portada</Label>
                    <div className="flex-1 min-h-[160px] flex flex-col">
                        <LocalImageUpload onSuccess={(url) => form.setValue("imageUrl", url)} />
                        {form.watch("imageUrl") && (
                            <div className="relative flex-1 w-full mt-4 rounded-xl overflow-hidden border border-[#3A3A3A] min-h-[140px]">
                                <Image src={form.watch("imageUrl")!} alt="Preview" fill unoptimized className="object-cover" />
                            </div>
                        )}
                    </div>
                </Card>

                {/* Footer Fijo Sin Outline Azul */}
                <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-xl bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-black text-sm uppercase tracking-widest shadow-xl focus-visible:ring-0 focus-visible:outline-none focus:outline-none cursor-pointer mt-4 shrink-0">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Guardar Servicio
                </Button>
            </div>
        </form>
    );
}
