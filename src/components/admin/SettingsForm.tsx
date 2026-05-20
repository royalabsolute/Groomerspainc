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
import { translateAllMissing, translateText } from "@/lib/actions/translate";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { SiteConfig } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsFormProps {
    initialData: Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
        workingHoursStart?: string | null;
        workingHoursEnd?: string | null;
        workingDays?: string | null;
        blockedDates?: string | null;
    } | null;
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
    }>(initialData || { workingDays: "1,2,3,4,5", workingHoursStart: "09:00", workingHoursEnd: "18:00" });
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        contact: true,
        booking: true,
        hero: false,
        footer: false,
        social: false,
        modules: false
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

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
                    toast.success(`¡${res.count} campos traducidos! Recargando...`, { id: "translate-all" });
                    setTimeout(() => window.location.reload(), 1500);
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

    const handleAiTranslate = async () => {
        setIsLoading(true);
        const toastId = toast.loading("Traduciendo inputs de Inglés a Español con IA...", { duration: 0 });
        
        try {
            const pairs = [
                { keyEn: "hoursEn", keyEs: "hoursEs" },
                { keyEn: "heroTitleEn", keyEs: "heroTitleEs" },
                { keyEn: "heroHighlightEn", keyEs: "heroHighlightEs" },
                { keyEn: "heroBadgeEn", keyEs: "heroBadgeEs" },
                { keyEn: "heroDescEn", keyEs: "heroDescEs" },
                { keyEn: "footerDescEn", keyEs: "footerDescEs" }
            ];

            let translatedCount = 0;
            const updatedData = { ...formData };

            for (const p of pairs) {
                const enValue = (formData as any)[p.keyEn];
                if (enValue && enValue.trim() !== "") {
                    const res = await translateText(enValue, "en", "es");
                    if (res.success && res.text) {
                        (updatedData as any)[p.keyEs] = res.text;
                        translatedCount++;
                    }
                }
            }

            if (translatedCount > 0) {
                setFormData(updatedData);
                toast.success(`¡Se han traducido ${translatedCount} campos en tiempo real!`, { id: toastId });
            } else {
                toast.error("No se encontraron textos en Inglés para traducir.", { id: toastId });
            }
        } catch (error) {
            console.error("AI Translation Error:", error);
            toast.error("Ocurrió un error al traducir con IA.", { id: toastId });
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
            {/* Top Quick Translation bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1A1A1A] border border-[#3A3A3A] p-4 rounded-2xl gap-4">
                <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Traducción Integrada en Caliente</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Escribe tus textos en Inglés y tradúcelos al Español con un solo clic.</p>
                </div>
                <Button 
                    type="button" 
                    onClick={handleAiTranslate}
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-xl h-10 px-5 font-black bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
                >
                    <Sparkles className="h-4 w-4" />
                    Traducir con IA
                </Button>
            </div>

            {/* Contact Info */}
            <Card className="border-[#3A3A3A] shadow-sm overflow-hidden rounded-2xl bg-[#1A1A1A] hover:border-[#7C3AED]/20 transition-all">
                <div 
                    onClick={() => toggleSection("contact")}
                    className="bg-[#151515] px-6 py-4 border-b border-[#3A3A3A] flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Información de Contacto y Horarios</h3>
                    </div>
                    <span className="text-slate-400 font-bold text-xs">
                        {openSections.contact ? "▲" : "▼"}
                    </span>
                </div>
                <AnimatePresence initial={false}>
                    {openSections.contact && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-[#3A3A3A]"
                        >
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-xs font-semibold text-slate-400">Teléfono de contacto</Label>
                                        <Input id="phone" value={formData.phone || ""} onChange={handleChange} placeholder="+1 (305) 000-0000" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-semibold text-slate-400">Email público</Label>
                                        <Input id="email" type="email" value={formData.email || ""} onChange={handleChange} placeholder="hola@groomingpet.com" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="address" className="text-xs font-semibold text-slate-400">Dirección de local (Miami)</Label>
                                    <Input id="address" value={formData.address || ""} onChange={handleChange} placeholder="123 Grooming St, Miami, FL" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                </div>
                                <div className="space-y-1.5 pt-4 border-t border-[#3A3A3A]">
                                    <Label htmlFor="notificationEmail" className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest">Email de Notificaciones</Label>
                                    <Input id="notificationEmail" type="email" value="groomersincpetspa@gmail.com" disabled className="h-11 border-[#3A3A3A]/40 bg-[#121212]/50 rounded-xl font-medium text-slate-500 cursor-not-allowed" />
                                    <p className="text-[10px] text-slate-500 font-medium">Este correo recibirá los mensajes directos de los clientes y está fijado por seguridad.</p>
                                </div>
                                
                                {/* 2-column comparative layout for horarios */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-[#3A3A3A] pt-6 mt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-1.5 pb-1 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Inglés (English)</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="hoursEn" className="text-xs font-semibold text-slate-400">Hours (English)</Label>
                                            <Input id="hoursEn" value={formData.hoursEn || ""} onChange={handleChange} placeholder="Mon - Sat: 9:00 AM - 6:00 PM" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-1.5 pb-1 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Español</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="hoursEs" className="text-xs font-semibold text-slate-400">Horarios (Español)</Label>
                                            <Input id="hoursEs" value={formData.hoursEs || ""} onChange={handleChange} placeholder="Lun - Sab: 9:00 AM - 6:00 PM" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Booking Settings */}
            <Card className="border-[#3A3A3A] shadow-sm overflow-hidden rounded-2xl bg-[#1A1A1A] hover:border-[#7C3AED]/20 transition-all">
                <div 
                    onClick={() => toggleSection("booking")}
                    className="bg-[#151515] px-6 py-4 border-b border-[#3A3A3A] flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center space-x-2">
                        <Layout className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Logística de Citas y Reservas</h3>
                    </div>
                    <span className="text-slate-400 font-bold text-xs">
                        {openSections.booking ? "▲" : "▼"}
                    </span>
                </div>
                <AnimatePresence initial={false}>
                    {openSections.booking && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-[#3A3A3A]"
                        >
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="workingHoursStart" className="text-xs font-semibold text-slate-400">Hora de Inicio (Laboral)</Label>
                                        <Input id="workingHoursStart" type="time" value={formData.workingHoursStart || "09:00"} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="workingHoursEnd" className="text-xs font-semibold text-slate-400">Hora de Cierre (Laboral)</Label>
                                        <Input id="workingHoursEnd" type="time" value={formData.workingHoursEnd || "18:00"} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="workingDays" className="text-xs font-semibold text-slate-400">Días Laborables (0=Dom, 1=Lun... 6=Sab)</Label>
                                    <Input id="workingDays" value={formData.workingDays || "1,2,3,4,5"} onChange={handleChange} placeholder="Ej: 1,2,3,4,5" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">Por defecto: Lunes a Viernes (1,2,3,4,5). Separa los números con comas.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="blockedDates" className="text-xs font-semibold text-slate-400">Fechas Bloqueadas Manualmente</Label>
                                    <Input id="blockedDates" value={formData.blockedDates || ""} onChange={handleChange} placeholder="Ej: 2024-12-25, 2024-12-31" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">Bloquea días específicos de mantenimiento o vacaciones. Formato: YYYY-MM-DD, separados por comas.</p>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Hero Section */}
            <Card className="border-[#3A3A3A] shadow-sm overflow-hidden rounded-2xl bg-[#1A1A1A] hover:border-[#7C3AED]/20 transition-all">
                <div 
                    onClick={() => toggleSection("hero")}
                    className="bg-[#151515] px-6 py-4 border-b border-[#3A3A3A] flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center space-x-2">
                        <Layout className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Sección Hero (Inicio)</h3>
                    </div>
                    <span className="text-slate-400 font-bold text-xs">
                        {openSections.hero ? "▲" : "▼"}
                    </span>
                </div>
                <AnimatePresence initial={false}>
                    {openSections.hero && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-[#3A3A3A]"
                        >
                            <CardContent className="p-6">
                                {/* 2-column comparative layout for Hero translation comparison */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column - English */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Inglés (English)</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroTitleEn" className="text-xs font-semibold text-slate-400">Title (English)</Label>
                                            <Input id="heroTitleEn" value={formData.heroTitleEn || ""} onChange={handleChange} placeholder="First Class Care" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroHighlightEn" className="text-xs font-semibold text-slate-400">Highlight Text (EN)</Label>
                                            <Input id="heroHighlightEn" value={formData.heroHighlightEn || ""} onChange={handleChange} placeholder="First Class" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] italic" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroBadgeEn" className="text-xs font-semibold text-slate-400">Label (English)</Label>
                                            <Input id="heroBadgeEn" value={formData.heroBadgeEn || ""} onChange={handleChange} placeholder="#1 Service in Miami" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroDescEn" className="text-xs font-semibold text-slate-400">Description (English)</Label>
                                            <Textarea id="heroDescEn" value={formData.heroDescEn || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>

                                    {/* Right Column - Español */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Español</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroTitleEs" className="text-xs font-semibold text-slate-400">Título (Español)</Label>
                                            <Input id="heroTitleEs" value={formData.heroTitleEs || ""} onChange={handleChange} placeholder="Cuidado de" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroHighlightEs" className="text-xs font-semibold text-slate-400">Texto Resaltado (ES)</Label>
                                            <Input id="heroHighlightEs" value={formData.heroHighlightEs || ""} onChange={handleChange} placeholder="Primera Clase" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] italic" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroBadgeEs" className="text-xs font-semibold text-slate-400">Etiqueta (Español)</Label>
                                            <Input id="heroBadgeEs" value={formData.heroBadgeEs || ""} onChange={handleChange} placeholder="Servicio #1 en Miami" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroDescEs" className="text-xs font-semibold text-slate-400">Descripción (Español)</Label>
                                            <Textarea id="heroDescEs" value={formData.heroDescEs || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Footer Section */}
            <Card className="border-[#3A3A3A] shadow-sm overflow-hidden rounded-2xl bg-[#1A1A1A] hover:border-[#7C3AED]/20 transition-all">
                <div 
                    onClick={() => toggleSection("footer")}
                    className="bg-[#151515] px-6 py-4 border-b border-[#3A3A3A] flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center space-x-2">
                        <Layout className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Pie de Página (Footer)</h3>
                    </div>
                    <span className="text-slate-400 font-bold text-xs">
                        {openSections.footer ? "▲" : "▼"}
                    </span>
                </div>
                <AnimatePresence initial={false}>
                    {openSections.footer && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-[#3A3A3A]"
                        >
                            <CardContent className="p-6">
                                {/* 2-column comparative layout for Footer translation */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Inglés (English)</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="footerDescEn" className="text-xs font-semibold text-slate-400">Footer Description (English)</Label>
                                            <Textarea id="footerDescEn" value={formData.footerDescEn || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Español</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="footerDescEs" className="text-xs font-semibold text-slate-400">Descripción Footer (Español)</Label>
                                            <Textarea id="footerDescEs" value={formData.footerDescEs || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Social Media */}
            <Card className="border-[#3A3A3A] shadow-sm overflow-hidden rounded-2xl bg-[#1A1A1A] hover:border-[#7C3AED]/20 transition-all">
                <div 
                    onClick={() => toggleSection("social")}
                    className="bg-[#151515] px-6 py-4 border-b border-[#3A3A3A] flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Canales Sociales</h3>
                    </div>
                    <span className="text-slate-400 font-bold text-xs">
                        {openSections.social ? "▲" : "▼"}
                    </span>
                </div>
                <AnimatePresence initial={false}>
                    {openSections.social && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-[#3A3A3A]"
                        >
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Instagram */}
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="instagramUrl" className="flex items-center text-xs font-semibold text-slate-400"><Instagram className="h-3.5 w-3.5 mr-2 text-[#7C3AED]" /> Instagram</Label>
                                            <Input id="instagramUrl" value={formData.instagramUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 bg-[#151515] rounded-xl border border-[#3A3A3A]">
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
                                            <Label htmlFor="tiktokUrl" className="flex items-center text-xs font-semibold text-slate-400">TikTok</Label>
                                            <Input id="tiktokUrl" value={formData.tiktokUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 bg-[#151515] rounded-xl border border-[#3A3A3A]">
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
                                            <Label htmlFor="twitterUrl" className="flex items-center text-xs font-semibold text-slate-400">
                                                <XIcon className="h-3.5 w-3.5 mr-2 text-white" /> X (Twitter)
                                            </Label>
                                            <Input id="twitterUrl" value={formData.twitterUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 bg-[#151515] rounded-xl border border-[#3A3A3A]">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado Visible</span>
                                            <Switch 
                                                checked={formData.twitterActive ?? true} 
                                                onCheckedChange={(val) => setFormData(prev => ({ ...prev, twitterActive: val }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Sections Toggle */}
            <Card className="border-[#3A3A3A] shadow-sm overflow-hidden rounded-2xl bg-[#1A1A1A] hover:border-[#7C3AED]/20 transition-all">
                <div 
                    onClick={() => toggleSection("modules")}
                    className="bg-[#151515] px-6 py-4 border-b border-[#3A3A3A] flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Activar/Desactivar Módulos</h3>
                    </div>
                    <span className="text-slate-400 font-bold text-xs">
                        {openSections.modules ? "▲" : "▼"}
                    </span>
                </div>
                <AnimatePresence initial={false}>
                    {openSections.modules && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-[#3A3A3A]"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between p-4 bg-[#151515] rounded-xl border border-[#3A3A3A]">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="transformationsEnabled" className="text-sm font-bold text-white">Módulo de Transformaciones (Antes & Después)</Label>
                                        <p className="text-xs text-slate-500 font-medium">Controla si esta sección aparece en el menú público.</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={cn("text-[10px] font-bold tracking-widest", formData.transformationsEnabled ? "text-[#7C3AED]" : "text-slate-500")}>
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-[#3A3A3A]">
                <Button 
                    type="button" 
                    variant="outline"
                    onClick={forceTranslateAll}
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-xl h-11 border-[#3A3A3A] text-slate-300 font-semibold px-6 hover:bg-[#252525] hover:text-white bg-transparent"
                >
                    <Sparkles className="mr-2 h-4 w-4 text-[#7C3AED]" /> Traducir campos vacíos
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-xl h-11 px-10 font-bold bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 shadow-md shadow-[#7C3AED]/10 cursor-pointer"
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
