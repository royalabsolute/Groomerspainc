"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scissors,
    Sparkles,
    Droplets,
    ChevronDown,
    ShieldCheck,
    ArrowRight,
    DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Category config (purely visual — no hardcoded service names) ─────────────

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
        pillBg: "bg-[#FEF08A]",
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
        pillBg: "bg-[#BFDBFE]",
        labelEs: "Tratamiento / Add-on",
        labelEn: "Treatment / Add-on",
        subtitleEs: "Limpiezas especializadas y extras",
        subtitleEn: "Specialized cleanings & extras",
    },
    SPECIAL_SHAMPOO: {
        icon: Droplets,
        bg: "bg-[#BCF0DA]",
        border: "border-black",
        shadow: "shadow-[6px_6px_0px_0px_#000]",
        activeBg: "bg-[#BCF0DA]/80",
        pillBg: "bg-[#BCF0DA]",
        labelEs: "Baño Especial",
        labelEn: "Special Bath",
        subtitleEs: "Champús medicados y terapéuticos",
        subtitleEn: "Medicated & therapeutic shampoos",
    },
};

// Ordered display sequence
const CATEGORY_ORDER: CategoryKey[] = [
    "MAIN_GROOMING",
    "ADDON_TREATMENT",
    "SPECIAL_SHAMPOO",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicesShowcase({
    initialServices,
    locale,
}: ServicesShowcaseProps) {
    const t = useTranslations("Index");
    const [openCategory, setOpenCategory] = useState<CategoryKey | null>(null);

    const toggleCategory = (cat: CategoryKey) => {
        setOpenCategory((prev) => (prev === cat ? null : cat));
    };

    // Group real DB services by category
    const grouped = CATEGORY_ORDER.reduce<Record<CategoryKey, ServiceItem[]>>(
        (acc, cat) => {
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
            <div className="container max-w-5xl mx-auto space-y-10 md:space-y-14">

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex bg-accent text-foreground text-xs font-black uppercase tracking-widest px-4 py-1.5 border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000] -rotate-1">
                        {locale === "es" ? "CUIDADO PROFESIONAL" : "PROFESSIONAL CARE"}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-foreground">
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

                {/* ── Accordion List ───────────────────────────────────── */}
                <div className="flex flex-col gap-5">
                    {CATEGORY_ORDER.map((cat, idx) => {
                        const cfg = CATEGORY_CONFIG[cat];
                        const Icon = cfg.icon;
                        const isOpen = openCategory === cat;
                        const services = grouped[cat];
                        const label = locale === "es" ? cfg.labelEs : cfg.labelEn;
                        const subtitle =
                            locale === "es" ? cfg.subtitleEs : cfg.subtitleEn;

                        return (
                            <motion.div
                                key={cat}
                                layout
                                className={cn(
                                    "border-4 border-black rounded-3xl overflow-hidden transition-shadow duration-300",
                                    isOpen
                                        ? "shadow-[8px_8px_0px_0px_#000]"
                                        : "shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000]"
                                )}
                            >
                                {/* ─ Giant Toggle Button ─ */}
                                <button
                                    onClick={() => toggleCategory(cat)}
                                    className={cn(
                                        "w-full flex items-center justify-between gap-4 p-6 md:p-8 transition-colors duration-200 cursor-pointer",
                                        isOpen ? cfg.activeBg : cfg.bg,
                                        "hover:brightness-95"
                                    )}
                                    aria-expanded={isOpen ? "true" : "false"}
                                >
                                    <div className="flex items-center gap-4 md:gap-6">
                                        {/* Icon badge */}
                                        <div className="w-14 h-14 md:w-20 md:h-20 bg-white border-[3px] border-black rounded-2xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#000]">
                                            <Icon className="w-7 h-7 md:w-10 md:h-10 stroke-2" />
                                        </div>

                                        <div className="text-left">
                                            {/* Index pill */}
                                            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black px-2.5 py-0.5 rounded-lg mb-1.5">
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-none">
                                                {label}
                                            </h3>
                                            <p className="text-xs md:text-sm font-bold text-foreground/70 mt-1">
                                                {subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {/* Service count badge */}
                                        {services.length > 0 && (
                                            <span className="hidden sm:flex items-center gap-1.5 bg-white border-2 border-black rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                                                {services.length}{" "}
                                                {locale === "es" ? "servicios" : "services"}
                                            </span>
                                        )}
                                        <motion.div
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="w-10 h-10 md:w-12 md:h-12 bg-white border-[3px] border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#000]"
                                        >
                                            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
                                        </motion.div>
                                    </div>
                                </button>

                                {/* ─ Expanded Content ─ */}
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-white border-t-4 border-black p-6 md:p-8">
                                                {services.length === 0 ? (
                                                    <p className="text-sm font-bold text-muted-foreground text-center py-6">
                                                        {locale === "es"
                                                            ? "No hay servicios activos en esta categoría."
                                                            : "No active services in this category."}
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {services.map((service, sIdx) => {
                                                            const displayName =
                                                                locale === "es"
                                                                    ? service.nameEs
                                                                    : service.nameEn;

                                                            return (
                                                                <motion.div
                                                                    key={service.id}
                                                                    initial={{ opacity: 0, y: 12 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{
                                                                        delay: sIdx * 0.06,
                                                                        duration: 0.25,
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_0px_#000]",
                                                                        cfg.pillBg
                                                                    )}
                                                                >
                                                                    {/* Name */}
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-8 h-8 bg-white border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                                                                            <Icon className="w-4 h-4 stroke-2" />
                                                                        </div>
                                                                        <span className="font-black text-sm md:text-base uppercase tracking-tight text-foreground truncate">
                                                                            {displayName}
                                                                        </span>
                                                                    </div>

                                                                    {/* Price */}
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
                                                    </div>
                                                )}

                                                {/* CTA to quote wizard */}
                                                <div className="mt-6 flex justify-center">
                                                    <button
                                                        onClick={() => {
                                                            const el = document.getElementById("cotizar");
                                                            if (el)
                                                                el.scrollIntoView({ behavior: "smooth" });
                                                        }}
                                                        className="inline-flex items-center gap-2 bg-primary text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                        {locale === "es"
                                                            ? "Reservar Cita"
                                                            : "Book Appointment"}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Bottom note ───────────────────────────────────────── */}
                <p className="text-center text-xs font-bold text-foreground/50 uppercase tracking-widest">
                    {locale === "es"
                        ? "* Los precios son estimados. El precio final se confirma según el tamaño y condición del pelaje."
                        : "* Prices are estimates. Final price confirmed based on size & coat condition."}
                </p>
            </div>
        </section>
    );
}
