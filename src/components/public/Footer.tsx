"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Facebook, Instagram, X, Lock } from "lucide-react";
import Image from "next/image";
import { DogCollage } from "./DogCollage";
import { CloudDoodle, StripedCloudDoodle, DiagonalLinesDoodle, CyanPlusDoodle } from "./Doodles";

interface FooterProps {
    config?: {
        phone: string | null;
        email: string | null;
        address: string | null;
        footerDescEs: string | null;
        footerDescEn: string | null;
        facebookUrl: string | null;
        instagramUrl: string | null;
        twitterUrl: string | null;
        facebookActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
        heroHighlightEs?: string | null; 
    } | null;
    locale: string;
}

export default function Footer({ config, locale }: FooterProps) {
    const t = useTranslations("Index");
    const tNav = useTranslations("Navigation");

    return (
        <footer className="mt-40 pb-12 px-4 md:px-8 relative overflow-visible">
            {/* Perro 2 sitting on top of the footer card */}
            <div className="absolute top-[-310px] left-[5%] md:left-[10%] w-[350px] h-[350px] z-30 pointer-events-none hidden sm:block">
                <DogCollage src="/assets/perro_2.svg" variant="B" />
            </div>

            {/* Background Doodles behind the footer card */}
            <div className="absolute top-[-50px] right-10 w-48 h-48 opacity-30 z-0">
                <StripedCloudDoodle className="w-full h-full rotate-12" />
            </div>
            <div className="absolute bottom-10 left-4 w-32 h-32 opacity-20 z-0">
                <DiagonalLinesDoodle className="w-full h-full -rotate-12" />
            </div>
            <div className="absolute top-20 right-[20%] opacity-40 z-0">
                <CyanPlusDoodle className="scale-150 rotate-45" />
            </div>

            {/* Main Floating Footer Card */}
            <div className="container max-w-7xl mx-auto bg-white border-4 border-black rounded-[2rem] shadow-[12px_12px_0px_0px_#0F172A] p-8 md:p-12 relative z-10 flex flex-col gap-10">
                
                {/* Top Section: Branding & Links */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                    
                    {/* Left: Branding & Info */}
                    <div className="lg:col-span-5 space-y-8">
                        <Link href="/" className="inline-block hover:scale-105 hover:translate-y-[-2px] transition-all -rotate-1">
                            <div className="relative h-32 w-64 sm:h-40 sm:w-80 md:h-48 md:w-96">
                                <Image
                                    src="/Favicon.svg"
                                    alt="GroomingPet Logo"
                                    fill
                                    className="object-contain drop-shadow-[5px_5px_0px_#1A1A1A]"
                                />
                            </div>
                        </Link>
                        
                        <p className="text-foreground font-black text-xl leading-snug max-w-md">
                            {locale === 'es' ? (config?.footerDescEs || t('Footer.description')) : (config?.footerDescEn || t('Footer.description'))}
                        </p>
                        
                        <div className="inline-flex flex-col bg-secondary border-[3px] border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_#0F172A] font-black uppercase text-sm tracking-widest gap-2 rotate-1">
                            <p className="flex items-center gap-2">📍 {config?.address || "123 Miami Ave, Miami, FL 33101"}</p>
                            <p className="flex items-center gap-2">📞 {config?.phone || "(305) 555-0123"}</p>
                        </div>
                    </div>

                    {/* Right: Links */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <h3 className="font-black text-lg uppercase tracking-widest bg-primary text-white inline-block px-4 py-1.5 border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_#0F172A] -rotate-2">
                                {t('Footer.navTitle')}
                            </h3>
                            <ul className="space-y-3 font-bold text-foreground text-lg">
                                <li><Link href="/" className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all">{tNav('home')}</Link></li>
                                <li><Link href="/#services" className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all">{tNav('services')}</Link></li>
                                <li><Link href="/#gallery" className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all">{tNav('gallery')}</Link></li>
                                <li><Link href="/#contact" className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all">{tNav('contact')}</Link></li>
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <h3 className="font-black text-lg uppercase tracking-widest bg-info text-foreground inline-block px-4 py-1.5 border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_#0F172A] rotate-2">
                                {t('Footer.servicesTitle')}
                            </h3>
                            <ul className="space-y-3 font-bold text-foreground text-lg">
                                <li className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all cursor-pointer">{t('services.service1Title')}</li>
                                <li className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all cursor-pointer">{t('services.service2Title')}</li>
                                <li className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all cursor-pointer">{t('services.service3Title')}</li>
                            </ul>
                        </div>

                        {/* Column 3 */}
                        <div className="space-y-6">
                            <h3 className="font-black text-lg uppercase tracking-widest bg-secondary text-foreground inline-block px-4 py-1.5 border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_#0F172A] -rotate-1">
                                {t('Footer.legalTitle')}
                            </h3>
                            <ul className="space-y-3 font-bold text-foreground text-lg">
                                <li><Link href="/privacy" className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all">{t('Footer.privacy')}</Link></li>
                                <li><Link href="/terms" className="hover:text-primary hover:underline decoration-[3px] underline-offset-4 transition-all">{t('Footer.terms')}</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Socials & Copyright */}
                <div className="pt-8 mt-2 border-t-4 border-black border-dashed flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex space-x-4">
                        {(config?.facebookActive !== false) && config?.facebookUrl && (
                            <Link href={config.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-14 w-14 flex items-center justify-center bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#0F172A] text-[#1877F2] hover:bg-primary hover:text-white transition-all rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0F172A]">
                                <Facebook className="h-6 w-6 fill-current" />
                            </Link>
                        )}
                        {(config?.instagramActive !== false) && config?.instagramUrl && (
                            <Link href={config.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-14 w-14 flex items-center justify-center bg-linear-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] border-[3px] border-black shadow-[4px_4px_0px_0px_#0F172A] text-white transition-all rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0F172A]">
                                <Instagram className="h-6 w-6" />
                            </Link>
                        )}
                        {(config?.twitterActive !== false) && config?.twitterUrl && (
                            <Link href={config.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="h-14 w-14 flex items-center justify-center bg-black border-[3px] border-black shadow-[4px_4px_0px_0px_#0F172A] text-white transition-all rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0F172A]">
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293l13.314 17.411z" />
                                </svg>
                            </Link>
                        )}
                        
                        {/* Admin Login Button */}
                        <Link href="/login-admin" className="h-14 flex items-center gap-2 px-4 bg-primary border-[3px] border-black shadow-[4px_4px_0px_0px_#0F172A] text-white font-black hover:bg-black hover:text-white transition-all rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0F172A]">
                            <Lock className="h-5 w-5" />
                            <span className="hidden sm:inline">ADMIN</span>
                        </Link>
                    </div>
                    
                    <div className="text-sm font-black text-foreground uppercase tracking-widest text-center md:text-right bg-accent px-5 py-3 border-[3px] border-black rounded-xl rotate-1 shadow-[4px_4px_0px_0px_#0F172A]">
                        &copy; {new Date().getFullYear()} GroomingPet. <br className="md:hidden" /> All rights reserved. 🫧 Miami
                    </div>
                </div>
            </div>
        </footer>
    );
}
