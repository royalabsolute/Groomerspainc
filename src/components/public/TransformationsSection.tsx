"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, SlidersHorizontal, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { PopArtDots, PopArtSticker, getRandomDecoration } from "./PopArtDecorations";

interface Transformation {
    id: string;
    titleEs: string;
    titleEn: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    date: Date | string;
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
            const title = locale === "es" ? t.titleEs : t.titleEn;
            const matchesSearch = title.toLowerCase().includes(search.toLowerCase());

            const itemDate = new Date(t.date);
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
            {/* Search & Filter Bar - NeoBrutalist Style */}
            <div className="bg-white border-4 border-black p-6 space-y-6 shadow-[10px_10px_0px_0px_#1A1A1A] rounded-[2rem]">
                <div className="flex gap-4 flex-wrap items-center">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground z-10" />
                        <Input
                            placeholder={locale === "es" ? "Buscar por título..." : "Search by title..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-14 rounded-xl border-[3px] border-black bg-secondary/10 font-bold placeholder:text-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                        />
                    </div>
                    
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-14 px-8 rounded-xl border-[3px] border-black font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all",
                            showFilters ? "bg-accent text-black" : "bg-white text-black"
                        )}
                    >
                        <SlidersHorizontal className="h-5 w-5 mr-2" />
                        {locale === "es" ? "Filtros" : "Filters"}
                    </Button>

                    {hasFilters && (
                        <Button 
                            variant="ghost" 
                            onClick={clearFilters} 
                            className="h-14 px-6 rounded-xl font-black text-primary hover:bg-primary/10"
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
            <p className="text-sm text-muted-foreground font-medium">
                {locale === "es"
                    ? `${filtered.length} transformación${filtered.length !== 1 ? "es" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`
                    : `${filtered.length} transformation${filtered.length !== 1 ? "s" : ""} found`}
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-32 bg-white border-4 border-black border-dashed rounded-[3rem] shadow-[10px_10px_0px_0px_#EEE]">
                    <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary opacity-40" />
                    <p className="text-2xl font-black uppercase tracking-tight text-foreground/50">
                        {locale === "es" ? "No se encontraron resultados." : "No results found."}
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

                            {/* Slider */}
                            <div className="p-6 md:p-8 relative z-10">
                                <div className="rounded-[2.5rem] border-4 border-black overflow-hidden bg-black shadow-[8px_8px_0px_0px_#000]">
                                    <BeforeAfterSlider
                                        beforeUrl={item.beforeImageUrl}
                                        afterUrl={item.afterImageUrl}
                                        beforeLabel={locale === "es" ? "ANTES" : "BEFORE"}
                                        afterLabel={locale === "es" ? "DESPUÉS" : "AFTER"}
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="px-8 pb-8 pt-2 space-y-4 relative z-10">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <h3 className="font-black text-2xl sm:text-4xl md:text-5xl tracking-tight uppercase [text-shadow:2px_2px_0_#0F172A,2px_-2px_0_#0F172A,-2px_2px_0_#0F172A,-2px_-2px_0_#0F172A] text-white break-words w-full">
                                        {locale === "es" ? item.titleEs : item.titleEn}
                                    </h3>
                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-accent border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] -rotate-2">
                                        <Calendar className="h-6 w-6" />
                                        <span className="text-base font-black uppercase tracking-wider">
                                            {new Date(item.date).toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
