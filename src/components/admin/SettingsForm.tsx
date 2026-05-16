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
import Image from "next/image";
import type { SiteConfig } from "@prisma/client";

interface SettingsFormProps {
    initialData: Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        facebookActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
    } | null;
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        facebookActive?: boolean;
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
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Info */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Información de Contacto</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono de contacto</Label>
                            <Input id="phone" value={formData.phone || ""} onChange={handleChange} placeholder="+1 (305) 000-0000" className="h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email público</Label>
                            <Input id="email" type="email" value={formData.email || ""} onChange={handleChange} placeholder="hola@groomingpet.com" className="h-12" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección de local (Miami)</Label>
                        <Input id="address" value={formData.address || ""} onChange={handleChange} placeholder="123 Grooming St, Miami, FL" className="h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notificationEmail" className="text-primary font-bold">Email de Notificaciones de Contacto</Label>
                        <Input id="notificationEmail" type="email" value={formData.notificationEmail || ""} onChange={handleChange} placeholder="notificaciones@groomingpet.com" className="h-12 border-primary/30" />
                        <p className="text-[10px] text-muted-foreground italic">Este es el correo donde recibirás los mensajes que los clientes envíen por el formulario de la web.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Hero Section */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center space-x-2">
                    <Layout className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Sección Hero (Inicio)</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="heroTitleEs">Título (Español)</Label>
                                <Input id="heroTitleEs" value={formData.heroTitleEs || ""} onChange={handleChange} placeholder="Cuidado de" className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroTitleEn">Title (English)</Label>
                                <Input id="heroTitleEn" value={formData.heroTitleEn || ""} onChange={handleChange} placeholder="First Class Care" className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroHighlightEs">Texto Resaltado (Español)</Label>
                                <Input id="heroHighlightEs" value={formData.heroHighlightEs || ""} onChange={handleChange} placeholder="Primera Clase" className="h-12 font-serif italic" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroHighlightEn">Highlight Text (English)</Label>
                                <Input id="heroHighlightEn" value={formData.heroHighlightEn || ""} onChange={handleChange} placeholder="First Class" className="h-12 font-serif italic" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroBadgeEs">Badge/Etiqueta (Español)</Label>
                                <Input id="heroBadgeEs" value={formData.heroBadgeEs || ""} onChange={handleChange} placeholder="Servicio #1 en Miami" className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroBadgeEn">Badge/Label (English)</Label>
                                <Input id="heroBadgeEn" value={formData.heroBadgeEn || ""} onChange={handleChange} placeholder="#1 Service in Miami" className="h-12" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="heroDescEs">Descripción (Español)</Label>
                            <Textarea id="heroDescEs" value={formData.heroDescEs || ""} onChange={handleChange} className="min-h-[100px]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heroDescEn">Description (English)</Label>
                            <Textarea id="heroDescEn" value={formData.heroDescEn || ""} onChange={handleChange} className="min-h-[100px]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Section Preview/Content */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Sección de Contacto (Contenido)</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="contactTitleEs">Título Contacto (Español)</Label>
                            <Input id="contactTitleEs" value={formData.contactTitleEs || ""} onChange={handleChange} placeholder="Contáctanos" className="h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactTitleEn">Contact Title (English)</Label>
                            <Input id="contactTitleEn" value={formData.contactTitleEn || ""} onChange={handleChange} placeholder="Contact Us" className="h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactSubtitleEs">Subtítulo (Español)</Label>
                            <Input id="contactSubtitleEs" value={formData.contactSubtitleEs || ""} onChange={handleChange} placeholder="¿Listo para mimar a tu mascota?" className="h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactSubtitleEn">Subtitle (English)</Label>
                            <Input id="contactSubtitleEn" value={formData.contactSubtitleEn || ""} onChange={handleChange} placeholder="Ready to pamper your pet?" className="h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hoursEs">Horario (Español)</Label>
                            <Input id="hoursEs" value={formData.hoursEs || ""} onChange={handleChange} placeholder="Lun - Sáb: 9:00 AM - 6:00 PM" className="h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hoursEn">Hours (English)</Label>
                            <Input id="hoursEn" value={formData.hoursEn || ""} onChange={handleChange} placeholder="Mon - Sat: 9:00 AM - 6:00 PM" className="h-12" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Footer Section */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center space-x-2">
                    <Layout className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Pie de Página (Footer)</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="footerDescEs">Descripción Footer (Español)</Label>
                        <Textarea id="footerDescEs" value={formData.footerDescEs || ""} onChange={handleChange} className="min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="footerDescEn">Footer Description (English)</Label>
                        <Textarea id="footerDescEn" value={formData.footerDescEn || ""} onChange={handleChange} className="min-h-[80px]" />
                    </div>
                </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Redes Sociales</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Instagram */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="instagramUrl" className="flex items-center"><Instagram className="h-4 w-4 mr-2" /> Instagram URL</Label>
                                <Input id="instagramUrl" value={formData.instagramUrl || ""} onChange={handleChange} placeholder="https://instagram.com/..." className="h-12" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/10">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Activar Instagram</Label>
                                <Switch 
                                    checked={formData.instagramActive ?? true} 
                                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, instagramActive: val }))}
                                />
                            </div>
                        </div>

                        {/* Facebook */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="facebookUrl" className="flex items-center"><Facebook className="h-4 w-4 mr-2" /> Facebook URL</Label>
                                <Input id="facebookUrl" value={formData.facebookUrl || ""} onChange={handleChange} placeholder="https://facebook.com/..." className="h-12" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/10">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Activar Facebook</Label>
                                <Switch 
                                    checked={formData.facebookActive ?? true} 
                                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, facebookActive: val }))}
                                />
                            </div>
                        </div>

                        {/* X / Twitter */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="twitterUrl" className="flex items-center">
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2 fill-current">
                                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293l13.314 17.411z" />
                                    </svg>
                                    X (Twitter) URL
                                </Label>
                                <Input id="twitterUrl" value={formData.twitterUrl || ""} onChange={handleChange} placeholder="https://x.com/..." className="h-12" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/10">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Activar X (Twitter)</Label>
                                <Switch 
                                    checked={formData.twitterActive ?? true} 
                                    onCheckedChange={(val) => setFormData(prev => ({ ...prev, twitterActive: val }))}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm overflow-hidden mt-8">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Configuración de Secciones</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/20">
                        <div className="space-y-0.5">
                            <Label htmlFor="transformationsEnabled" className="text-base font-bold">Página de Transformaciones (Antes & Después)</Label>
                            <p className="text-sm text-muted-foreground italic">Si está activado, se mostrará en el menú y será accesible públicamente.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={formData.transformationsEnabled ? "text-primary font-bold text-xs" : "text-muted-foreground text-xs"}>
                                {formData.transformationsEnabled ? "ACTIVADA ✔" : "DESACTIVADA ●"}
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

            <div className="flex flex-col sm:flex-row justify-end pt-4 gap-4 sm:space-x-4">
                <Button 
                    type="button" 
                    variant="secondary"
                    onClick={forceTranslateAll}
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-4 sm:px-8 text-sm sm:text-lg font-bold shadow-xl bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all"
                >
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Traducir Vacíos con IA
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-4 sm:px-12 text-sm sm:text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Guardar Cambios
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
