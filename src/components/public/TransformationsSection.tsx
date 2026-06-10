"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, SlidersHorizontal, Sparkles, Footprints, Award, GraduationCap, X, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BeforeAfterSlider from "./BeforeAfterSlider";

interface Transformation {
    id: string;
    petName: string;
    breed: string;
    age: string;
    serviceDate: Date | string;
    beforePhotoUrl: string;
    afterPhotoUrl: string;
    contractImage?: string | null;
    descriptionEs: string;
    descriptionEn: string;
    visible: boolean;
    createdAt: Date | string;
}

interface TransformationsSectionProps {
    items: Transformation[];
    locale: string;
}

export default function TransformationsSection({ items, locale }: TransformationsSectionProps) {
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return items.filter((t) => {
            const searchLower = search.toLowerCase();
            const nameMatch = t.petName.toLowerCase().includes(searchLower);
            const breedMatch = t.breed.toLowerCase().includes(searchLower);
            
            const desc = locale === "es" ? t.descriptionEs : t.descriptionEn;
            const descMatch = (desc || "").toLowerCase().includes(searchLower);

            const matchesSearch = nameMatch || breedMatch || descMatch;

            const itemDate = new Date(t.serviceDate);
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

            const matchesFrom = from ? itemDate >= from : true;
            const matchesTo = to ? itemDate <= to : true;

            return matchesSearch && matchesFrom && matchesTo;
        });
    }, [items, search, dateFrom, dateTo, locale]);

    const clearFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
    };

    const hasFilters = search || dateFrom || dateTo;

    return (
        <div className="space-y-10">
            {/* Search & Filter Bar - Serious Pop-Art / NeoBrutalist Style */}
            <div className="bg-[#FAF9F6] border-[3px] border-black p-6 space-y-6 shadow-[6px_6px_0px_0px_#000] rounded-2xl">
                <div className="flex gap-4 flex-wrap items-center">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-800 z-10" />
                        <Input
                            placeholder={
                                locale === "es" 
                                    ? "Buscar por nombre, raza o descripción..." 
                                    : "Search by name, breed or description..."
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-14 rounded-xl border-2 border-black bg-white font-bold placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black transition-all text-black"
                        />
                    </div>
                    
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-14 px-8 rounded-xl border-2 border-black font-black uppercase tracking-tight shadow-[3px_3px_0px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-sans",
                            showFilters ? "bg-black text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-100"
                        )}
                    >
                        <SlidersHorizontal className="h-5 w-5 mr-2" />
                        {locale === "es" ? "Filtros" : "Filters"}
                    </Button>

                    {hasFilters && (
                        <Button 
                            variant="ghost" 
                            onClick={clearFilters} 
                            className="h-14 px-6 rounded-xl font-black text-black hover:bg-neutral-200/50 cursor-pointer"
                        >
                            {locale === "es" ? "LIMPIAR" : "CLEAR"}
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t-2 border-black border-dashed"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest ml-1 text-black">
                                {locale === "es" ? "Desde:" : "From:"}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-800 z-10" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="pl-12 h-12 rounded-xl border-2 border-black bg-white font-bold text-black"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest ml-1 text-black">
                                {locale === "es" ? "Hasta:" : "To:"}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-800 z-10" />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="pl-12 h-12 rounded-xl border-2 border-black bg-white font-bold text-black"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Results count */}
            <p className="text-xs text-neutral-500 font-black uppercase tracking-wider pl-1">
                {locale === "es"
                    ? `${filtered.length} registro${filtered.length !== 1 ? "s" : ""} de estudio encontrado${filtered.length !== 1 ? "s" : ""}`
                    : `${filtered.length} study case${filtered.length !== 1 ? "s" : ""} found`}
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-32 bg-[#FAF9F6] border-2 border-black border-dashed rounded-3xl shadow-[6px_6px_0px_0px_#000]">
                    <Sparkles className="h-16 w-16 mx-auto mb-6 text-neutral-400 opacity-80" />
                    <p className="text-2xl font-black uppercase tracking-tight text-neutral-500">
                        {locale === "es" ? "No se encontraron registros con estos filtros." : "No records found with these filters."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                    {filtered.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (index % 2) * 0.1 }}
                            className="group relative bg-[#FAF9F6] rounded-3xl border-[3px] border-black overflow-hidden shadow-[6px_6px_0px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-[5px_5px_0px_0px_#000] transition-all duration-300 flex flex-col justify-between"
                        >
                            {/* Before & After Interactive Slider */}
                            <div className="p-6 pb-2 relative z-10">
                                <div className="rounded-2xl border-2 border-black overflow-hidden bg-black shadow-[4px_4px_0px_0px_#000]">
                                    <BeforeAfterSlider
                                        beforeUrl={item.beforePhotoUrl}
                                        afterUrl={item.afterPhotoUrl}
                                        beforeLabel={locale === "es" ? "ANTES" : "BEFORE"}
                                        afterLabel={locale === "es" ? "DESPUÉS" : "AFTER"}
                                    />
                                </div>
                            </div>

                            {/* Pet Technical Specification Sheet & Info Block */}
                            <div className="px-6 pb-4 pt-2 space-y-4 relative z-10 grow">
                                {/* Pet Name Card Heading */}
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <h3 className="font-black text-2xl tracking-tight uppercase text-black flex items-center gap-2">
                                        <Sparkles className="h-6 w-6 text-black shrink-0" /> {item.petName}
                                    </h3>
                                    
                                    {/* Service Date Badge */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] -rotate-1 text-xs font-bold text-neutral-800">
                                        <Calendar className="h-4 w-4 text-neutral-600" />
                                        <span className="font-black uppercase tracking-wider">
                                            {new Date(item.serviceDate).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Tech Spec Grid Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Breed Badge Spec */}
                                    <div className="bg-[#F5F2EB] border-2 border-black p-3 rounded-xl flex items-center gap-2.5 shadow-[2px_2px_0px_0px_#000]">
                                        <div className="h-8 w-8 rounded-lg bg-neutral-200/60 flex items-center justify-center border border-black text-neutral-800 shrink-0">
                                            <Footprints className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-wider leading-none">
                                                {locale === "es" ? "Raza" : "Breed"}
                                            </p>
                                            <p className="text-xs sm:text-sm font-black text-neutral-800 truncate mt-0.5" title={item.breed}>
                                                {item.breed}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Age Badge Spec */}
                                    <div className="bg-[#F5F2EB] border-2 border-black p-3 rounded-xl flex items-center gap-2.5 shadow-[2px_2px_0px_0px_#000]">
                                        <div className="h-8 w-8 rounded-lg bg-neutral-200/60 flex items-center justify-center border border-black text-neutral-800 shrink-0">
                                            <Award className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-wider leading-none">
                                                {locale === "es" ? "Edad" : "Age"}
                                            </p>
                                            <p className="text-xs sm:text-sm font-black text-neutral-800 truncate mt-0.5" title={item.age}>
                                                {item.age}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description Block */}
                                <div className="bg-white border-2 border-black p-4 rounded-xl text-sm leading-relaxed text-slate-800 font-bold shadow-[3px_3px_0px_0px_#000] relative mt-2">
                                    <div className="absolute -top-3 left-4 bg-black text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-white/20">
                                        {locale === "es" ? "Ficha Técnica" : "Case Record"}
                                    </div>
                                    <p className="whitespace-pre-line text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed pt-1">
                                        {locale === "es" ? item.descriptionEs : item.descriptionEn}
                                    </p>
                                </div>
                            </div>

                            {/* Attached Document Section (contractImage) */}
                            {item.contractImage && (
                                <div className="px-6 pb-6 pt-2 border-t-2 border-black border-dashed mt-2">
                                    <div 
                                        className="relative bg-[#FFFDF9] border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000] rotate-[-0.5deg] hover:rotate-0 transition-transform duration-200 cursor-pointer group/doc"
                                        onClick={() => setZoomedImage(item.contractImage!)}
                                    >
                                        {/* Paper Clip SVG */}
                                        <div className="absolute -top-4 left-6 z-20 pointer-events-none">
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="w-9 h-9 text-neutral-600 drop-shadow-[1.5px_1.5px_0px_#000] rotate-30"
                                            >
                                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                            </svg>
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-center justify-between border-b-2 border-black border-dashed pb-2 mb-3 pl-8">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                                                <GraduationCap className="h-4 w-4 text-neutral-600" />
                                                {locale === "es" ? "Evaluación / Certificación" : "Evaluation / Certification"}
                                            </span>
                                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                                                {locale === "es" ? "Ver documento" : "View document"}
                                            </span>
                                        </div>

                                        {/* Image wrapper */}
                                        <div className="relative aspect-3/2 w-full rounded-lg border border-neutral-300 overflow-hidden bg-neutral-50 shadow-[inner_0px_2px_4px_rgba(0,0,0,0.06)]">
                                            <img
                                                src={item.contractImage}
                                                alt="Contrato/Evaluación de estudio"
                                                className="w-full h-full object-cover group-hover/doc:scale-[1.02] transition-transform duration-300"
                                            />
                                            {/* Zoom overlay indicator */}
                                            <div className="absolute inset-0 bg-black/0 group-hover/doc:bg-black/25 flex items-center justify-center opacity-0 group-hover/doc:opacity-100 transition-opacity duration-200 z-10">
                                                <div className="bg-white border-2 border-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] scale-95 group-hover/doc:scale-100 transition-transform duration-200">
                                                    <Search className="h-3.5 w-3.5 text-black" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-black">
                                                        {locale === "es" ? "AMPLIAR" : "ZOOM"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Lightbox / Modal Zoom */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white border-3 border-black p-2 max-w-full md:max-w-3xl max-h-[90vh] rounded-2xl shadow-[8px_8px_0px_0px_#000] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setZoomedImage(null)}
                                aria-label={locale === "es" ? "Cerrar" : "Close"}
                                title={locale === "es" ? "Cerrar" : "Close"}
                                className="absolute top-4 right-4 bg-white hover:bg-neutral-100 border-2 border-black p-2 rounded-xl text-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer z-10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="relative overflow-auto max-h-[80vh]">
                                <img
                                    src={zoomedImage}
                                    alt="Documento de evaluación ampliado"
                                    className="max-w-full h-auto object-contain rounded-lg"
                                />
                            </div>
                            <div className="bg-neutral-50 border-t-2 border-black px-4 py-2 text-center text-xs font-black uppercase tracking-wider text-neutral-600 mt-2 flex items-center justify-center gap-1.5">
                                <GraduationCap className="h-4 w-4 text-neutral-600" />
                                {locale === "es" ? "Documento de Certificación / Contrato Escolar" : "Certification Document / Student Contract"}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
