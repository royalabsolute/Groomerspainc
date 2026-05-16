"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Headphones } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import ContactForm from "./ContactForm";

interface ContactSectionProps {
    config?: {
        phone: string | null;
        email: string | null;
        address: string | null;
        contactTitleEs: string | null;
        contactTitleEn: string | null;
        contactSubtitleEs: string | null;
        contactSubtitleEn: string | null;
        hoursEs: string | null;
        hoursEn: string | null;
    } | null;
    locale: string;
    services?: any[];
}

export default function ContactSection({ config, locale, services }: ContactSectionProps) {
    const t = useTranslations("Index");
    const searchParams = useSearchParams();
    const preselectedService = searchParams.get("service");

    const title = locale === 'es'
        ? (config?.contactTitleEs || t('contactTitle', { defaultMessage: "Contacto" }))
        : (config?.contactTitleEn || t('contactTitle', { defaultMessage: "Contact" }));

    const subtitle = locale === 'es'
        ? (config?.contactSubtitleEs || t('contactSubtitle', { defaultMessage: "¿Listo para mimar a tu mascota?" }))
        : (config?.contactSubtitleEn || t('contactSubtitle', { defaultMessage: "Ready to pamper your pet?" }));

    const hours = locale === 'es'
        ? (config?.hoursEs || t('defaultHours', { defaultMessage: "Lun - Sáb: 9:00 AM - 6:00 PM" }))
        : (config?.hoursEn || t('defaultHours', { defaultMessage: "Mon - Sat: 9:00 AM - 6:00 PM" }));

    return (
        <section id="contact" className="py-24 bg-background relative overflow-hidden">
            {/* Background Doodles */}
            <motion.div 
                className="absolute top-10 left-[5%] w-24 h-24 bg-accent/30 rounded-3xl rotate-12 border-2 border-black z-0"
            />
            <motion.div 
                className="absolute bottom-20 right-[5%] z-20 doodle-xxx text-5xl rotate-6"
            >
                x x x
            </motion.div>
            <motion.div 
                className="absolute top-1/2 left-0 w-24 h-6 zigzag opacity-30 z-0"
            />
            <div className="container px-4 md:px-6 relative z-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    <div className="flex flex-col justify-center space-y-12">
                        <div className="flex flex-col mb-10">
                            <motion.h2 
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-foreground mb-4 leading-none"
                            >
                                {title}
                            </motion.h2>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-muted-foreground md:text-xl lg:text-2xl tracking-tight font-medium"
                            >
                                {subtitle}
                            </motion.p>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="grid gap-8"
                        >
                            <div className="flex items-center space-x-6 group">
                                <div className="p-5 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] group-hover:bg-secondary transition-colors">
                                    <MapPin className="h-7 w-7 text-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black text-foreground tracking-tight mb-1 uppercase text-sm">{t('addressTitle')}</h3>
                                    <p className="text-foreground/80 font-bold text-lg break-words">{config?.address || "123 Miami Ave, Miami, FL 33101"}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6 group">
                                <div className="p-5 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] group-hover:bg-primary transition-colors">
                                    <Phone className="h-7 w-7 text-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black text-foreground tracking-tight mb-1 uppercase text-sm">{t('phoneTitle')}</h3>
                                    <p className="text-foreground/80 font-bold text-lg break-all">{config?.phone || "+1 (305) 555-0123"}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6 group">
                                <div className="p-5 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] group-hover:bg-accent transition-colors">
                                    <Mail className="h-7 w-7 text-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black text-foreground tracking-tight mb-1 uppercase text-sm">{t('emailTitle')}</h3>
                                    <p className="text-foreground/80 font-bold text-lg break-all">{config?.email || "hello@groomersinc.com"}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6 group">
                                <div className="p-5 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] group-hover:bg-secondary transition-colors">
                                    <Clock className="h-7 w-7 text-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black text-foreground tracking-tight mb-1 uppercase text-sm">{t('hoursTitle')}</h3>
                                    <p className="text-foreground/80 font-bold text-lg break-words">{hours}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-[3px] border-black bg-white rounded-3xl shadow-[10px_10px_0px_0px_#0F172A] relative overflow-hidden group/card hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[14px_14px_0px_0px_#0F172A] transition-all duration-300">
                            <CardHeader className="p-8 pb-4 bg-secondary border-b-[3px] border-black">
                                <CardTitle className="text-3xl font-black text-foreground tracking-tight">{t('formTitle')}</CardTitle>
                                <CardDescription className="text-foreground/70 font-bold">{t('formDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-6">
                                <div className="[&_input]:bg-white [&_input]:border-2 [&_input]:border-black [&_input]:text-foreground [&_input]:rounded-xl [&_input]:h-12 [&_input]:px-4 [&_input]:shadow-[3px_3px_0px_0px_#0F172A] [&_input]:font-bold [&_textarea]:bg-white [&_textarea]:border-2 [&_textarea]:border-black [&_textarea]:text-foreground [&_textarea]:rounded-xl [&_textarea]:p-4 [&_textarea]:shadow-[3px_3px_0px_0px_#0F172A] [&_textarea]:font-bold [&_label]:text-foreground [&_label]:font-black [&_label]:uppercase [&_label]:text-sm [&_button]:rounded-xl [&_button]:bg-primary [&_button]:text-white [&_button]:border-2 [&_button]:border-black [&_button]:shadow-[4px_4px_0px_0px_#0F172A] hover:[&_button]:shadow-[2px_2px_0px_0px_#0F172A] hover:[&_button]:translate-x-[2px] hover:[&_button]:translate-y-[2px] [&_button]:font-black [&_button]:h-14 [&_button]:text-lg [&_button]:tracking-tight">
                                    <ContactForm 
                                        locale={locale} 
                                        services={services} 
                                        initialService={preselectedService || ""} 
                                    />
                                </div>
                            </CardContent>
                            {/* Inner Decoration */}
                            <motion.div 
                                className="absolute bottom-[-20px] right-[-20px] w-24 h-24 bg-accent/20 doodle-shape z-0 opacity-0 group-hover/card:opacity-100 transition-opacity"
                            />
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
