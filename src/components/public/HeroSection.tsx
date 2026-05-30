"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { DogCollage } from "./DogCollage";

interface HeroSectionProps {
    config?: {
        heroTitleEs: string | null;
        heroTitleEn: string | null;
        heroDescEs: string | null;
        heroDescEn: string | null;
        heroHighlightEs: string | null;
        heroHighlightEn: string | null;
        heroImageUrl?: string | null;
    } | null;
    locale: string;
}

export default function HeroSection({ config, locale }: HeroSectionProps) {
    const t = useTranslations("Index");

    const displayTitle = locale === 'es' ? (config?.heroTitleEs || "Cuidado") : (config?.heroTitleEn || "Professional");
    const highlight = locale === 'es' ? (config?.heroHighlightEs || "Profesional") : (config?.heroHighlightEn || "Care");
    
    return (
        <LazyMotion features={domAnimation}>
            <section className="relative overflow-hidden min-h-[85svh] flex flex-col justify-center items-center bg-background pt-32 pb-12">
                
                {/* Background Doodles at far edges */}
                <m.div className="absolute top-[10%] left-[2%] w-48 h-48 concentric-circles -z-10 opacity-30" />
                <m.div className="absolute top-[15%] right-[2%] w-64 h-64 striped-doodle-bw -z-10 rotate-12" />
                <m.div className="absolute bottom-[10%] left-[1%] w-[30vw] h-[30vw] bg-accent/20 doodle-shape -z-10" />

                <div className="container px-4 md:px-8 relative z-10 max-w-[95vw] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    
                    {/* Left: Huge Text */}
                    <div className="flex flex-col items-start text-left space-y-8">
                        <m.h1
                            initial={{ opacity: 0, x: -100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, type: "spring" }}
                            className="text-[clamp(2.5rem,10vw,8.5rem)] font-black leading-[0.9] sm:leading-[0.8] tracking-tighter text-foreground mb-4 uppercase break-normal w-full"
                        >
                            {displayTitle} <br/>
                            <span className="text-primary drop-shadow-[6px_6px_0px_#1A1A1A] md:drop-shadow-[8px_8px_0px_#1A1A1A] [-webkit-text-stroke:2px_#0F172A] md:[-webkit-text-stroke:3px_#0F172A] inline-block">
                                {highlight}
                            </span>
                        </m.h1>

                        <m.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-5 max-w-2xl"
                        >
                            {/* Pop-art sticker tag */}
                            <div className="inline-flex items-center gap-2 bg-accent border-[3px] border-black rounded-2xl px-5 py-2 shadow-[5px_5px_0px_0px_#0F172A] rotate-[-1.5deg]">
                                <Sparkles className="w-5 h-5 shrink-0" />
                                <span className="text-base font-black uppercase tracking-widest">¡DOG PARTY EDITION!</span>
                            </div>

                            {/* Comic-style descriptive text */}
                            <p className="text-xl md:text-2xl font-black leading-snug uppercase tracking-tight border-l-[5px] border-primary pl-4">
                                {locale === 'es'
                                    ? "Tu mejor amigo merece verse"
                                    : "Your best friend deserves to"
                                }
                                <span className="block text-primary">{
                                    locale === 'es' ? "¡ESPECTACULAR! 🐾" : "LOOK AMAZING! 🐾"
                                }</span>
                            </p>

                            <p className="text-lg md:text-xl font-bold leading-relaxed">
                                {locale === 'es'
                                    ? "Servicios profesionales de grooming spa en Miami."
                                    : "Professional grooming spa services in Miami."}
                            </p>
                            
                            <div className="flex flex-wrap gap-6 pt-4">
                                <Button 
                                    size="lg" 
                                    className="h-16 px-10 text-lg font-black bg-primary text-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all"
                                    asChild
                                >
                                    <Link href="/#cotizar">{t('bookNow')}</Link>
                                </Button>
                                <Button 
                                    size="lg" 
                                    variant="outline"
                                    className="h-16 px-10 text-lg font-black bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all hover:bg-secondary/10"
                                    asChild
                                >
                                    <Link href="/#cotizar">{t('viewServices')}</Link>
                                </Button>
                            </div>
                        </m.div>
                    </div>

                    {/* Right: Image Collage */}
                    <div className="relative flex items-center justify-center min-h-[500px]">
                        <m.div 
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1.2, type: "spring", damping: 12 }}
                            className="w-full max-w-2xl"
                        >
                            <DogCollage 
                                src="/assets/hero_dog_svg.svg" 
                                variant="A" 
                            />
                        </m.div>
                    </div>
                </div>
            </section>
        </LazyMotion>
    );
}
