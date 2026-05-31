"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Scissors,
    Sparkles,
    Droplets,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    DollarSign,
    Star,
    MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface ServiceItem {
    id: string;
    nameEs: string;
    nameEn: string;
    category: string;
    basePrice: number;
    isActive: boolean;
}

interface ServicesShowcaseProps {
    initialServices: ServiceItem[];
    locale: string;
}

type CategoryKey = "MAIN_GROOMING" | "ADDON_TREATMENT" | "SPECIAL_SHAMPOO";

const CATEGORY_CONFIG: Record<
    CategoryKey,
    {
        icon: React.ElementType;
        bg: string;
        border: string;
        shadow: string;
        activeBg: string;
        pillBg: string;
        labelEs: string;
        labelEn: string;
        subtitleEs: string;
        subtitleEn: string;
    }
> = {
    MAIN_GROOMING: {
        icon: Scissors,
        bg: "bg-[#FEF08A]",
        border: "border-black",
        shadow: "shadow-[6px_6px_0px_0px_#000]",
        activeBg: "bg-[#FEF08A]/80",
        pillBg: "bg-[#FEF08A]/30",
        labelEs: "Servicio Principal",
        labelEn: "Main Grooming",
        subtitleEs: "Cortes, baños y peluquería completa",
        subtitleEn: "Haircuts, baths & full styling",
    },
    ADDON_TREATMENT: {
        icon: Sparkles,
        bg: "bg-[#BFDBFE]",
        border: "border-black",
        shadow: "shadow-[6px_6px_0px_0px_#000]",
        activeBg: "bg-[#BFDBFE]/80",
        pillBg: "bg-[#BFDBFE]/30",
        labelEs: "Tratamiento / Add-on",
        labelEn: "Treatment / Add-on",
        subtitleEs: "Limpiezas especializadas y extras",
        subtitleEn: "Specialized cleanings & extras",
    },
    SPECIAL_SHAMPOO: {
        icon: Droplets,
        bg: "bg-[#86EFAC]",
        border: "border-black",
        shadow: "shadow-[6px_6px_0px_0px_#000]",
        activeBg: "bg-[#86EFAC]/80",
        pillBg: "bg-[#86EFAC]/30",
        labelEs: "Baño Especial",
        labelEn: "Special Bath",
        subtitleEs: "Champús medicados y terapéuticos",
        subtitleEn: "Medicated & therapeutic shampoos",
    },
};

const CATEGORY_ORDER: CategoryKey[] = ["MAIN_GROOMING", "ADDON_TREATMENT", "SPECIAL_SHAMPOO"];

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.97 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring" as const, stiffness: 150, damping: 15 } 
    }
};

