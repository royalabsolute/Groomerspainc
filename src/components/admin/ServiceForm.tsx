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

// Icon mapping dictionary for Lucide vector icons
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

const serviceSchema = z.object({
    titleEs: z.string().min(3, "El título en español es requerido"),
    titleEn: z.string().min(3, "English title is required"),
    descEs: z.string().min(10, "La descripción es muy corta"),
    descEn: z.string().min(10, "Description is too short"),
    price: z.string().refine((val) => !isNaN(parseFloat(val)), "Precio inválido"),
    active: z.boolean(),
    imageUrl: z.string().optional(),
    icon: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServiceForm({ initialData }: { initialData?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [selectedIcon, setSelectedIcon] = useState<string>(initialData?.icon || "scissors");

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: initialData ? {
            ...initialData,
            price: initialData.price.toString(),
            icon: initialData.icon || "scissors"
        } : {
            titleEs: "",
            titleEn: "",
            descEs: "",
            descEn: "",
            price: "0",
            active: true,
            icon: "scissors",
        },
    });

    async function onSubmit(values: ServiceFormValues) {
        setIsLoading(true);
        try {
            const res = await createService({
                ...values,
                id: initialData?.id,
                price: parseFloat(values.price),
                icon: selectedIcon
            });

            if (res.success) {
                toast.success("Servicio guardado correctamente");
                router.push("/es/admin/services");
                router.refresh();
            } else {
                toast.error("Error: " + res.error);
            }
        } catch (error) {
            toast.error("Error al guardar el servicio");
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-transparent text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Spanish Section */}
                <Card className="border-[#3A3A3A] bg-[#1A1A1A] shadow-xl overflow-hidden rounded-2xl">
                    <div className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50 flex items-center space-x-2">
                        <span className="text-xl">🇪🇸</span>
                        <h3 className="font-black text-xs uppercase tracking-wider text-white">Contenido en Español</h3>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="titleEs" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Título del Servicio</Label>
                            <Input id="titleEs" {...form.register("titleEs")} placeholder="Ej: Corte Premium Spa" className="h-12 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB]" />
                            {form.formState.errors.titleEs && <p className="text-xs text-rose-500 font-bold">{form.formState.errors.titleEs.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="descEs" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Descripción en Español</Label>
                            <Textarea id="descEs" {...form.register("descEs")} placeholder="Describe detalladamente el servicio..." className="min-h-[150px] resize-none bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB] leading-relaxed" />
                            {form.formState.errors.descEs && <p className="text-xs text-rose-500 font-bold">{form.formState.errors.descEs.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* English Section */}
                <Card className="border-[#3A3A3A] bg-[#1A1A1A] shadow-xl overflow-hidden rounded-2xl">
                    <div className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-xl">🇺🇸</span>
                            <h3 className="font-black text-xs uppercase tracking-wider text-white">English Content</h3>
                        </div>
                        <Button 
                            type="button" 
                            size="sm" 
                            onClick={forceTranslateToEnglish}
                            className="bg-[#00DDEB]/10 text-[#00DDEB] hover:bg-[#00DDEB]/20 border border-[#00DDEB]/25 rounded-xl h-8 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                        >
                            <Wand2 className="w-3.5 h-3.5 mr-2" />
                            Traducir con IA
                        </Button>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="titleEn" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Service Title</Label>
                            <Input id="titleEn" {...form.register("titleEn")} placeholder="Ex: Premium Grooming Session" className="h-12 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB]" />
                            {form.formState.errors.titleEn && <p className="text-xs text-rose-500 font-bold">{form.formState.errors.titleEn.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="descEn" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description in English</Label>
                            <Textarea id="descEn" {...form.register("descEn")} placeholder="Detailed service description..." className="min-h-[150px] resize-none bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB] leading-relaxed" />
                            {form.formState.errors.descEn && <p className="text-xs text-rose-500 font-bold">{form.formState.errors.descEn.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Vector Icon Selector Selector de Iconografia */}
                <Card className="border-[#3A3A3A] bg-[#1A1A1A] shadow-xl lg:col-span-2 overflow-hidden rounded-2xl">
                    <div className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50">
                        <h3 className="font-black text-xs uppercase tracking-wider text-white">Selector de Iconografía Vectorial</h3>
                    </div>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
                            {Object.entries(ICON_MAP).map(([key, IconComp]) => {
                                const isSelected = selectedIcon === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedIcon(key)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer h-24 select-none",
                                            isSelected 
                                                ? "bg-[#00DDEB]/15 border-[#00DDEB] text-[#00DDEB] shadow-[0_0_12px_rgba(0,221,235,0.15)]"
                                                : "bg-[#252525] border-[#3A3A3A] text-slate-400 hover:text-white hover:border-[#3A3A3A]*1.5 hover:bg-[#2A2A2A]"
                                        )}
                                    >
                                        <IconComp className="h-7 w-7 mb-2" />
                                        <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full">
                                            {key}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* General Settings */}
                <Card className="border-[#3A3A3A] bg-[#1A1A1A] shadow-xl lg:col-span-2 overflow-hidden rounded-2xl">
                    <div className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50">
                        <h3 className="font-black text-xs uppercase tracking-wider text-white">Configuración General</h3>
                    </div>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Precio base ($)</Label>
                                <Input id="price" type="number" step="0.01" {...form.register("price")} className="h-12 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB] text-lg font-black" />
                                {form.formState.errors.price && <p className="text-xs text-rose-500 font-bold">{form.formState.errors.price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visibilidad del Servicio</Label>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-[#3A3A3A] bg-[#252525]/60">
                                    <div>
                                        <p className="font-black text-xs uppercase tracking-wider">
                                            {form.watch("active") ? (
                                                <span className="text-[#2ECC71]">Visible en la Landing ✔</span>
                                            ) : (
                                                <span className="text-slate-500">Oculto ●</span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1">
                                            {form.watch("active") ? "Los clientes pueden reservar este servicio." : "El servicio no se mostrará para reservar."}
                                        </p>
                                    </div>
                                    <Switch
                                        id="active"
                                        checked={form.watch("active")}
                                        onCheckedChange={(val) => form.setValue("active", val, { shouldDirty: true })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Imagen de Portada del Servicio</Label>
                            {form.watch("imageUrl") ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-[#3A3A3A] group">
                                    <Image
                                        src={form.getValues("imageUrl")!}
                                        alt="Preview"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => form.setValue("imageUrl", "")}
                                        title="Eliminar imagen"
                                        aria-label="Eliminar imagen"
                                        className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center border border-rose-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="h-36 border-2 border-dashed border-[#3A3A3A] rounded-xl flex items-center justify-center bg-[#252525]/30">
                                    <LocalImageUpload
                                        onSuccess={(url: string) => form.setValue("imageUrl", url)}
                                        label="Subir Imagen del Servicio"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:space-x-4 pt-8 pb-16 md:pb-0 border-t border-[#3A3A3A]/50">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="rounded-xl h-11 px-8 w-full sm:w-auto border-[#3A3A3A] text-slate-300 bg-[#1A1A1A] hover:bg-[#252525] hover:text-white font-bold cursor-pointer uppercase tracking-wider text-xs"
                >
                    <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-xl h-11 px-10 shadow-lg bg-[#00DDEB] text-black hover:bg-[#00DDEB]/90 w-full sm:w-auto font-black cursor-pointer uppercase tracking-wider text-xs"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> {initialData ? "Actualizar" : "Crear"} Servicio
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
