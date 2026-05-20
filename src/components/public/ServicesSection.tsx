"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Scissors, Bath, Bone, PawPrint } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ContactForm from "./ContactForm";
import { CloudDoodle, StripedCloudDoodle, ZigzagYellowDoodle, CyanPlusDoodle, OrangeBlobDoodle } from "./Doodles";
import { DogCollage } from "./DogCollage";

import { Droplets, Heart, Award, Gift, Clock, ShieldCheck } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    scissors: Scissors,
    sparkles: Sparkles,
    droplets: Droplets,
    heart: Heart,
    award: Award,
    gift: Gift,
    clock: Clock,
    shield: ShieldCheck,
};

interface ServiceFromDB {
    id: string;
    titleEs: string;
    titleEn: string;
    descEs: string;
    descEn: string;
    price: string | number | null;
    imageUrl: string | null;
    active: boolean;
    order: number;
    icon?: string | null;
    recommendedProducts?: string | null;
}

interface ServicesSectionProps {
    initialServices: ServiceFromDB[];
    locale: string;
}

export default function ServicesSection({ initialServices, locale }: ServicesSectionProps) {
    const t = useTranslations("Index");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<string>("");

    const openBooking = (serviceName: string) => {
        setSelectedService(serviceName);
        setIsOpen(true);
    };

    const getIcon = (iconName: string | null | undefined, title: string) => {
        if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
        if (title.toLowerCase().includes("baño") || title.toLowerCase().includes("bath")) return Bath;
        if (title.toLowerCase().includes("corte") || title.toLowerCase().includes("grooming")) return Scissors;
        return Sparkles;
    };

    return (
        <section id="services" className="py-24 bg-background relative overflow-visible">
            {/* Decorative Doodles from new library */}
            <motion.div 
                className="absolute top-10 right-[-5%] w-64 h-64 z-0 opacity-40 rotate-12"
                style={{ animationDuration: '8s' }}
            >
                <StripedCloudDoodle className="w-full h-full" />
            </motion.div>
            <motion.div 
                className="absolute bottom-20 left-[5%] z-20 doodle-xxx text-5xl rotate-12 opacity-80 text-foreground"
            >
                x x x
            </motion.div>
            <motion.div 
                className="absolute top-[25%] left-[-5%] w-48 h-24 z-0"
            >
                <ZigzagYellowDoodle className="w-full h-full rotate-[-15deg] opacity-80" />
            </motion.div>
            <motion.div 
                className="absolute bottom-10 right-10 z-0"
            >
                <CyanPlusDoodle className="scale-125 opacity-60" />
            </motion.div>
            <motion.div 
                className="absolute top-[15%] left-[20%] w-32 h-32 z-0 opacity-80"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
            >
                <CloudDoodle className="w-full h-full" />
            </motion.div>
            <motion.div 
                className="absolute top-[40%] right-[10%] w-24 h-24 z-0 opacity-70"
            >
                <OrangeBlobDoodle className="w-full h-full" />
            </motion.div>
            <div className="container px-4 md:px-8 relative z-10 max-w-[95vw] mx-auto">
                <div className="mb-16 flex flex-col items-center justify-center text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-foreground mb-6"
                    >
                        {t('servicesTitle')} <span className="text-primary drop-shadow-[3px_3px_0px_#0F172A]">{t('servicesTitleHighlight')}</span>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl text-foreground/80 font-bold text-lg md:text-xl tracking-tight"
                    >
                        {t('servicesSubtitle')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {initialServices.map((service, idx) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15 }}
                            className="group h-full"
                        >
                            <Card className={cn(
                                "relative flex flex-col h-full bg-white border-[3px] border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_#0F172A] transition-all duration-300 hover:translate-x-[-8px] hover:translate-y-[-8px] hover:shadow-[16px_16px_0px_0px_#0F172A]",
                            )}>
                                <div className="relative aspect-4/3 w-full overflow-hidden border-b-[3px] border-black bg-accent/20">
                                    {service.imageUrl ? (
                                        <Image
                                            src={service.imageUrl}
                                            alt={service.titleEs}
                                            fill
                                            unoptimized={service.imageUrl?.includes('uploads')}
                                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {(() => {
                                                const Icon = getIcon(service.icon, service.titleEs);
                                                return <Icon className="h-16 w-16 text-primary/30" />;
                                            })()}
                                        </div>
                                    )}
                                    {/* Small corner badge in card */}
                                    <div className="absolute top-4 right-4 bg-secondary border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-[2px_2px_0px_0px_#0F172A]">
                                        Popular
                                    </div>
                                </div>
                                
                                <CardHeader className="p-5 pb-3 relative z-10 bg-white grow flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#0F172A] text-neutral-900">
                                            {(() => {
                                                const Icon = getIcon(service.icon, service.titleEs);
                                                return <Icon className="h-5 w-5" />;
                                            })()}
                                        </div>
                                        <div className="px-3 py-1 bg-white border-2 border-black rounded-full shadow-[3px_3px_0px_0px_#0F172A]">
                                            <span className="text-xl font-black text-foreground">
                                                ${service.price?.toString() || "0"}
                                            </span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-black tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors">
                                        {locale === 'es' ? service.titleEs : service.titleEn}
                                    </CardTitle>
                                    <p className="text-foreground/70 text-sm font-bold leading-relaxed line-clamp-2 mb-4">
                                        {locale === 'es' ? service.descEs : service.descEn}
                                    </p>
                                    {service.recommendedProducts ? (
                                        <div className="mt-auto pt-4 border-t-2 border-black/10">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Incluye en sesión:</span>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[8.5px] font-black uppercase text-slate-700">
                                                {service.recommendedProducts.split(',').filter((s: string) => s.trim() !== "").map((item: string, i: number) => {
                                                    const key = item.trim();
                                                    const translated = t(`inclusions.${key}`, { defaultMessage: key });
                                                    return (
                                                        <li key={i} className="flex items-start space-x-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                                            <span className="leading-tight">{translated}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="mt-auto" />
                                    )}
                                </CardHeader>
                                
                                <CardFooter className="p-5 pt-3 relative z-10 bg-white">
                                    <Button
                                        onClick={() => openBooking(locale === 'es' ? service.titleEs : service.titleEn)}
                                        className={cn(
                                            "w-full h-11 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#0F172A] hover:shadow-[2px_2px_0px_0px_#0F172A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black text-sm tracking-tight group/btn",
                                            idx % 2 === 0 ? "bg-primary text-white" : "bg-white text-foreground"
                                        )}
                                    >
                                        <span>{t('bookNow')}</span>
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[95vh] overflow-y-auto rounded-3xl border-[3px] border-black bg-white p-4 sm:p-8 shadow-[12px_12px_0px_0px_#0F172A] z-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                            {t('bookNow', { defaultMessage: "Reservar Cita" })}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            {t('formDesc', { defaultMessage: "Te responderemos lo antes posible." })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <ContactForm 
                            locale={locale} 
                            services={initialServices} 
                            initialService={selectedService} 
                            onSuccess={() => setIsOpen(false)} 
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Removed Perro 2 as it will be placed above the footer instead */}

        </section>
    );
}