export default function ServicesShowcase({
    initialServices,
    locale,
}: ServicesShowcaseProps) {
    const t = useTranslations("Index");
    const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);

    // Group real DB services by category
    const grouped = CATEGORY_ORDER.reduce<Record<CategoryKey, ServiceItem[]>>(
        (acc: Record<CategoryKey, ServiceItem[]>, cat: CategoryKey) => {
            acc[cat] = initialServices.filter((s) => s.category === cat);
            return acc;
        },
        { MAIN_GROOMING: [], ADDON_TREATMENT: [], SPECIAL_SHAMPOO: [] }
    );

    return (
        <section
            id="servicios"
            className="w-full py-16 md:py-24 px-4 md:px-8 bg-[#FDFCF8] relative overflow-hidden"
        >
            {/* Background Halftone comic dots */}
            <div className="absolute inset-0 bg-[radial-gradient(#000_10%,transparent_10%)] bg-size-[20px_20px] opacity-[0.015] pointer-events-none select-none" />

            <div className="container max-w-5xl mx-auto space-y-10 md:space-y-14 relative z-10">

                {/* Header */}
                <div className="text-center space-y-4 max-w-2xl mx-auto relative">
                    {/* Floating star left */}
                    <motion.div 
                        animate={{ y: [-6, 6, -6], rotate: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute -left-8 top-0 text-yellow-400 hidden sm:block pointer-events-none"
                    >
                        <Star className="w-8 h-8 fill-yellow-400 stroke-black stroke-[3px] shadow-sm drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
                    </motion.div>
                    
                    {/* Floating message bubble right */}
                    <motion.div 
                        animate={{ y: [6, -6, 6], rotate: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                        className="absolute -right-8 bottom-4 text-sky-400 hidden sm:block pointer-events-none"
                    >
                        <MessageCircle className="w-8 h-8 fill-sky-400 stroke-black stroke-[3px] shadow-sm drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
                    </motion.div>

                    <div className="inline-flex bg-accent text-foreground text-xs font-black uppercase tracking-widest px-4 py-1.5 border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000] -rotate-1 select-none">
                        {locale === "es" ? "CUIDADO PROFESIONAL" : "PROFESSIONAL CARE"}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-foreground relative z-10">
                        {t("servicesTitle")}{" "}
                        <span className="text-primary underline decoration-primary decoration-[6px] underline-offset-8">
                            {t("servicesTitleHighlight")}
                        </span>
                    </h2>
                    <p className="text-base md:text-xl font-bold text-muted-foreground leading-relaxed">
                        {locale === "es"
                            ? "Elige la categoría que necesita tu mascota"
                            : "Choose the category your pet needs"}
                    </p>
                </div>

                {/* Interactive Pop-Art tab selector */}
                <div className="w-full relative min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {!activeCategory ? (
                            <motion.div
                                key="grid-categories"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                                className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 max-w-4xl mx-auto w-full select-none"
                            >
                                {CATEGORY_ORDER.map((cat) => {
                                    const cfg = CATEGORY_CONFIG[cat];
                                    const Icon = cfg.icon;
                                    const services = grouped[cat];
                                    const label = locale === "es" ? cfg.labelEs : cfg.labelEn;
                                    const subtitle = locale === "es" ? cfg.subtitleEs : cfg.subtitleEn;

                                    return (
                                        <motion.button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            whileHover={{ 
                                                scale: 1.05, 
                                                rotate: -2,
                                                y: -8, 
                                                x: -4,
                                                boxShadow: "12px 12px 0px 0px rgba(0,0,0,1)" 
                                            }}
                                            whileTap={{ 
                                                scale: 0.98, 
                                                y: 2, 
                                                x: 2,
                                                boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)" 
                                            }}
                                            transition={{ type: "spring", stiffness: 350, damping: 16 }}
                                            className={cn(
                                                "w-full aspect-square md:aspect-auto md:h-48 p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center text-center border-4 border-black rounded-3xl cursor-pointer relative overflow-hidden select-none group shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                                                cfg.bg
                                            )}
                                        >
                                            {/* Halftone Comic Pattern background (activates on hover) */}
                                            <div className="absolute inset-0 bg-[radial-gradient(#000_15%,transparent_15%)] bg-size-[8px_8px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none rounded-3xl" />

                                            {/* Vintage Circular Postmark Seal */}
                                            <div className="absolute top-2 right-2 w-8 h-8 rounded-full border border-black/10 flex items-center justify-center -rotate-12 pointer-events-none scale-75 md:scale-100 opacity-40 group-hover:opacity-75 transition-opacity">
                                                <div className="w-6.5 h-6.5 rounded-full border border-dashed border-black/15 flex items-center justify-center font-black text-[4px] text-neutral-900/40 group-hover:text-neutral-900/70 uppercase">
                                                    <span>VIP</span>
                                                </div>
                                            </div>

                                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white border-2 md:border-3 border-black rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#000] md:shadow-[3px_3px_0_0_#000] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 stroke-2 text-neutral-900" />
                                            </div>
                                            <span className="text-[10px] sm:text-xs md:text-lg font-black uppercase tracking-tight block leading-tight mt-2.5 md:mt-3.5 text-neutral-900 truncate w-full group-hover:scale-[1.02] transition-transform">
                                                {label}
                                            </span>
                                            <span className="hidden md:block text-xs font-bold text-neutral-800/70 mt-1 leading-snug">
                                                {subtitle}
                                            </span>

                                            {services.length > 0 && (
                                                <span className="hidden md:inline-block bg-white border-2 border-black rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] mt-2.5 group-hover:-translate-y-px transition-transform">
                                                    {services.length} {locale === "es" ? "Servicios" : "Services"}
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="active-category"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 30 }}
                                transition={{ duration: 0.35, type: "spring", damping: 22 }}
                                className="max-w-4xl mx-auto w-full space-y-6"
                            >
                                {(() => {
                                    const activeCat = activeCategory as CategoryKey;
                                    const cfg = CATEGORY_CONFIG[activeCat];
                                    const ActiveIcon = cfg.icon;

                                    return (
                                        <>
                                            {/* Active Header Card */}
                                            <div className={cn(
                                                "border-4 border-black rounded-3xl p-5 md:p-8 flex items-center justify-between shadow-[6px_6px_0px_0px_#000] relative overflow-hidden select-none",
                                                cfg.bg
                                            )}>
                                                {/* Halftone Comic Pattern background */}
                                                <div className="absolute inset-0 bg-[radial-gradient(#000_15%,transparent_15%)] bg-size-[8px_8px] opacity-[0.04] pointer-events-none rounded-3xl" />

                                                <div className="flex items-center gap-4 md:gap-6 z-10">
                                                    <div className="w-14 h-14 md:w-20 md:h-20 bg-white border-[3px] border-black rounded-2xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#000] animate-pulse">
                                                        <ActiveIcon className="w-7 h-7 md:w-10 md:h-10 stroke-2 text-neutral-900" />
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="text-xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-none">
                                                            {locale === "es" ? cfg.labelEs : cfg.labelEn}
                                                        </h3>
                                                        <p className="text-xs md:text-sm font-bold text-foreground/70 mt-1 leading-snug">
                                                            {locale === "es" ? cfg.subtitleEs : cfg.subtitleEn}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Volver Header Button */}
                                                <button
                                                    onClick={() => setActiveCategory(null)}
                                                    className="bg-white hover:bg-slate-50 text-neutral-900 font-black h-12 w-12 md:h-14 md:w-14 rounded-2xl border-3 border-black shadow-[3px_3px_0_0_#000] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center shrink-0 z-10"
                                                    aria-label={locale === "es" ? "Cerrar" : "Close"}
                                                >
                                                    <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                                                </button>
                                            </div>

                                            {/* Active Category Services List Card */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05, duration: 0.25 }}
                                                className="bg-white border-4 border-black rounded-3xl p-5 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6"
                                            >
                                                {grouped[activeCat].length === 0 ? (
                                                    <p className="text-sm font-bold text-muted-foreground text-center py-8">
                                                        {locale === "es"
                                                            ? "No hay servicios activos en esta categoría."
                                                            : "No active services in this category."}
                                                    </p>
                                                ) : (
                                                    <motion.div 
                                                        variants={containerVariants}
                                                        initial="hidden"
                                                        animate="show"
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                    >
                                                        {grouped[activeCat].map((service: ServiceItem, sIdx: number) => {
                                                            const displayName = locale === "es" ? service.nameEs : service.nameEn;
                                                            const ServiceIcon = cfg.icon;

                                                            return (
                                                                <motion.div
                                                                    key={service.id}
                                                                    variants={itemVariants}
                                                                    whileHover={{ 
                                                                        scale: 1.025, 
                                                                        y: -3, 
                                                                        boxShadow: "5px 5px 0px 0px rgba(0,0,0,1)",
                                                                        backgroundColor: "#FFFFFF"
                                                                    }}
                                                                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                                                    className={cn(
                                                                        "flex items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_#000] cursor-pointer",
                                                                        cfg.pillBg
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-8 h-8 bg-white border-2 border-black rounded-lg flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_#000]">
                                                                            <ServiceIcon className="w-4 h-4 stroke-2 text-neutral-900" />
                                                                        </div>
                                                                        <span className="font-black text-sm md:text-base uppercase tracking-tight text-foreground truncate">
                                                                             {displayName}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <div className="flex items-center gap-0.5 bg-white border-2 border-black rounded-xl px-3 py-1.5 shadow-[2px_2px_0px_0px_#000]">
                                                                            <DollarSign className="w-3.5 h-3.5 stroke-[2.5] text-primary" />
                                                                            <span className="font-black text-base md:text-lg text-primary leading-none">
                                                                                {service.basePrice % 1 === 0
                                                                                    ? service.basePrice.toFixed(0)
                                                                                    : service.basePrice.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}

                                                {/* Action CTA & Volver Button */}
                                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-5 border-t-3 border-black/5">
                                                    <button
                                                        onClick={() => {
                                                            const el = document.getElementById("cotizar");
                                                            if (el) el.scrollIntoView({ behavior: "smooth" });
                                                        }}
                                                        className="inline-flex items-center gap-2 bg-primary text-white font-black text-sm uppercase tracking-wider px-8 py-3.5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer w-full sm:w-auto justify-center select-none"
                                                    >
                                                        <ShieldCheck className="w-4.5 h-4.5" />
                                                        {locale === "es" ? "Reservar Cita" : "Book Appointment"}
                                                        <ArrowRight className="w-4.5 h-4.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => setActiveCategory(null)}
                                                        className="inline-flex items-center gap-2 bg-slate-100 text-neutral-900 font-black text-sm uppercase tracking-wider px-8 py-3.5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer w-full sm:w-auto justify-center select-none"
                                                    >
                                                        <ArrowLeft className="w-4.5 h-4.5" />
                                                        {locale === "es" ? "Volver" : "Go Back"}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom note */}
                <p className="text-center text-xs font-bold text-foreground/50 uppercase tracking-widest select-none">
                    {locale === "es"
                        ? "* Los precios son estimados. El precio final se confirma según el tamaño y condición del pelaje."
                        : "* Prices are estimates. Final price confirmed based on size & coat condition."}
                </p>
            </div>
        </section>
    );
}
