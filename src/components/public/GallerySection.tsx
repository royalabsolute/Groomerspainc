"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRandomDecoration, PopArtDots } from "./PopArtDecorations";

interface GalleryItemFromDB {
    id: string;
    url: string;
    type: string;
    category?: string | null;
    createdAt: Date;
}

interface GallerySectionProps {
    initialItems: GalleryItemFromDB[];
}

export default function GallerySection({ initialItems }: GallerySectionProps) {
    const t = useTranslations("Index");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    if (initialItems.length === 0) return null;

    const images = initialItems.map(item => item.url).slice(0, 8);

    const getCardStyle = (index: number) => {
        const diff = (index - currentIndex + images.length) % images.length;
        
        if (diff === 0) {
            return {
                x: "0%",
                scale: 1,
                zIndex: 30,
                opacity: 1,
                rotate: 0,
                boxShadow: "15px 15px 0px 0px #1A1A1A"
            };
        } else if (diff === 1 || (currentIndex === images.length - 1 && index === 0)) {
            return {
                x: "60%",
                scale: 0.8,
                zIndex: 20,
                opacity: 0.7,
                rotate: 6,
                boxShadow: "8px 8px 0px 0px #1A1A1A"
            };
        } else if (diff === images.length - 1 || (currentIndex === 0 && index === images.length - 1)) {
            return {
                x: "-60%",
                scale: 0.8,
                zIndex: 20,
                opacity: 0.7,
                rotate: -6,
                boxShadow: "8px 8px 0px 0px #1A1A1A"
            };
        } else {
            return {
                x: direction > 0 ? "100%" : "-100%",
                scale: 0.5,
                zIndex: 0,
                opacity: 0,
                rotate: 0,
                boxShadow: "0px 0px 0px 0px #1A1A1A"
            };
        }
    };

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prevIndex) => (prevIndex + newDirection + images.length) % images.length);
    };

    return (
        <section id="gallery" className="py-24 bg-white relative overflow-hidden">
            <div className="container px-4 md:px-8 relative z-10 max-w-[95vw] mx-auto">
                <div className="mb-16 flex flex-col items-center justify-center text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-foreground mb-6"
                    >
                        {t('galleryTitle')} <span className="text-primary [text-shadow:3px_3px_0_#0F172A]">{t('galleryTitleHighlight')}</span>
                    </motion.h2>
                    <motion.p 
                        className="max-w-2xl text-foreground/80 font-bold text-lg md:text-xl tracking-tight"
                    >
                        {t('gallerySubtitle')}
                    </motion.p>
                </div>

                <div className="relative h-[450px] md:h-[600px] flex items-center justify-center w-full max-w-5xl mx-auto mt-10">
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                        <PopArtDots className="w-full h-[80%] rounded-[3rem]" />
                    </div>

                    <button 
                        onClick={() => paginate(-1)}
                        title="Anterior"
                        className="absolute left-[-10px] md:left-[-40px] z-40 p-4 bg-white border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] hover:bg-accent hover:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_#000] transition-all"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    <button 
                        onClick={() => paginate(1)}
                        title="Siguiente"
                        className="absolute right-[-10px] md:right-[-40px] z-40 p-4 bg-white border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] hover:bg-info hover:text-white hover:-translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_#000] transition-all"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                        {images.map((imgSrc, idx) => {
                            const style = getCardStyle(idx);
                            const isCenter = style.scale === 1;

                            return (
                                <motion.div
                                    key={idx}
                                    animate={{
                                        x: style.x,
                                        scale: style.scale,
                                        zIndex: style.zIndex,
                                        opacity: style.opacity,
                                        rotate: style.rotate,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 250,
                                        damping: 25,
                                    }}
                                    className={cn(
                                        "absolute w-[70%] max-w-[400px] aspect-square flex items-center justify-center",
                                        isCenter ? "cursor-zoom-in" : "cursor-pointer"
                                    )}
                                    onClick={() => {
                                        if (isCenter) {
                                            setSelectedImage(imgSrc);
                                        } else {
                                            const diff = (idx - currentIndex + images.length) % images.length;
                                            if (diff === 1 || (currentIndex === images.length - 1 && idx === 0)) {
                                                paginate(1);
                                            } else {
                                                paginate(-1);
                                            }
                                        }
                                    }}
                                >
                                    <div className="absolute top-[-10%] right-[-10%] z-[-1] pointer-events-none">
                                        {getRandomDecoration(idx * 3)}
                                    </div>
                                    <div className="absolute bottom-[-5%] left-[-15%] z-[-1] pointer-events-none">
                                        {getRandomDecoration(idx * 3 + 1)}
                                    </div>

                                    <motion.div 
                                        className="relative w-full h-full border-4 border-black rounded-4xl md:rounded-[3rem] overflow-hidden bg-white group shadow-[15px_15px_0px_0px_#1A1A1A]"
                                        animate={{ boxShadow: style.boxShadow }}
                                    >
                                        <Image
                                            src={imgSrc}
                                            alt="Gallery"
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, 400px"
                                        />
                                        <div className="absolute top-4 left-4 z-10 pointer-events-none">
                                            {getRandomDecoration(idx * 3 + 2)}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-3">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setDirection(idx > currentIndex ? 1 : -1);
                                setCurrentIndex(idx);
                            }}
                            title={`Slide ${idx + 1}`}
                            className={cn(
                                "w-4 h-4 rounded-full border-2 border-black transition-all",
                                currentIndex === idx ? "w-12 bg-primary shadow-[2px_2px_0px_0px_#000]" : "bg-white hover:bg-secondary"
                            )}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 cursor-zoom-out"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-4xl aspect-video md:aspect-4/3 rounded-4xl border-4 border-black bg-white overflow-hidden shadow-[12px_12px_0px_0px_#000] cursor-default"
                        >
                            <Image
                                src={selectedImage}
                                alt="Zoomed gallery"
                                fill
                                sizes="100vw"
                                className="object-cover"
                                priority
                            />
                            
                            {/* Premium Close Button */}
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 z-10 p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full border-3 border-black shadow-[3px_3px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_#000] cursor-pointer transition-all flex items-center justify-center"
                                title="Cerrar"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white stroke-[3.5]" fill="none">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
