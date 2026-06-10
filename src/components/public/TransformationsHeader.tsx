"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

interface TransformationsHeaderProps {
    locale: string;
}

export default function TransformationsHeader({ locale }: TransformationsHeaderProps) {
    return (
        <div className="relative pt-32 pb-12 overflow-hidden z-10">
            <div className="container relative z-10 text-center max-w-4xl mx-auto space-y-6 px-4">
                <motion.div 
                    initial={{ rotate: -2, scale: 0.9, opacity: 0 }}
                    animate={{ rotate: -0.5, scale: 1, opacity: 1 }}
                    className="inline-block"
                >
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 border-[3.5px] border-black font-black uppercase text-xs tracking-wider bg-[#FAF9F6] text-black shadow-[3px_3px_0px_0px_#000] -rotate-1">
                        <GraduationCap className="h-4.5 w-4.5 text-black shrink-0" />
                        {locale === "es" ? "EVALUACIÓN Y CERTIFICACIÓN ACADÉMICA" : "ACADEMIC EVALUATION & CERTIFICATION"}
                    </div>
                </motion.div>

                <div className="space-y-4">
                    <motion.h1 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl leading-none font-black tracking-tighter uppercase text-black"
                    >
                        {locale === "es" ? (
                            <>Portafolio <br className="sm:hidden" /><span className="text-neutral-800">de Estudio</span></>
                        ) : (
                            <>Study <br className="sm:hidden" /><span className="text-neutral-800">Portfolio</span></>
                        )}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-neutral-700 font-bold text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                    >
                        {locale === "es"
                            ? "Registro técnico y evaluación del estándar de estilismo de nuestras prácticas profesionales."
                            : "Technical registry and styling standard evaluation of our professional training cases."}
                    </motion.p>
                </div>
            </div>
        </div>
    );
}
