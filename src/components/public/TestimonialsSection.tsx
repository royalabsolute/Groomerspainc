"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Star, Quote, User, MessageCircle, Bone, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CloudDoodle, StripedCloudDoodle, DiagonalLinesDoodle, CyanPlusDoodle } from "./Doodles";

interface Testimonial {
    id: string;
    clientName: string;
    messageEs: string;
    messageEn: string | null;
    rating: number;
    imageUrl: string | null;
}

interface TestimonialsSectionProps {
    testimonials: Testimonial[];
    locale: string;
}

export default function TestimonialsSection({ testimonials, locale }: TestimonialsSectionProps) {
    const t = useTranslations("Index");
    if (testimonials.length === 0) return null;

    return (
        <section id="testimonials" className="py-24 bg-[#F8FAFC] relative overflow-hidden">
            {/* Background Decorations from new library */}
            <motion.div 
                className="absolute top-10 right-[-5%] w-64 h-64 z-0 opacity-30 rotate-12"
            >
                <StripedCloudDoodle className="w-full h-full" />
            </motion.div>
            <motion.div 
                className="absolute bottom-[20%] left-[5%] z-20 doodle-xxx text-5xl opacity-40 text-foreground"
            >
                x x x
            </motion.div>
            <motion.div 
                className="absolute top-1/3 left-[-5%] z-0 opacity-40 w-48 h-48"
            >
                <DiagonalLinesDoodle className="w-full h-full rotate-12" />
            </motion.div>
            <motion.div 
                className="absolute bottom-[10%] right-[10%] w-32 h-32 opacity-40 z-0"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
            >
                <CloudDoodle className="w-full h-full" />
            </motion.div>
            <motion.div 
                className="absolute top-[15%] left-[25%] z-0"
            >
                <CyanPlusDoodle className="scale-125 opacity-40" />
            </motion.div>
            <div className="container relative z-10 px-4 md:px-8 max-w-[95vw] mx-auto">
                <div className="mb-16 flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-secondary border-2 border-black shadow-[4px_4px_0px_0px_#0F172A] mb-8"
                    >
                        <MessageCircle className="w-5 h-5 text-foreground" />
                        <span className="text-sm font-black text-foreground tracking-widest uppercase">Love Stories</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-foreground mb-6"
                    >
                        Lo que dicen <span className="text-primary drop-shadow-[3px_3px_0px_#0F172A]">nuestros clientes</span>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl text-muted-foreground font-medium text-lg md:text-xl tracking-tight"
                    >
                        {t('testimonialDesc', {
                            defaultMessage: locale === 'es'
                                ? "La satisfacción de nuestros clientes es nuestra mayor recompensa."
                                : "Client satisfaction is our greatest reward."
                        })}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ 
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                            className={cn(
                                "group relative bg-white p-8 border-[3px] border-black rounded-3xl shadow-[8px_8px_0px_0px_#0F172A] transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_#0F172A] flex flex-col",
                                index % 2 === 0 ? "hover:shadow-secondary" : "hover:shadow-accent"
                            )}
                        >
                            <Quote className={cn(
                                "absolute top-6 right-8 h-12 w-12 transition-colors",
                                index % 3 === 0 ? "text-primary/20 group-hover:text-primary" : index % 3 === 1 ? "text-secondary/20 group-hover:text-secondary" : "text-accent/20 group-hover:text-accent"
                            )} />

                            <div className="flex text-amber-400 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4 fill-current", i >= testimonial.rating && "text-muted fill-none")} />
                                ))}
                            </div>

                            <p className="text-muted-foreground leading-relaxed mb-8 relative z-10 flex-1 text-lg font-medium">
                                "{locale === 'es' ? testimonial.messageEs : (testimonial.messageEn || testimonial.messageEs)}"
                            </p>

                            <div className="flex items-center gap-4 mt-auto">
                                <div className="h-12 w-12 overflow-hidden bg-secondary flex items-center justify-center text-primary rounded-full apple-shadow">
                                    {testimonial.imageUrl ? (
                                        <Image
                                            src={testimonial.imageUrl}
                                            alt={testimonial.clientName}
                                            width={48}
                                            height={48}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-foreground tracking-tight">{testimonial.clientName}</span>
                                    <span className="text-xs text-muted-foreground font-medium">{t('verifiedClient', { defaultMessage: "Cliente verificado" })}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
