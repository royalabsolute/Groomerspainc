"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Bath, Scissors, Sparkles, Droplets, Check, ChevronDown, 
    ShieldCheck, Heart, Clock, Star 
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ServicesShowcase({ initialServices, locale }: ServicesShowcaseProps) {
    const t = useTranslations("Index");
    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

    // Dynamic icon mapper based on the service name or category
    const getServiceIcon = (nameEs: string, category: string) => {
        const lower = nameEs.toLowerCase();
        if (lower.includes("baño") || lower.includes("bath")) return Bath;
        if (lower.includes("grooming") || lower.includes("corte") || lower.includes("peluquería")) return Scissors;
        if (lower.includes("spa") || lower.includes("deluxe") || lower.includes("relajante")) return Sparkles;
        if (lower.includes("champú") || lower.includes("shampoo") || lower.includes("hidratación")) return Droplets;
        if (category === "MAIN_GROOMING") return Scissors;
        if (category === "ADDON_TREATMENT") return Sparkles;
        return Heart;
    };

    // Card background color mapper to make the grid pop-art styled
    const getCardBg = (index: number) => {
        const colors = [
            "bg-[#FEF08A]", // Soft Yellow
            "bg-[#BFDBFE]", // Soft Blue
            "bg-[#BCF0DA]", // Soft Green
            "bg-[#FBCFE8]", // Soft Pink
            "bg-[#DDD6FE]"  // Soft Violet
        ];
        return colors[index % colors.length];
    };

    // Predefined premium descriptive contents to enrich the database items
    const getServiceDetails = (nameEs: string) => {
        const lower = nameEs.toLowerCase();
        
        if (lower.includes("baño básico") || lower.includes("basic bath")) {
            return {
                description: locale === "es" 
                    ? "Un tratamiento de limpieza profunda y refrescante para purificar el pelaje y la piel de tu mascota."
                    : "A deep, refreshing cleansing treatment to purify your pet's coat and skin.",
                inclusions: locale === "es"
                    ? ["Champú orgánico natural", "Secado a mano termorregulado", "Limpieza de oídos suave", "Perfume hipoalergénico"]
                    : ["Natural organic shampoo", "Temperature-regulated hand blow dry", "Gentle ear cleaning", "Hypoallergenic cologne"]
            };
        }
        
        if (lower.includes("grooming completo") || lower.includes("full grooming")) {
            return {
                description: locale === "es"
                    ? "Nuestro servicio estrella diseñado para un estilizado total. Incluye baño purificante y corte de pelo profesional según la raza."
                    : "Our signature styling package. Includes a purifying bath and a professional breed-specific haircut.",
                inclusions: locale === "es"
                    ? ["Corte de pelo estilizado", "Champú de avena calmante", "Limpieza profunda de oídos", "Corte y limado de uñas"]
                    : ["Styled custom haircut", "Soothing oatmeal shampoo", "Deep ear sanitization", "Nail trimming & grinding"]
            };
        }
        
        if (lower.includes("spa deluxe") || lower.includes("spa de lujo")) {
            return {
                description: locale === "es"
                    ? "La experiencia definitiva de bienestar y relajación. Tratamientos de hidratación profunda y cuidado premium."
                    : "The ultimate wellness and relaxation package. Features deep hydration therapies and premium coat care.",
                inclusions: locale === "es"
                    ? ["Masaje relajante terapéutico", "Hidratación de almohadillas con bálsamo", "Cepillado de dientes", "Champú de queratina premium"]
                    : ["Therapeutic relaxing massage", "Nail & paw balm hydration", "Teeth brushing & fresh breath", "Premium keratin shampoo"]
            };
        }

        // Generic fallback for custom services added by admin
        return {
            description: locale === "es"
                ? "Servicio personalizado adaptado a las necesidades específicas de tu mascota, garantizando el mejor cuidado profesional."
                : "Personalized service tailored to your pet's specific needs, ensuring the best professional care.",
            inclusions: locale === "es"
                ? ["Champú premium adaptado", "Secado profesional a mano", "Limpieza e higiene de oídos", "Perfume protector de pelaje"]
                : ["Tailored premium shampoo", "Hand-dry professional blow", "Ear sanitization & cleaning", "Coat protection cologne"]
        };
    };

    const handleCardClick = (id: string) => {
        setExpandedServiceId(expandedServiceId === id ? null : id);
    };

    return (
        <section id="servicios" className="w-full py-20 px-4 md:px-8 bg-[#FDFCF8] relative overflow-hidden">
            <div className="container max-w-6xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <div className="inline-flex bg-accent text-foreground text-xs font-black uppercase tracking-widest px-4 py-1.5 border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000] -rotate-1">
                        {locale === "es" ? "CUIDADO PROFESIONAL" : "PROFESSIONAL CARE"}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-foreground">
                        {t("servicesTitle")} <span className="text-primary underline decoration-primary decoration-[6px] underline-offset-8">{t("servicesTitleHighlight")}</span>
                    </h2>
                    <p className="text-base md:text-xl font-bold text-muted-foreground leading-relaxed">
                        {t("servicesSubtitle")}
                    </p>
                </div>

                {/* Grid Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {initialServices.map((service, index) => {
                        const isExpanded = expandedServiceId === service.id;
                        const Icon = getServiceIcon(service.nameEs, service.category);
                        const cardBg = getCardBg(index);
                        const details = getServiceDetails(service.nameEs);
                        const displayName = locale === "es" ? service.nameEs : service.nameEn;

                        return (
                            <motion.div
                                key={service.id}
                                layout="position"
                                className={cn(
                                    "border-4 border-black bg-white rounded-3xl overflow-hidden transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                                    isExpanded 
                                        ? "ring-4 ring-primary/20 -translate-y-1 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]" 
                                        : "hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
                                )}
                            >
                                {/* Card Top Banner with Color Accent */}
                                <div className={cn("h-4 border-b-4 border-black", cardBg)} />

                                {/* Card Core Info */}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center space-x-3">
                                            {/* Neo-brutalist Icon Box */}
                                            <div className="w-12 h-12 bg-white border-3 border-black rounded-2xl flex items-center justify-center text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                                <Icon className="w-6 h-6 stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight text-foreground leading-tight">
                                                    {displayName}
                                                </h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {service.category === "MAIN_GROOMING" 
                                                        ? (locale === "es" ? "Peluquería Principal" : "Main Grooming")
                                                        : (locale === "es" ? "Tratamiento Adicional" : "Add-on Treatment")
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Specs */}
                                    <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-black/10">
                                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
                                            <Clock className="w-4 h-4 text-primary shrink-0" />
                                            <span>
                                                {service.category === "MAIN_GROOMING"
                                                    ? (locale === "es" ? "60-90 min" : "60-90 mins")
                                                    : (locale === "es" ? "15-30 min" : "15-30 mins")
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-xs font-bold text-slate-600">
                                            <Star className="w-4 h-4 text-accent fill-accent shrink-0" />
                                            <span>5.0</span>
                                        </div>
                                    </div>

                                    {/* Action Button & Base Price */}
                                    <div className="flex items-center justify-between gap-4 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">
                                                {t("priceBase")}
                                            </span>
                                            <span className="text-2xl font-black text-primary">
                                                ${service.basePrice}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleCardClick(service.id)}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl border-[3px] border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center space-x-1.5",
                                                isExpanded ? "bg-primary text-white" : "bg-accent text-foreground"
                                            )}
                                        >
                                            <span>{isExpanded ? (locale === "es" ? "Menos" : "Less") : (locale === "es" ? "Detalles" : "Details")}</span>
                                            <ChevronDown className={cn("w-4 h-4 stroke-3 transition-transform duration-300", isExpanded && "rotate-180")} />
                                        </button>
                                    </div>

                                    {/* Animated Expansion */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4 mt-4 border-t-4 border-black space-y-4">
                                                    {/* Description */}
                                                    <p className="text-xs font-bold text-slate-600 leading-relaxed bg-[#FDFCF8] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                        {details.description}
                                                    </p>

                                                    {/* Inclusions list */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {locale === "es" ? "INCLUYE EN LA UNIDAD MÓVIL:" : "INCLUDED IN MOBILE UNIT:"}
                                                        </h4>
                                                        <ul className="grid grid-cols-1 gap-2">
                                                            {details.inclusions.map((inclusion, idx) => (
                                                                <li key={idx} className="flex items-center space-x-2 text-xs font-black text-slate-700">
                                                                    <div className="w-4 h-4 rounded-md bg-secondary border border-black flex items-center justify-center shrink-0">
                                                                        <Check className="w-3 h-3 text-primary stroke-3" />
                                                                    </div>
                                                                    <span>{inclusion}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Quick CTA to Wizard */}
                                                    <button
                                                        onClick={() => {
                                                            const element = document.getElementById("cotizar");
                                                            if (element) {
                                                                element.scrollIntoView({ behavior: "smooth" });
                                                            }
                                                        }}
                                                        className="w-full py-2.5 bg-primary hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#000] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                        <span>{t("bookNow")}</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
