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
import { translateText } from "@/lib/actions/translate";
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
        weightTier1Price?: number | null;
        weightTier2Price?: number | null;
        weightTier3Price?: number | null;
        weightTier4Price?: number | null;
    } | null;
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
        weightTier1Price?: number | null;
        weightTier2Price?: number | null;
        weightTier3Price?: number | null;
        weightTier4Price?: number | null;
    }>(initialData || { workingDays: "1,2,3,4,5", workingHoursStart: "09:00", workingHoursEnd: "18:00" });
    const [newBlockedDate, setNewBlockedDate] = useState("");
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        contact: true,
        booking: true,
        weight: false,
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

    const handleAddBlockedDate = () => {
        if (!newBlockedDate) return;
        const currentArray = formData.blockedDates 
            ? formData.blockedDates.split(",").map(d => d.trim()).filter(Boolean) 
            : [];
        if (currentArray.includes(newBlockedDate)) {
            toast.error("Esta fecha ya se encuentra bloqueada");
            return;
        }
        const updated = [...currentArray, newBlockedDate].sort();
        setFormData(prev => ({ ...prev, blockedDates: updated.join(",") }));
        setNewBlockedDate("");
        toast.success("Fecha agregada al bloqueo");
    };

    const handleRemoveBlockedDate = (dateToRemove: string) => {
        const currentArray = formData.blockedDates 
            ? formData.blockedDates.split(",").map(d => d.trim()).filter(Boolean) 
            : [];
        const updated = currentArray.filter(d => d !== dateToRemove);
        setFormData(prev => ({ ...prev, blockedDates: updated.join(",") }));
        toast.success("Fecha removida del bloqueo");
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
                                    <Input id="notificationEmail" type="email" value={formData.notificationEmail || ""} onChange={handleChange} placeholder="groomersincpetspa@gmail.com" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                    <p className="text-[10px] text-slate-500 font-medium">Este correo recibirá las notificaciones de cotizaciones de los clientes.</p>
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
                                {(() => {
                                    // Generamos opciones de 06:00 a 22:00 en intervalos de 30 mins
                                    const timeOptions: string[] = [];
                                    for (let h = 6; h <= 22; h++) {
                                        const hh = h.toString().padStart(2, "0");
                                        timeOptions.push(`${hh}:00`);
                                        if (h !== 22) {
                                            timeOptions.push(`${hh}:30`);
                                        }
                                    }
                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="workingHoursStart" className="text-xs font-semibold text-slate-400">Hora de Inicio (Laboral)</Label>
                                                <select 
                                                    id="workingHoursStart" 
                                                    title="Hora de Inicio"
                                                    value={formData.workingHoursStart || "09:00"} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                                                    className="w-full h-11 bg-[#121212] border border-[#3A3A3A] text-white rounded-xl px-3 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                                                >
                                                    {timeOptions.map(t => (
                                                        <option key={t} value={t} className="bg-[#1A1A1A]">{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="workingHoursEnd" className="text-xs font-semibold text-slate-400">Hora de Cierre (Laboral)</Label>
                                                <select 
                                                    id="workingHoursEnd" 
                                                    title="Hora de Cierre"
                                                    value={formData.workingHoursEnd || "18:00"} 
                                                    onChange={(e) => setFormData(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                                                    className="w-full h-11 bg-[#121212] border border-[#3A3A3A] text-white rounded-xl px-3 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                                                >
                                                    {timeOptions.map(t => (
                                                        <option key={t} value={t} className="bg-[#1A1A1A]">{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })()}
                                
                                <div className="space-y-1.5 pt-4 border-t border-[#3A3A3A]/40">
                                    <Label className="text-xs font-semibold text-slate-400">Días Laborables Habilitados</Label>
                                    {(() => {
                                        const activeDays = formData.workingDays ? formData.workingDays.split(",").map(d => d.trim()).filter(Boolean) : ["1", "2", "3", "4", "5"];
                                        const daysOfWeek = [
                                            { value: "1", label: "Lunes" },
                                            { value: "2", label: "Martes" },
                                            { value: "3", label: "Miércoles" },
                                            { value: "4", label: "Jueves" },
                                            { value: "5", label: "Viernes" },
                                            { value: "6", label: "Sábado" },
                                            { value: "0", label: "Domingo" }
                                        ];
                                        return (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-2">
                                                {daysOfWeek.map((day) => {
                                                    const isChecked = activeDays.includes(day.value);
                                                    return (
                                                        <button
                                                            key={day.value}
                                                            type="button"
                                                            onClick={() => {
                                                                let newDays;
                                                                if (isChecked) {
                                                                    newDays = activeDays.filter(d => d !== day.value);
                                                                } else {
                                                                    newDays = [...activeDays, day.value];
                                                                }
                                                                newDays.sort();
                                                                setFormData(prev => ({ ...prev, workingDays: newDays.join(",") }));
                                                            }}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 font-bold transition-all text-xs select-none cursor-pointer",
                                                                isChecked
                                                                    ? "bg-[#7C3AED]/20 border-[#7C3AED] text-[#C084FC]"
                                                                    : "bg-[#121212] border-[#3A3A3A] text-slate-400 hover:border-[#7C3AED]/50"
                                                            )}
                                                        >
                                                            <span>{day.label}</span>
                                                            <span className={cn("text-[9px] mt-1 uppercase font-black tracking-wider", isChecked ? "text-[#7C3AED]" : "text-slate-600")}>
                                                                {isChecked ? "Trabaja" : "Libre"}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                    <p className="text-[10px] text-slate-500 font-medium mt-1.5">Haz clic en cada día para activar o desactivar la disponibilidad laboral en el cotizador público.</p>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-[#3A3A3A]/40">
                                    <Label className="text-xs font-semibold text-slate-400">Bloquear Fechas Específicas (Feriados, Mantenimiento, etc.)</Label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Input 
                                            type="date" 
                                            value={newBlockedDate} 
                                            onChange={(e) => setNewBlockedDate(e.target.value)} 
                                            className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] max-w-xs"
                                        />
                                        <Button 
                                            type="button" 
                                            onClick={handleAddBlockedDate}
                                            className="h-11 bg-[#7C3AED] text-white rounded-xl px-6 hover:bg-[#7C3AED]/90 font-black uppercase text-xs tracking-wider cursor-pointer"
                                        >
                                            Bloquear Fecha
                                        </Button>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Fechas Bloqueadas Activas:</span>
                                        {(() => {
                                            const blockedDatesArray = formData.blockedDates 
                                                ? formData.blockedDates.split(",").map(d => d.trim()).filter(Boolean) 
                                                : [];
                                            if (blockedDatesArray.length === 0) {
                                                return <p className="text-xs text-slate-600 italic">No hay ninguna fecha bloqueada actualmente.</p>;
                                            }
                                            return (
                                                <div className="flex flex-wrap gap-2">
                                                    {blockedDatesArray.map((d) => (
                                                        <div 
                                                            key={d} 
                                                            className="inline-flex items-center gap-1.5 bg-[#121212] border border-[#3A3A3A] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:border-rose-500/50 transition-all shadow-xs"
                                                        >
                                                            <span>{d}</span>
                                                            <button
                                                                type="button"
                                                                title="Desbloquear fecha"
                                                                onClick={() => handleRemoveBlockedDate(d)}
                                                                className="text-slate-500 hover:text-rose-500 p-0.5 rounded-md hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Weight Tiers Pricing Settings */}
            <Card className="border-[#3A3A3A] shadow-sm overflow-hidden rounded-2xl bg-[#1A1A1A] hover:border-[#7C3AED]/20 transition-all">
                <div 
                    onClick={() => toggleSection("weight")}
                    className="bg-[#151515] px-6 py-4 border-b border-[#3A3A3A] flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Tarifas de Peso (Base Peso)</h3>
                    </div>
                    <span className="text-slate-400 font-bold text-xs">
                        {openSections.weight ? "▲" : "▼"}
                    </span>
                </div>
                <AnimatePresence initial={false}>
                    {openSections.weight && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-[#3A3A3A]"
                        >
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="weightTier1Price" className="text-xs font-semibold text-slate-400">Pequeño (&lt; 15 lbs) ($)</Label>
                                        <Input id="weightTier1Price" type="number" step="0.01" value={formData.weightTier1Price ?? 45.0} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="weightTier2Price" className="text-xs font-semibold text-slate-400">Mediano (15 a 29 lbs) ($)</Label>
                                        <Input id="weightTier2Price" type="number" step="0.01" value={formData.weightTier2Price ?? 60.0} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="weightTier3Price" className="text-xs font-semibold text-slate-400">Grande (30 a 59 lbs) ($)</Label>
                                        <Input id="weightTier3Price" type="number" step="0.01" value={formData.weightTier3Price ?? 75.0} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="weightTier4Price" className="text-xs font-semibold text-slate-400">Gigante (60+ lbs) ($)</Label>
                                        <Input id="weightTier4Price" type="number" step="0.01" value={formData.weightTier4Price ?? 95.0} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold">Estas tarifas base por peso de mascotas se aplican automáticamente en el cotizador en tiempo real según el peso de cada perro ingresado por el usuario.</p>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-[#3A3A3A]">
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
