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
import { Loader2, Scissors, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createService } from "@/lib/actions/services";
import { translateText } from "@/lib/actions/translate";
import { Wand2 } from "lucide-react";
import LocalImageUpload from "./LocalImageUpload";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";

const serviceSchema = z.object({
    titleEs: z.string().min(3, "El título en español es requerido"),
    titleEn: z.string().min(3, "English title is required"),
    descEs: z.string().min(10, "La descripción es muy corta"),
    descEn: z.string().min(10, "Description is too short"),
    price: z.string().refine((val) => !isNaN(parseFloat(val)), "Precio inválido"),
    active: z.boolean(),
    imageUrl: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServiceForm({ initialData }: { initialData?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: initialData ? {
            ...initialData,
            price: initialData.price.toString()
        } : {
            titleEs: "",
            titleEn: "",
            descEs: "",
            descEn: "",
            price: "0",
            active: true,
        },
    });

    async function onSubmit(values: ServiceFormValues) {
        setIsLoading(true);
        try {
            const res = await createService({
                ...values,
                id: initialData?.id,
                price: parseFloat(values.price)
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

    // Explicit translate function
    const forceTranslateToEnglish = async () => {
        const titleEs = form.getValues("titleEs");
        const descEs = form.getValues("descEs");
        
        let translatedTitles = false;
        
        if (titleEs) {
            toast.loading("Traduciendo título...", { id: "translate-title" });
            const res = await translateText(titleEs, "es", "en");
            if (res.success && res.text) {
                form.setValue("titleEn", res.text, { shouldValidate: true });
                translatedTitles = true;
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
                translatedTitles = true;
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Spanish Section */}
                <Card className="border-border/40 shadow-sm overflow-hidden">
                    <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center space-x-2">
                        <span className="text-xl">🇪🇸</span>
                        <h3 className="font-bold">Contenido en Español</h3>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="titleEs">Título del Servicio</Label>
                            <Input id="titleEs" {...form.register("titleEs")} placeholder="Ej: Corte Full" className="h-12" />
                            {form.formState.errors.titleEs && <p className="text-xs text-red-500">{form.formState.errors.titleEs.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="descEs">Descripción</Label>
                            <Textarea id="descEs" {...form.register("descEs")} placeholder="Describe detalladamente el servicio..." className="min-h-[150px] resize-none" />
                            {form.formState.errors.descEs && <p className="text-xs text-red-500">{form.formState.errors.descEs.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* English Section */}
                <Card className="border-border/40 shadow-sm overflow-hidden">
                    <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-xl">🇺🇸</span>
                            <h3 className="font-bold">English Content</h3>
                        </div>
                        <Button 
                            type="button" 
                            size="sm" 
                            variant="secondary" 
                            onClick={forceTranslateToEnglish}
                            className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Traducir con IA
                        </Button>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="titleEn">Service Title</Label>
                            <Input id="titleEn" {...form.register("titleEn")} placeholder="Ex: Full Grooming" className="h-12" />
                            {form.formState.errors.titleEn && <p className="text-xs text-red-500">{form.formState.errors.titleEn.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="descEn">Description</Label>
                            <Textarea id="descEn" {...form.register("descEn")} placeholder="Detailed service description..." className="min-h-[150px] resize-none" />
                            {form.formState.errors.descEn && <p className="text-xs text-red-500">{form.formState.errors.descEn.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* General Settings */}
                <Card className="border-border/40 shadow-sm lg:col-span-2 overflow-hidden">
                    <div className="bg-muted/30 px-6 py-4 border-b border-border/20">
                        <h3 className="font-bold">Configuración General</h3>
                    </div>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio base ($)</Label>
                                <Input id="price" type="number" step="0.01" {...form.register("price")} className="h-12 text-lg font-bold text-primary" />
                                {form.formState.errors.price && <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>}
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Visibilidad del Servicio</Label>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/20">
                                    <div>
                                        <p className="font-bold text-sm">
                                            {form.watch("active") ? (
                                                <span className="text-green-600">Visible en página ✔</span>
                                            ) : (
                                                <span className="text-muted-foreground">Oculto en página ●</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {form.watch("active") ? "Los clientes pueden ver este servicio" : "El servicio está oculto para los clientes"}
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
                            <Label>Imagen del Servicio</Label>
                            {form.watch("imageUrl") ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-border/40 group">
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
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="h-32 border-2 border-dashed border-border/60 rounded-xl flex items-center justify-center bg-muted/20">
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

            <div className="flex justify-end items-center space-x-4 pt-8 border-t border-border/20">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="rounded-full h-12 px-8"
                >
                    <X className="mr-2 h-5 w-5" /> Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full h-12 px-10 shadow-lg shadow-primary/20"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" /> {initialData ? "Actualizar" : "Crear"} Servicio
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
