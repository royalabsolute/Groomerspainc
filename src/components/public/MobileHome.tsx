"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "@/navigation";
import Image from "next/image";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import { 
    Search, Scissors, Bath, Sparkles, MapPin, Phone, 
    Clock, Star, ArrowRight, X, CalendarCheck, ChevronLeft, ChevronRight,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import MobileBottomNav, { MobileTab } from "./MobileBottomNav";
import ContactForm from "./ContactForm";
import TransformationsSection from "./TransformationsSection";
import { PopArtStar, PopArtZap, PopArtZigZag, PopArtSticker, PopArtDots } from "./PopArtDecorations";

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
}

interface GalleryItemFromDB {
    id: string;
    url: string;
    type: string;
    category: string | null;
}

interface TransformationFromDB {
    id: string;
    titleEs: string;
    titleEn: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    date: string;
}

interface MobileHomeProps {
    config: any;
    locale: string;
    services: ServiceFromDB[];
    galleryItems: GalleryItemFromDB[];
    transformations: TransformationFromDB[];
}

export default function MobileHome({ config, locale, services, galleryItems, transformations }: MobileHomeProps) {
    const t = useTranslations("Index");
    const tNav = useTranslations("Navigation");
    const activeLocale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    // App state
    const [activeTab, setActiveTab] = useState<MobileTab>("home");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTab = localStorage.getItem("mobileActiveTab") as MobileTab;
            if (savedTab && ["home", "services", "transformations"].includes(savedTab)) {
                setActiveTab(savedTab);
            }
        }
    }, []);

    const handleTabChange = (tab: MobileTab) => {
        setActiveTab(tab);
        if (typeof window !== "undefined") {
            localStorage.setItem("mobileActiveTab", tab);
        }
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedService, setSelectedService] = useState<ServiceFromDB | null>(null);

    const [showBookingInSheet, setShowBookingInSheet] = useState(false);
    const [activePhoto, setActivePhoto] = useState<string | null>(null);

    // Carousel state and helpers for mobile Home tab
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [carouselDirection, setCarouselDirection] = useState(0);
    const carouselImages = galleryItems.map(item => item.url).slice(0, 8);

    const getMobileCardStyle = (index: number) => {
        const diff = (index - carouselIndex + carouselImages.length) % carouselImages.length;
        
        if (diff === 0) {
            return {
                x: "0%",
                scale: 1,
                zIndex: 30,
                opacity: 1,
                rotate: 0,
                boxShadow: "10px 10px 0px 0px #1A1A1A"
            };
        } else if (diff === 1 || (carouselIndex === carouselImages.length - 1 && index === 0)) {
            return {
                x: "48%",
                scale: 0.82,
                zIndex: 20,
                opacity: 0.65,
                rotate: 5,
                boxShadow: "6px 6px 0px 0px #1A1A1A"
            };
        } else if (diff === carouselImages.length - 1 || (carouselIndex === 0 && index === carouselImages.length - 1)) {
            return {
                x: "-48%",
                scale: 0.82,
                zIndex: 20,
                opacity: 0.65,
                rotate: -5,
                boxShadow: "6px 6px 0px 0px #1A1A1A"
            };
        } else {
            return {
                x: carouselDirection > 0 ? "100%" : "-100%",
                scale: 0.5,
                zIndex: 0,
                opacity: 0,
                rotate: 0,
                boxShadow: "0px 0px 0px 0px #1A1A1A"
            };
        }
    };

    const paginateCarousel = (newDirection: number) => {
        setCarouselDirection(newDirection);
        setCarouselIndex((prevIndex) => (prevIndex + newDirection + carouselImages.length) % carouselImages.length);
    };



    // Dynamic config texts aligned with the PC settings
    const displayTitle = activeLocale === 'es' ? (config?.heroTitleEs || t("heroTitle")) : (config?.heroTitleEn || t("heroTitle"));
    const displayHighlight = activeLocale === 'es' ? (config?.heroHighlightEs || t("heroHighlight")) : (config?.heroHighlightEn || t("heroHighlight"));
    const displayDesc = activeLocale === 'es' ? (config?.heroDescEs || t("heroDesc")) : (config?.heroDescEn || t("heroDesc"));
    const displayBadge = activeLocale === 'es' ? (config?.heroBadgeEs || "¡NUEVO LOOK MÓVIL!") : (config?.heroBadgeEn || "NEW MOBILE LOOK!");
    const contactTitle = activeLocale === 'es' ? (config?.contactTitleEs || t("contactTitle")) : (config?.contactTitleEn || t("contactTitle"));
    const contactSubtitle = activeLocale === 'es' ? (config?.contactSubtitleEs || t("contactSubtitle")) : (config?.contactSubtitleEn || t("contactSubtitle"));

    // Helpers
    const changeLocale = (nextLocale: string) => {
        startTransition(() => {
            const segments = pathname.split('/');
            segments[1] = nextLocale;
            router.push(segments.join('/'));
        });
    };

    const getServiceIcon = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes("baño") || lower.includes("bath")) return Bath;
        if (lower.includes("corte") || lower.includes("grooming")) return Scissors;
        return Sparkles;
    };

    // Filter services based on search query
    const filteredServices = services.filter(service => {
        const title = activeLocale === "es" ? service.titleEs : service.titleEn;
        const desc = activeLocale === "es" ? service.descEs : service.descEn;
        return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               desc.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen bg-[#FDFCF8] pb-32 relative text-foreground font-sans overflow-x-hidden md:hidden">
            {/* Pop Art Dot pattern background for comic-book texturing */}
            <PopArtDots className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" />

            {/* 📱 FIXED MOBILE TOP BAR */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b-[3.5px] border-black px-5 py-3 flex items-center justify-between shadow-[0_4px_0_0_rgba(0,0,0,1)]">
                <div className="flex items-center space-x-2">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-black bg-accent flex items-center justify-center p-1">
                        <Image src="/favicon.svg" alt="Logo" width={24} height={24} className="object-contain" />
                    </div>
                    <span className="font-black text-lg tracking-tight uppercase">Groomers, INC.</span>
                </div>
                
                {/* Language Badge Selector */}
                <div className="flex bg-white border-2 border-black p-0.5 rounded-lg shadow-[2px_2px_0px_0px_#000] scale-95">
                    <button
                        onClick={() => changeLocale("es")}
                        className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-md transition-all",
                            activeLocale === 'es' 
                                ? "bg-accent text-foreground border border-black shadow-[1px_1px_0px_0px_#000]" 
                                : "text-slate-400"
                        )}
                        disabled={isPending}
                    >
                        ES
                    </button>
                    <button
                        onClick={() => changeLocale("en")}
                        className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-md transition-all",
                            activeLocale === 'en' 
                                ? "bg-accent text-foreground border border-black shadow-[1px_1px_0px_0px_#000]" 
                                : "text-slate-400"
                        )}
                        disabled={isPending}
                    >
                        EN
                    </button>
                </div>
            </header>

            {/* 🔄 TAB CONTENTS WITH SMOOTH ANIMATION */}
            <main className="px-5 pt-[78px]">
                <AnimatePresence mode="wait">
                    {activeTab === "home" && (
                        <m.div
                            key="home-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Mobile Hero section with the Cover Dog Peak */}
                            <div className="relative bg-secondary border-[3.5px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000] overflow-hidden">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/20 rounded-full border-[3px] border-black z-0" />
                                <div className="relative z-10 space-y-4 pr-24">
                                    <div className="inline-flex bg-accent text-foreground text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] -rotate-2">
                                        {displayBadge}
                                    </div>
                                    <h1 className="text-[27px] font-black tracking-tight leading-none text-foreground uppercase">
                                        {displayTitle} <br />
                                        <span className="bg-primary text-white border-2 border-black px-2 inline-block rounded-md shadow-[3px_3px_0_0_#000] -rotate-1 mt-1.5">
                                            {displayHighlight}
                                        </span>
                                    </h1>
                                    <p className="text-xs font-bold text-foreground/80 leading-snug">
                                        {displayDesc}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setActiveTab("home");
                                            setTimeout(() => {
                                                const element = document.getElementById("mobile-booking-section");
                                                if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
                                            }, 100);
                                        }}
                                        className="w-full flex items-center justify-center space-x-2 py-2.5 bg-accent text-foreground font-black text-xs uppercase tracking-wider rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer"
                                    >
                                        <span>{t("bookNow")}</span>
                                        <ArrowRight className="w-4 h-4 stroke-3" />
                                    </button>
                                </div>

                                {/* Floating Pop Art Cover Dog */}
                                <div className="absolute bottom-[-10px] right-[-15px] w-[145px] h-[145px] z-20 pointer-events-none">
                                    <m.div
                                        animate={{ 
                                            y: [0, -6, 0],
                                            rotate: [0, 2, 0]
                                        }}
                                        transition={{ 
                                            duration: 4, 
                                            repeat: Infinity, 
                                            ease: "easeInOut" 
                                        }}
                                        className="relative w-full h-full"
                                    >
                                        <Image
                                            src="/assets/hero_dog_svg.svg"
                                            alt="Cover Dog"
                                            fill
                                            className="object-contain object-bottom drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]"
                                            priority
                                            unoptimized
                                        />
                                    </m.div>
                                </div>
                            </div>

                            {/* Datos de Contacto Quick Info instead of old features */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {config?.address && (
                                        <a 
                                            href={`https://maps.google.com/?q=${encodeURIComponent(config.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0_0_#000] flex flex-col items-center text-center space-y-2 active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] border-2 border-black flex items-center justify-center text-sky-600 shadow-[2px_2px_0_0_#000]">
                                                <MapPin className="w-5 h-5 stroke-[2.5]" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">{t("addressTitle")}</span>
                                            <span className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">{config.address}</span>
                                        </a>
                                    )}
                                    {config?.phone && (
                                        <a 
                                            href={`tel:${config.phone.replace(/\s+/g, '')}`}
                                            className="bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0_0_#000] flex flex-col items-center text-center space-y-2 active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-[#FEF08A] border-2 border-black flex items-center justify-center text-amber-500 shadow-[2px_2px_0_0_#000]">
                                                <Phone className="w-5 h-5 stroke-[2.5]" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">{t("phoneTitle")}</span>
                                            <span className="text-[11px] font-bold text-slate-800 leading-tight">{config.phone}</span>
                                        </a>
                                    )}
                                </div>

                                {/* Horarios banner */}
                                <div className="bg-[#FEF9C3] border-3 border-black p-4 rounded-xl shadow-[4px_4px_0_0_#000] flex items-center space-x-3.5 relative overflow-hidden">
                                    <PopArtSticker text={activeLocale === 'es' ? "ABIERTO" : "OPEN"} color="bg-accent" className="absolute top-1.5 right-1.5 text-[7px] px-1.5 py-0.5 shadow-[1px_1px_0_0_#000] rotate-12 scale-90" />
                                    <div className="w-10 h-10 rounded-lg bg-white border-2 border-black flex items-center justify-center text-slate-700 shrink-0 shadow-[2px_2px_0_0_#000]">
                                        <Clock className="w-5 h-5 stroke-[2.5]" />
                                    </div>
                                    <div>
                                        <p className="font-black uppercase tracking-wider text-[9px] text-slate-500 leading-none mb-1">{t("hoursTitle")}</p>
                                        <p className="text-xs font-black text-slate-800 leading-none">{activeLocale === 'es' ? (config?.hoursEs || t("defaultHours")) : (config?.hoursEn || t("defaultHours"))}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3D Rotating Stack Card Carousel of Happiness (Galería de Felicidad) */}
                            {carouselImages.length > 0 && (
                                <div className="space-y-4 pt-2 overflow-visible">
                                    <div className="text-center space-y-1 relative">
                                        <PopArtStar className="w-10 h-10 absolute -top-4 -left-2 -rotate-12 text-[#FFDE4D]" />
                                        <h2 className="text-2xl font-black uppercase tracking-tight">
                                            {t("galleryTitle")} <span className="text-primary">{t("galleryTitleHighlight")}</span>
                                        </h2>
                                        <p className="text-xs font-bold text-muted-foreground max-w-xs mx-auto">
                                            {t("gallerySubtitle")}
                                        </p>
                                    </div>
                                    
                                    {/* 3D Card Stack Container */}
                                    <div className="relative h-[290px] flex items-center justify-center w-full overflow-visible my-3 select-none">
                                        {carouselImages.map((url, index) => {
                                            const cardStyle = getMobileCardStyle(index);
                                            const isCenter = index === carouselIndex;
                                            
                                            return (
                                                <m.div
                                                    key={url}
                                                    style={{ transformOrigin: "bottom center" }}
                                                    animate={cardStyle}
                                                    transition={{ 
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 24
                                                    }}
                                                    onClick={() => {
                                                        if (isCenter) {
                                                            setActivePhoto(url);
                                                        } else {
                                                            const diff = (index - carouselIndex + carouselImages.length) % carouselImages.length;
                                                            if (diff === 1 || (carouselIndex === carouselImages.length - 1 && index === 0)) {
                                                                paginateCarousel(1);
                                                            } else {
                                                                paginateCarousel(-1);
                                                            }
                                                        }
                                                    }}
                                                    className={cn(
                                                        "absolute w-[60%] aspect-square rounded-2xl border-[3.5px] border-black bg-white overflow-hidden cursor-pointer transition-shadow",
                                                        isCenter ? "shadow-[10px_10px_0px_0px_#1A1A1A]" : "shadow-[6px_6px_0px_0px_#1A1A1A]"
                                                    )}
                                                >
                                                    <Image 
                                                        src={url} 
                                                        alt={t("galleryItemAlt")} 
                                                        fill 
                                                        priority={index === 0}
                                                        sizes="(max-width: 768px) 60vw, 33vw"
                                                        className="object-cover pointer-events-none" 
                                                    />
                                                </m.div>
                                            );
                                        })}
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-center space-x-6 pt-1">
                                        <button
                                            onClick={() => paginateCarousel(-1)}
                                            className="w-10 h-10 rounded-xl bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_#1A1A1A] flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all cursor-pointer"
                                            aria-label="Anterior"
                                            title="Anterior"
                                        >
                                            <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                                        </button>
                                        <span className="text-xs font-black uppercase tracking-wider bg-accent px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#1A1A1A]">
                                            {carouselIndex + 1} / {carouselImages.length}
                                        </span>
                                        <button
                                            onClick={() => paginateCarousel(1)}
                                            className="w-10 h-10 rounded-xl bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_#1A1A1A] flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all cursor-pointer"
                                            aria-label="Siguiente"
                                            title="Siguiente"
                                        >
                                            <ChevronRight className="w-5 h-5" strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Reservar Cita / Booking Form section directly on homepage */}
                            <div id="mobile-booking-section" className="space-y-4 pt-4 scroll-mt-24">
                                <div className="space-y-1 text-center relative">
                                    <PopArtZap className="w-9 h-9 absolute -top-3 -right-2 rotate-12" />
                                    <h2 className="text-2xl font-black uppercase tracking-tight">
                                        {contactTitle}
                                    </h2>
                                    <p className="text-xs font-bold text-muted-foreground max-w-xs mx-auto">
                                        {contactSubtitle}
                                    </p>
                                </div>

                                <div className="bg-white border-[3px] border-black rounded-2xl p-5 shadow-[5px_5px_0_0_#000] relative overflow-hidden">
                                    <ContactForm 
                                        locale={locale} 
                                        services={services.map(s => JSON.parse(JSON.stringify(s)))} 
                                    />
                                </div>
                            </div>


                        </m.div>
                    )}

                    {/* SERVICES TAB */}
                    {activeTab === "services" && (
                        <m.div
                            key="services-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="space-y-2 text-center relative">
                                <PopArtZap className="w-8 h-8 absolute top-[-10px] right-2 rotate-12" />
                                <h2 className="text-2xl font-black uppercase tracking-tight">
                                    {t("servicesTitle")} <span className="text-primary">{t("servicesTitleHighlight")}</span>
                                </h2>
                                <p className="text-xs font-bold text-muted-foreground max-w-xs mx-auto">
                                    {t("servicesSubtitle")}
                                </p>
                            </div>

                            {/* Search Services Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={activeLocale === "es" ? "Buscar corte, baño..." : "Search bath, cut..."}
                                    className="w-full pl-10 pr-4 py-3 bg-white border-[3px] border-black rounded-xl shadow-[3px_3px_0_0_#000] focus:outline-hidden focus:shadow-[5px_5px_0_0_#000] transition-all font-bold text-sm"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 stroke-3" />
                            </div>

                            {/* Services List */}
                            <div className="space-y-4">
                                {filteredServices.map((service) => {
                                    const title = activeLocale === "es" ? service.titleEs : service.titleEn;
                                    const desc = activeLocale === "es" ? service.descEs : service.descEn;
                                    const Icon = getServiceIcon(title);

                                    return (
                                        <div
                                            key={service.id}
                                            onClick={() => {
                                                setSelectedService(service);
                                                setShowBookingInSheet(false);
                                            }}
                                            className="bg-white border-[3px] border-black rounded-xl p-4 shadow-[4px_4px_0_0_#000] flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3.5">
                                                <div className="w-11 h-11 bg-secondary rounded-lg border-2 border-black flex items-center justify-center text-primary shrink-0 shadow-[2px_2px_0_0_#000]">
                                                    <Icon className="w-5 h-5 stroke-[2.5]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-sm uppercase tracking-tight leading-none mb-1">{title}</h3>
                                                    <p className="text-[11px] font-bold text-muted-foreground line-clamp-1 max-w-[180px]">{desc}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right shrink-0">
                                                {service.price ? (
                                                    <span className="bg-[#DCFCE7] text-[#15803D] font-black text-xs px-2.5 py-1.5 rounded-full border-2 border-black shadow-[1.5px_1.5px_0_0_#000]">
                                                        ${service.price}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black tracking-wider text-muted-foreground uppercase">{t("priceBase")}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredServices.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 font-bold text-sm">
                                        {activeLocale === "es" ? "No se encontraron servicios." : "No services found."}
                                    </div>
                                )}
                            </div>
                        </m.div>
                    )}

                    {/* TRANSFORMATIONS TAB */}
                    {activeTab === "transformations" && (
                        <m.div
                            key="transformations-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6 pb-20"
                        >
                            <div className="space-y-2 text-center relative">
                                <PopArtStar className="w-8 h-8 absolute top-[-10px] right-2 rotate-12 text-[#FFDE4D]" />
                                <h2 className="text-2xl font-black uppercase tracking-tight">
                                    {activeLocale === "es" ? "Transformaciones" : "Transformations"}
                                </h2>
                                <p className="text-xs font-bold text-muted-foreground max-w-xs mx-auto">
                                    {activeLocale === "es" 
                                        ? "Increíbles cambios de look de nuestros clientes más peludos" 
                                        : "Incredible makeovers of our most furry clients"}
                                </p>
                            </div>

                            <TransformationsSection items={transformations as any} locale={locale} />
                        </m.div>
                    )}

                    {/* Booking tab removed, integrated directly into main */}
                </AnimatePresence>

                {/* 📱 MODERN MINIMALIST MOBILE FOOTER */}
                <footer className="mt-12 mb-8 pt-6 border-t-[2.5px] border-black/10 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="flex items-center justify-center space-x-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                        <span>Groomers, INC.</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Miami</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span>© {new Date().getFullYear()}</span>
                    </div>
                    
                    {/* Minimalist Admin Button */}
                    <Link 
                        href="/login-admin" 
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider transition-all active:translate-y-px active:translate-x-px active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                        <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Acceso Admin</span>
                    </Link>
                </footer>
            </main>

            {/* 📥 BOTTOM SHEET (SLIDING POPUP FOR SERVICE DETAILS) */}
            <AnimatePresence>
                {selectedService && (
                    <>
                        {/* Backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedService(null)}
                            className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs md:hidden"
                        />
                        
                        {/* Bottom sheet */}
                        <m.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className={cn(
                                "fixed bottom-0 left-0 right-0 z-100 bg-white border-t-4 border-black rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-8px_24px_rgba(0,0,0,0.15)] flex flex-col md:hidden transition-all duration-300",
                                showBookingInSheet ? "h-[85vh]" : "max-h-[85vh] space-y-5"
                            )}
                        >
                            {/* Drag handle */}
                            <div className="w-12 h-1.5 bg-black/20 rounded-full mx-auto mb-2" onClick={() => setSelectedService(null)} />
                            
                            <AnimatePresence mode="wait">
                                {!showBookingInSheet ? (
                                    <m.div
                                        key="service-details"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                                                    {activeLocale === "es" ? selectedService.titleEs : selectedService.titleEn}
                                                </h3>
                                                <p className="text-xs font-black text-primary">
                                                    {activeLocale === "es" ? "TRATAMIENTO PREMIUM SPA" : "PREMIUM SPA TREATMENT"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedService(null)}
                                                className="p-1.5 rounded-full bg-slate-100 border border-black/10 hover:bg-slate-200 cursor-pointer"
                                                aria-label="Cerrar detalles"
                                                title="Cerrar detalles"
                                            >
                                                <X className="w-5 h-5 text-slate-700" />
                                            </button>
                                        </div>

                                        <div className="bg-secondary/40 border-2 border-black/5 p-4 rounded-xl font-bold text-xs leading-relaxed text-slate-600">
                                            {activeLocale === "es" ? selectedService.descEs : selectedService.descEn}
                                        </div>

                                        {/* Service highlight specs */}
                                        <div className="space-y-2 pt-2">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                                {activeLocale === "es" ? "INCLUYE EN SESIÓN:" : "INCLUDED IN SESSION:"}
                                            </h4>
                                            <ul className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-slate-700">
                                                <li className="flex items-center space-x-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span>Shampoo Orgánico</span>
                                                </li>
                                                <li className="flex items-center space-x-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span>Secado a Mano</span>
                                                </li>
                                                <li className="flex items-center space-x-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span>Corte de Uñas</span>
                                                </li>
                                                <li className="flex items-center space-x-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span>Limpieza de Oídos</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{t("priceBase")}</span>
                                                <span className="font-black text-xl text-primary">${selectedService.price || "—"}</span>
                                            </div>
                                            
                                            <button
                                                onClick={() => setShowBookingInSheet(true)}
                                                className="flex-1 py-3.5 bg-accent text-foreground font-black text-xs uppercase tracking-wider rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0_0_#000] flex items-center justify-center space-x-2 cursor-pointer transition-all"
                                            >
                                                <span>{t("bookNow")}</span>
                                                <ArrowRight className="w-4 h-4 stroke-3" />
                                            </button>
                                        </div>
                                    </m.div>
                                ) : (
                                    <m.div
                                        key="booking-form"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 flex flex-col min-h-0 space-y-4"
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-black/10">
                                            <button 
                                                onClick={() => setShowBookingInSheet(false)}
                                                className="flex items-center space-x-1 text-xs font-black uppercase text-slate-500 hover:text-slate-900 cursor-pointer"
                                            >
                                                <ChevronLeft className="w-4 h-4" strokeWidth={3} />
                                                <span>{activeLocale === "es" ? "Atrás" : "Back"}</span>
                                            </button>
                                            <button
                                                onClick={() => setSelectedService(null)}
                                                className="p-1 rounded-full bg-slate-100 border border-black/10 hover:bg-slate-200 cursor-pointer"
                                                aria-label="Cerrar detalles"
                                                title="Cerrar detalles"
                                            >
                                                <X className="w-4 h-4 text-slate-700" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-1 pb-6 scrollbar-none space-y-3">
                                            <div className="text-center space-y-1 py-1">
                                                <h3 className="text-lg font-black uppercase tracking-tight">
                                                    {activeLocale === "es" ? "SOLICITAR CITA" : "BOOK APPOINTMENT"}
                                                </h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {activeLocale === "es" ? "Servicio:" : "Service:"} <span className="text-primary font-black">{activeLocale === "es" ? selectedService.titleEs : selectedService.titleEn}</span>
                                                </p>
                                            </div>

                                            <ContactForm 
                                                locale={locale}
                                                initialService={activeLocale === "es" ? selectedService.titleEs : selectedService.titleEn} 
                                                services={services.map(s => JSON.parse(JSON.stringify(s)))}
                                                onSuccess={() => {
                                                    setTimeout(() => {
                                                        setSelectedService(null);
                                                        setShowBookingInSheet(false);
                                                    }, 1500);
                                                }}
                                            />
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </m.div>
                    </>
                )}
            </AnimatePresence>

            {/* Fullscreen Photo Modal */}
            <AnimatePresence>
                {activePhoto && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-200 bg-black/95 flex flex-col items-center justify-center p-6 md:hidden"
                    >
                        <button
                            onClick={() => setActivePhoto(null)}
                            className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center"
                            aria-label="Cerrar foto"
                            title="Cerrar foto"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        
                        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-[3px] border-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                            <Image
                                src={activePhoto}
                                alt={t("galleryItemAlt")}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                            />
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* 📱 MOBILE NAVIGATION BAR */}
            <MobileBottomNav 
                activeTab={activeTab} 
                onChangeTab={handleTabChange} 
                t={tNav} 
                transformationsEnabled={config?.transformationsEnabled}
            />
        </div>
        </LazyMotion>
    );
}
