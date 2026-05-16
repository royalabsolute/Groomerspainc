"use client";

import { motion } from "framer-motion";
import { PopArtZap, PopArtSticker } from "./PopArtDecorations";

interface TransformationsHeaderProps {
    locale: string;
}

export default function TransformationsHeader({ locale }: TransformationsHeaderProps) {
    return (
        <div className="relative pt-32 pb-16 overflow-hidden z-10">
            <div className="container relative z-10 text-center max-w-4xl mx-auto space-y-8 px-4">
                <motion.div 
                    initial={{ rotate: -5, scale: 0.9, opacity: 0 }}
                    animate={{ rotate: -2, scale: 1, opacity: 1 }}
                    className="inline-block"
                >
                    <PopArtSticker text="REAL MAGIC" color="bg-accent" className="text-xl" />
                </motion.div>

                <div className="space-y-4">
                    <motion.h1 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none font-black tracking-tighter uppercase [text-shadow:3px_3px_0_#0F172A] text-white w-full"
                    >
                        {locale === "es" ? (
                            <>Nuestras <br className="sm:hidden" /><span className="text-primary [text-shadow:3px_3px_0_#0F172A]">Transformaciones</span></>
                        ) : (
                            <>Our <br className="sm:hidden" /><span className="text-primary [text-shadow:3px_3px_0_#0F172A]">Transformations</span></>
                        )}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-foreground font-black text-xl md:text-2xl max-w-2xl mx-auto leading-tight"
                    >
                        {locale === "es"
                            ? "¡Mira el cambio radical! Resultados reales que sacan la mejor versión de tu mascota."
                            : "See the radical change! Real results that bring out the best version of your pet."}
                    </motion.p>
                </div>

                <div className="absolute top-10 right-[10%] w-24 h-24 rotate-12 opacity-40 hidden md:block">
                    <PopArtZap />
                </div>
            </div>
        </div>
    );
}
