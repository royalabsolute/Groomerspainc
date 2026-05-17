"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Phone, Mail, MapPin, Layout, Globe, Loader2, Instagram, Facebook, X as XIcon, Sparkles, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { updateSiteConfig } from "@/lib/actions/siteConfig";
import { translateAllMissing } from "@/lib/actions/translate";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { SiteConfig } from "@prisma/client";

interface SettingsFormProps {
    initialData: Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
    } | null;
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
    }>(initialData || {});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const forceTranslateAll = async () => {
        setIsLoading(true);
        toast.loading("Traduciendo vacíos en toda la base de datos...", { id: "translate-all" });
        try {
            const res = await translateAllMissing();
            if (res.success) {
                if (res.count && res.count > 0) {
                    toast.success(`¡${res.count} campos traducidos en toda la web! (Recarga para ver cambios)`, { id: "translate-all" });
                } else {
                    toast.success("Todos los campos ya estaban traducidos.", { id: "translate-all" });
                }
            } else {
                toast.error("Error al traducir: " + res.error, { id: "translate-all" });
            }
        } catch (error) {
            toast.error("Error inesperado al traducir.", { id: "translate-all" });
        } finally {
            setIsLoading(false);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await updateSiteConfig(formData);
            if (result.success) {
                toast.success("Configuración actualizada correctamente");
            } else {
                toast.error("Error al guardar la configuración");
            }
        } catch (error) {
            toast.error("Error al intentar guardar");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
            {/* Contact Info */}
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Información de Contacto</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs font-semibold text-slate-500">Teléfono de contacto</Label>
                            <Input id="phone" value={formData.phone || ""} onChange={handleChange} placeholder="+1 (305) 000-0000" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-semibold text-slate-500">Email público</Label>
                            <Input id="email" type="email" value={formData.email || ""} onChange={handleChange} placeholder="hola@groomingpet.com" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-xs font-semibold text-slate-500">Dirección de local (Miami)</Label>
                        <Input id="address" value={formData.address || ""} onChange={handleChange} placeholder="123 Grooming St, Miami, FL" className="h-11 border-slate-200 rounded-lg" />
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                        <Label htmlFor="notificationEmail" className="text-xs font-bold text-primary uppercase tracking-widest">Email de Notificaciones</Label>
                        <Input id="notificationEmail" type="email" value="groomersincpetspa@gmail.com" disabled className="h-11 border-primary/20 bg-slate-100 rounded-lg font-medium text-slate-500 cursor-not-allowed" />
                        <p className="text-[10px] text-slate-400 font-medium">Este correo recibirá los mensajes directos de los clientes y está fijado por seguridad.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50 pt-4 mt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="hoursEs" className="text-xs font-semibold text-slate-500">Horarios (Español)</Label>
                            <Input id="hoursEs" value={formData.hoursEs || ""} onChange={handleChange} placeholder="Lun - Sab: 9:00 AM - 6:00 PM" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="hoursEn" className="text-xs font-semibold text-slate-500">Hours (English)</Label>
                            <Input id="hoursEn" value={formData.hoursEn || ""} onChange={handleChange} placeholder="Mon - Sat: 9:00 AM - 6:00 PM" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hero Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
                    <Layout className="h-4 w-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Sección Hero (Inicio)</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="heroTitleEs" className="text-xs font-semibold text-slate-500">Título (Español)</Label>
                            <Input id="heroTitleEs" value={formData.heroTitleEs || ""} onChange={handleChange} placeholder="Cuidado de" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="heroTitleEn" className="text-xs font-semibold text-slate-500">Title (English)</Label>
                            <Input id="heroTitleEn" value={formData.heroTitleEn || ""} onChange={handleChange} placeholder="First Class Care" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="heroHighlightEs" className="text-xs font-semibold text-slate-500">Texto Resaltado (ES)</Label>
                            <Input id="heroHighlightEs" value={formData.heroHighlightEs || ""} onChange={handleChange} placeholder="Primera Clase" className="h-11 border-slate-200 rounded-lg italic" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="heroHighlightEn" className="text-xs font-semibold text-slate-500">Highlight Text (EN)</Label>
                            <Input id="heroHighlightEn" value={formData.heroHighlightEn || ""} onChange={handleChange} placeholder="First Class" className="h-11 border-slate-200 rounded-lg italic" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="heroBadgeEs" className="text-xs font-semibold text-slate-500">Etiqueta (Español)</Label>
                            <Input id="heroBadgeEs" value={formData.heroBadgeEs || ""} onChange={handleChange} placeholder="Servicio #1 en Miami" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="heroBadgeEn" className="text-xs font-semibold text-slate-500">Label (English)</Label>
                            <Input id="heroBadgeEn" value={formData.heroBadgeEn || ""} onChange={handleChange} placeholder="#1 Service in Miami" className="h-11 border-slate-200 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="heroDescEs" className="text-xs font-semibold text-slate-500">Descripción (Español)</Label>
                            <Textarea id="heroDescEs" value={formData.heroDescEs || ""} onChange={handleChange} className="min-h-[100px] border-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="heroDescEn" className="text-xs font-semibold text-slate-500">Description (English)</Label>
                            <Textarea id="heroDescEn" value={formData.heroDescEn || ""} onChange={handleChange} className="min-h-[100px] border-slate-200 rounded-lg" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Footer Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
                    <Layout className="h-4 w-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Pie de Página (Footer)</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="footerDescEs" className="text-xs font-semibold text-slate-500">Descripción Footer (Español)</Label>
                            <Textarea id="footerDescEs" value={formData.footerDescEs || ""} onChange={handleChange} className="min-h-[100px] border-slate-200 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="footerDescEn" className="text-xs font-semibold text-slate-500">Footer Description (English)</Label>
                            <Textarea id="footerDescEn" value={formData.footerDescEn || ""} onChange={handleChange} className="min-h-[100px] border-slate-200 rounded-lg" />
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* Social Media */}
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Canales Sociales</h3>
                </div>
                <CardContent className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Instagram */}
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="instagramUrl" className="flex items-center text-xs font-semibold text-slate-500"><Instagram className="h-3.5 w-3.5 mr-2" /> Instagram</Label>
                                <Input id="instagramUrl" value={formData.instagramUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 border-slate-200 rounded-lg" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado Visible</span>
                                <Switch 
                                    checked={formData.instagramActive ?? true} 
                                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, instagramActive: val }))}
                                />
                            </div>
                        </div>

                        {/* TikTok */}
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="tiktokUrl" className="flex items-center text-xs font-semibold text-slate-500">TikTok</Label>
                                <Input id="tiktokUrl" value={formData.tiktokUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 border-slate-200 rounded-lg" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado Visible</span>
                                <Switch 
                                    checked={formData.tiktokActive ?? true} 
                                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, tiktokActive: val }))}
                                />
                            </div>
                        </div>

                        {/* X / Twitter */}
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="twitterUrl" className="flex items-center text-xs font-semibold text-slate-500">
                                    <XIcon className="h-3.5 w-3.5 mr-2" /> X (Twitter)
                                </Label>
                                <Input id="twitterUrl" value={formData.twitterUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 border-slate-200 rounded-lg" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado Visible</span>
                                <Switch 
                                    checked={formData.twitterActive ?? true} 
                                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, twitterActive: val }))}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sections Toggle */}
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-slate-500" />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Activar/Desactivar Módulos</h3>
                </div>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div className="space-y-0.5">
                            <Label htmlFor="transformationsEnabled" className="text-sm font-bold text-slate-900">Módulo de Transformaciones (Antes & Después)</Label>
                            <p className="text-xs text-slate-400 font-medium">Controla si esta sección aparece en el menú público.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={cn("text-[10px] font-bold tracking-widest", formData.transformationsEnabled ? "text-primary" : "text-slate-400")}>
                                {formData.transformationsEnabled ? "ACTIVO" : "INACTIVO"}
                            </span>
                            <Switch 
                                id="transformationsEnabled" 
                                checked={formData.transformationsEnabled || false} 
                                onCheckedChange={(val) => setFormData((prev) => ({ ...prev, transformationsEnabled: val }))} 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-slate-100">
                <Button 
                    type="button" 
                    variant="outline"
                    onClick={forceTranslateAll}
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-lg h-11 border-slate-200 text-slate-600 font-semibold px-6 hover:bg-slate-50"
                >
                    <Sparkles className="mr-2 h-4 w-4 text-primary" /> Traducir campos vacíos
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-lg h-11 px-10 font-bold shadow-md shadow-primary/10"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Guardar Configuración
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
