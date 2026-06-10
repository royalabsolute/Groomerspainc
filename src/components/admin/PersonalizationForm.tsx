"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Layout, Globe, Loader2, Instagram, Facebook, Sparkles, Layers, Palette, Eye, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { updateSiteConfig } from "@/lib/actions/siteConfig";
import { translateText } from "@/lib/actions/translate";
import { cn } from "@/lib/utils";
import type { SiteConfig } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

interface PersonalizationFormProps {
    initialData: Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
        heroSectionActive?: boolean;
        servicesSectionActive?: boolean;
        testimonialsSectionActive?: boolean;
        gallerySectionActive?: boolean;
    } | null;
}

type TabType = "hero" | "footer" | "design" | "social";

export default function PersonalizationForm({ initialData }: PersonalizationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("hero");
    const [formData, setFormData] = useState<Partial<SiteConfig> & { 
        transformationsEnabled?: boolean;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
        heroSectionActive?: boolean;
        servicesSectionActive?: boolean;
        testimonialsSectionActive?: boolean;
        gallerySectionActive?: boolean;
    }>(initialData || {
        heroSectionActive: true,
        servicesSectionActive: true,
        testimonialsSectionActive: true,
        gallerySectionActive: true,
        transformationsEnabled: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleAiTranslate = async () => {
        setIsLoading(true);
        const toastId = toast.loading("Traduciendo inputs de Inglés a Español con IA...", { duration: 0 });
        
        try {
            const pairs = [
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
                toast.success("Personalización del sitio actualizada correctamente");
            } else {
                toast.error("Error al guardar los cambios");
            }
        } catch (error) {
            toast.error("Error al intentar guardar");
        } finally {
            setIsLoading(false);
        }
    }

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: "hero", label: "Sección Hero", icon: Sparkles },
        { id: "footer", label: "Pie de Página", icon: Layout },
        { id: "design", label: "Módulos y Diseño", icon: Palette },
        { id: "social", label: "Redes Sociales", icon: Globe },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
            {/* AI Hot Translation Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1A1A1A] border border-[#3A3A3A] p-4 rounded-2xl gap-4 shadow-md">
                <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Traducción Integrada en Caliente</h4>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Escribe tus textos en Inglés y tradúcelos al Español de forma instantánea usando IA.</p>
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

            {/* Custom Tab Selector */}
            <div className="flex gap-2 p-1.5 bg-[#151515] border border-[#3A3A3A] rounded-2xl overflow-x-auto scrollbar-none">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border border-transparent",
                                isSelected 
                                    ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 scale-102"
                                    : "text-slate-400 hover:text-white hover:bg-[#202020]"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Form Content Cards based on active tab with Framer Motion animations */}
            <AnimatePresence mode="wait">
                {activeTab === "hero" && (
                    <motion.div
                        key="hero"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="border-[#3A3A3A] shadow-sm rounded-2xl bg-[#1A1A1A]">
                            <CardContent className="p-6 space-y-6">
                                <div className="border-b border-[#3A3A3A] pb-3 flex items-center justify-between">
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-[#7C3AED]" /> Sección Principal (Hero)
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Copys y Textos Principales</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left - English */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Inglés (English)</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroTitleEn" className="text-xs font-semibold text-slate-400">Main Title (EN)</Label>
                                            <Input id="heroTitleEn" value={formData.heroTitleEn || ""} onChange={handleChange} placeholder="First Class Care" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroHighlightEn" className="text-xs font-semibold text-slate-400">Highlighted Text (EN)</Label>
                                            <Input id="heroHighlightEn" value={formData.heroHighlightEn || ""} onChange={handleChange} placeholder="First Class" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroBadgeEn" className="text-xs font-semibold text-slate-400">Badge/Label (EN)</Label>
                                            <Input id="heroBadgeEn" value={formData.heroBadgeEn || ""} onChange={handleChange} placeholder="#1 Service in Miami" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroDescEn" className="text-xs font-semibold text-slate-400">Description (EN)</Label>
                                            <Textarea id="heroDescEn" value={formData.heroDescEn || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>

                                    {/* Right - Español */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Español</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroTitleEs" className="text-xs font-semibold text-slate-400">Título Principal (ES)</Label>
                                            <Input id="heroTitleEs" value={formData.heroTitleEs || ""} onChange={handleChange} placeholder="Cuidado de" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroHighlightEs" className="text-xs font-semibold text-slate-400">Texto Resaltado (ES)</Label>
                                            <Input id="heroHighlightEs" value={formData.heroHighlightEs || ""} onChange={handleChange} placeholder="Primera Clase" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroBadgeEs" className="text-xs font-semibold text-slate-400">Etiqueta/Badge (ES)</Label>
                                            <Input id="heroBadgeEs" value={formData.heroBadgeEs || ""} onChange={handleChange} placeholder="Servicio #1 en Miami" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="heroDescEs" className="text-xs font-semibold text-slate-400">Descripción (ES)</Label>
                                            <Textarea id="heroDescEs" value={formData.heroDescEs || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-[#3A3A3A] pt-4">
                                    <Label htmlFor="heroImageUrl" className="text-xs font-semibold text-slate-400">URL de Imagen Destacada (Mascota en el Hero)</Label>
                                    <Input id="heroImageUrl" value={formData.heroImageUrl || ""} onChange={handleChange} placeholder="/hero-dog.png" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {activeTab === "footer" && (
                    <motion.div
                        key="footer"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="border-[#3A3A3A] shadow-sm rounded-2xl bg-[#1A1A1A]">
                            <CardContent className="p-6 space-y-6">
                                <div className="border-b border-[#3A3A3A] pb-3 flex items-center justify-between">
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Layout className="h-4 w-4 text-[#7C3AED]" /> Pie de Página (Footer)
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Textos del Footer</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Inglés (English)</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="footerDescEn" className="text-xs font-semibold text-slate-400">Footer Description (EN)</Label>
                                            <Textarea id="footerDescEn" value={formData.footerDescEn || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-1.5 pb-2 border-b border-[#3A3A3A]/40">
                                            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Español</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="footerDescEs" className="text-xs font-semibold text-slate-400">Descripción del Footer (ES)</Label>
                                            <Textarea id="footerDescEs" value={formData.footerDescEs || ""} onChange={handleChange} className="min-h-[120px] bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {activeTab === "design" && (
                    <motion.div
                        key="design"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="border-[#3A3A3A] shadow-sm rounded-2xl bg-[#1A1A1A]">
                            <CardContent className="p-6 space-y-6">
                                <div className="border-b border-[#3A3A3A] pb-3 flex items-center justify-between">
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-[#7C3AED]" /> Diseño y Visibilidad de Módulos
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Secciones Activas de la Landing</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[#151515] rounded-xl border border-[#3A3A3A]">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="transformationsEnabled" className="text-sm font-bold text-white">Módulo de Transformaciones (Antes & Después)</Label>
                                            <p className="text-xs text-slate-500 font-medium">Controla si la sección de transformaciones aparece en el menú público.</p>
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#3A3A3A]">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="primaryColor" className="text-xs font-semibold text-slate-400">Color Primario (Hex)</Label>
                                            <div className="flex gap-2">
                                                <Input id="primaryColor" value={formData.primaryColor || "#121212"} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                                <div className="w-11 h-11 rounded-xl border-2 border-[#3A3A3A]" style={{ backgroundColor: formData.primaryColor || "#121212" }} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="accentColor" className="text-xs font-semibold text-slate-400">Color de Acento (Hex)</Label>
                                            <div className="flex gap-2">
                                                <Input id="accentColor" value={formData.accentColor || "#7C3AED"} onChange={handleChange} className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED]" />
                                                <div className="w-11 h-11 rounded-xl border-2 border-[#3A3A3A]" style={{ backgroundColor: formData.accentColor || "#7C3AED" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {activeTab === "social" && (
                    <motion.div
                        key="social"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="border-[#3A3A3A] shadow-sm rounded-2xl bg-[#1A1A1A]">
                            <CardContent className="p-6 space-y-6">
                                <div className="border-b border-[#3A3A3A] pb-3 flex items-center justify-between">
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-[#7C3AED]" /> Canales Sociales
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Redes de Groomers, INC.</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Instagram */}
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="instagramUrl" className="flex items-center text-xs font-semibold text-slate-400"><Instagram className="h-3.5 w-3.5 mr-2 text-[#7C3AED]" /> Instagram</Label>
                                            <Input id="instagramUrl" value={formData.instagramUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 bg-[#151515] rounded-xl border border-[#3A3A3A]">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mostrar Icono</span>
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
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mostrar Icono</span>
                                            <Switch 
                                                checked={formData.tiktokActive ?? true} 
                                                onCheckedChange={(val) => setFormData(prev => ({ ...prev, tiktokActive: val }))}
                                            />
                                        </div>
                                    </div>

                                    {/* X / Twitter */}
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="twitterUrl" className="flex items-center text-xs font-semibold text-slate-400">X (Twitter)</Label>
                                            <Input id="twitterUrl" value={formData.twitterUrl || ""} onChange={handleChange} placeholder="URL de perfil" className="h-11 bg-[#121212] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] focus-visible:ring-[#7C3AED] placeholder-slate-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 bg-[#151515] rounded-xl border border-[#3A3A3A]">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mostrar Icono</span>
                                            <Switch 
                                                checked={formData.twitterActive ?? true} 
                                                onCheckedChange={(val) => setFormData(prev => ({ ...prev, twitterActive: val }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Actions */}
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
                            <Save className="mr-2 h-4 w-4" /> Guardar Cambios Visuales
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
