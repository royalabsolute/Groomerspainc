"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, SlidersHorizontal, Sparkles, Footprints, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { PopArtDots, PopArtSticker, getRandomDecoration } from "./PopArtDecorations";

interface Transformation {
    id: string;
    petName: string;
    breed: string;
    age: string;
    serviceDate: Date | string;
    beforePhotoUrl: string;
    afterPhotoUrl: string;
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
            {/* Search & Filter Bar - Premium NeoBrutalist Style */}
            <div className="bg-white border-4 border-black p-6 space-y-6 shadow-[10px_10px_0px_0px_#1A1A1A] rounded-4xl">
                <div className="flex gap-4 flex-wrap items-center">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground z-10" />
                        <Input
                            placeholder={
                                locale === "es" 
                                    ? "Buscar por nombre, raza o descripción..." 
                                    : "Search by name, breed or description..."
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-14 rounded-xl border-[3px] border-black bg-secondary/10 font-bold placeholder:text-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                        />
                    </div>
                    
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-14 px-8 rounded-xl border-[3px] border-black font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer",
                            showFilters ? "bg-[#7C3AED] text-white" : "bg-white text-black"
                        )}
                    >
                        <SlidersHorizontal className="h-5 w-5 mr-2" />
                        {locale === "es" ? "Filtros" : "Filters"}
                    </Button>

                    {hasFilters && (
                        <Button 
                            variant="ghost" 
                            onClick={clearFilters} 
                            className="h-14 px-6 rounded-xl font-black text-[#7C3AED] hover:bg-[#7C3AED]/10 cursor-pointer"
                        >
                            {locale === "es" ? "LIMPIAR" : "CLEAR"}
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t-4 border-black border-dashed"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest ml-1">
                                {locale === "es" ? "Desde:" : "From:"}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground z-10" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="pl-12 h-12 rounded-xl border-4 border-black bg-white font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-widest ml-1">
                                {locale === "es" ? "Hasta:" : "To:"}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground z-10" />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="pl-12 h-12 rounded-xl border-4 border-black bg-white font-bold"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Results count */}
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">
                {locale === "es"
                    ? `${filtered.length} transformación${filtered.length !== 1 ? "es" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`
                    : `${filtered.length} transformation${filtered.length !== 1 ? "s" : ""} found`}
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-32 bg-white border-4 border-black border-dashed rounded-[3rem] shadow-[10px_10px_0px_0px_#EEE]">
                    <Sparkles className="h-16 w-16 mx-auto mb-6 text-[#7C3AED] opacity-45" />
                    <p className="text-2xl font-black uppercase tracking-tight text-foreground/50">
                        {locale === "es" ? "No se encontraron mascotas con estos filtros." : "No pets found with these filters."}
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
                            className="group relative bg-white rounded-[3rem] border-4 border-black overflow-hidden shadow-[16px_16px_0px_0px_#1A1A1A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-300"
                        >
                            {/* Random Decoration Background */}
                            <div className="absolute top-[-8%] right-[-8%] z-0 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity scale-125">
                                {getRandomDecoration(index)}
                            </div>
                            <div className="absolute bottom-[-5%] left-[-5%] z-0 pointer-events-none opacity-30 scale-110">
                                {getRandomDecoration(index + 5)}
                            </div>

                            {/* Before & After Interactive Slider */}
                            <div className="p-6 md:p-8 relative z-10">
                                <div className="rounded-[2.5rem] border-4 border-black overflow-hidden bg-black shadow-[8px_8px_0px_0px_#000]">
                                    <BeforeAfterSlider
                                        beforeUrl={item.beforePhotoUrl}
                                        afterUrl={item.afterPhotoUrl}
                                        beforeLabel={locale === "es" ? "ANTES" : "BEFORE"}
                                        afterLabel={locale === "es" ? "DESPUÉS" : "AFTER"}
                                    />
                                </div>
                            </div>

                            {/* Pet Technical Specification Sheet & Info Block */}
                            <div className="px-6 md:px-8 pb-8 pt-2 space-y-5 relative z-10">
                                {/* Pet Name Card Heading */}
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <h3 className="font-black text-3xl sm:text-4xl tracking-tight uppercase [text-shadow:2px_2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,-2px_-2px_0_#000] text-white wrap-break-word w-full sm:w-auto flex items-center gap-2">
                                        <Sparkles className="h-7 w-7 text-accent shrink-0" /> {item.petName}
                                    </h3>
                                    
                                    {/* Service Date Badge */}
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black rounded-xl shadow-[3px_3px_0px_0px_#000] -rotate-1 text-xs sm:text-sm">
                                        <Calendar className="h-4.5 w-4.5 text-[#7C3AED]" />
                                        <span className="font-black uppercase tracking-wider text-slate-800">
                                            {new Date(item.serviceDate).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Tech Spec Grid Row */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    {/* Breed Badge Spec */}
                                    <div className="bg-[#F6F6F6] border-3 border-black p-3 rounded-2xl flex items-center gap-2.5 shadow-[3px_3px_0px_0px_#000]">
                                        <div className="h-8 w-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center border-2 border-black text-[#7C3AED] shrink-0">
                                            <Footprints className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">
                                                {locale === "es" ? "Raza" : "Breed"}
                                            </p>
                                            <p className="text-xs sm:text-sm font-black text-slate-800 truncate mt-0.5" title={item.breed}>
                                                {item.breed}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Age Badge Spec */}
                                    <div className="bg-[#F6F6F6] border-3 border-black p-3 rounded-2xl flex items-center gap-2.5 shadow-[3px_3px_0px_0px_#000]">
                                        <div className="h-8 w-8 rounded-lg bg-[#FFDE4D]/20 flex items-center justify-center border-2 border-black text-[#B08A00] shrink-0">
                                            <Award className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">
                                                {locale === "es" ? "Edad" : "Age"}
                                            </p>
                                            <p className="text-xs sm:text-sm font-black text-slate-800 truncate mt-0.5" title={item.age}>
                                                {item.age}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description Block */}
                                <div className="bg-white border-3 border-black p-5 rounded-2.5xl text-sm sm:text-base leading-relaxed text-slate-800 font-bold shadow-[4px_4px_0px_0px_#000] relative">
                                    <div className="absolute -top-3.5 left-4 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border border-white/20">
                                        {locale === "es" ? "Ficha Técnica" : "Case Record"}
                                    </div>
                                    <p className="whitespace-pre-line text-xs sm:text-sm font-bold text-slate-700 leading-relaxed pt-1">
                                        {locale === "es" ? item.descriptionEs : item.descriptionEn}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
