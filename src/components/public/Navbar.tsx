"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, Instagram, Twitter, PawPrint, Bone } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
    config?: {
        transformationsEnabled?: boolean;
        tiktokUrl?: string | null;
        instagramUrl?: string | null;
        twitterUrl?: string | null;
        tiktokActive?: boolean;
        instagramActive?: boolean;
        twitterActive?: boolean;
    } | null;
}

export default function Navbar({ config }: NavbarProps) {
    const t = useTranslations("Navigation");
    const activeLocale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    const isAdminPage = pathname.includes('/admin') || pathname.includes('/login-admin');

    const [activeSection, setActiveSection] = useState("home");
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!mounted || isAdminPage) return;

        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 50);

                    const sections = ["cotizar", "gallery", "contacto"];
                    let current = "";

                    const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

                    if (isAtBottom) {
                        current = "contacto";
                    } else if (window.scrollY < 100) {
                        current = "home";
                    } else {
                        for (const section of sections) {
                            const element = document.getElementById(section);
                            if (element) {
                                const rect = element.getBoundingClientRect();
                                if (rect.top <= 180 && rect.bottom >= 180) {
                                    current = section;
                                    break;
                                }
                            }
                        }
                    }
                    setActiveSection(current);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [mounted, isAdminPage]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!mounted || isAdminPage) return null;

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { href: "/", id: "home", label: t("home") },
        { href: "/#cotizar", id: "services", label: t("services") },
        ...(config?.transformationsEnabled ? [{ href: "/transformaciones", id: "transformations", label: t("transformations") }] : []),
        { href: "/#gallery", id: "gallery", label: t("gallery") },
        { href: "/#contacto", id: "contact", label: t("contact") },
    ];

    const changeLocale = (newLocale: "es" | "en") => {
        router.replace(pathname, { locale: newLocale });
    };

    const isActive = (linkId: string) => {
        if (linkId === "transformations") {
            return pathname.includes("/transformaciones");
        }
        if (pathname !== "/" && pathname !== "/es" && pathname !== "/en") {
            return false;
        }
        if (linkId === "services") {
            return activeSection === "cotizar";
        }
        if (linkId === "contact") {
            return activeSection === "contacto";
        }
        return activeSection === linkId || (linkId === 'home' && activeSection === '');
    };

    return (
        <>
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="fixed z-50 top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl"
            >
                <div className="flex items-center justify-between mx-auto bg-white/90 border-[3px] border-black px-6 py-1 rounded-2xl shadow-[6px_6px_0px_0px_#1A1A1A] backdrop-blur-md max-w-6xl w-full">
                    <Link href="/" className="flex items-center group relative h-14 w-40 sm:h-16 sm:w-56 md:w-60 lg:w-72 hover:scale-105 transition-transform duration-300 -ml-4">
                        <Image
                            src="/Logo_groomersinc.svg"
                            alt="GroomingPet Logo"
                            fill
                            className="object-contain object-left"
                            priority
                            unoptimized
                        />
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center space-x-1 p-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-2 xl:px-4 py-1.5 rounded-xl text-sm xl:text-base font-bold transition-all duration-300",
                                    isActive(link.id) 
                                        ? "bg-secondary border-2 border-black shadow-[3px_3px_0px_0px_#0F172A] text-foreground" 
                                        : "text-foreground/70 hover:text-primary"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center space-x-3">
                        {(config?.instagramActive !== false) && config?.instagramUrl && (
                            <a 
                                href={config.instagramUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                title="Instagram"
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white border-2 border-black shadow-[3px_3px_0px_0px_#0F172A] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[1px_1px_0px_0px_#0F172A] transition-all"
                            >
                                <Instagram className="w-4 h-4" />
                            </a>
                        )}
                        {(config?.tiktokActive !== false) && config?.tiktokUrl && (
                            <a 
                                href={config.tiktokUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="TikTok"
                                title="TikTok"
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_#0F172A] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[1px_1px_0px_0px_#0F172A] transition-all"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.21-2.51 1.18-5.03 3.4-6.08 1.37-.62 2.94-.74 4.38-.4.01 1.42.02 2.84 0 4.26-.65-.13-1.33-.11-1.96.12-.9.34-1.6 1.07-1.84 1.99-.27 1.13.11 2.36.99 3.11.7.59 1.63.81 2.53.64 1.25-.26 2.19-1.28 2.39-2.54.12-.86.1-1.74.09-2.61.02-6.52.01-13.04.02-19.56z" />
                                </svg>
                            </a>
                        )}
                        {(config?.twitterActive !== false) && config?.twitterUrl && (
                            <a 
                                href={config.twitterUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label="X (Twitter)"
                                title="X (Twitter)"
                                className="flex items-center justify-center w-9 h-9 rounded-xl bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_#0F172A] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[1px_1px_0px_0px_#0F172A] transition-all"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293l13.314 17.411z" />
                                </svg>
                            </a>
                        )}
                        <div className="flex bg-white border-2 border-black p-1 rounded-xl shadow-[3px_3px_0px_0px_#0F172A]">
                            <button
                                onClick={() => changeLocale("es")}
                                className={cn("text-xs font-black px-3 py-1.5 rounded-lg transition-all", activeLocale === 'es' ? "bg-accent text-foreground border-2 border-transparent" : "text-foreground/60 hover:text-foreground")}
                            >
                                ES
                            </button>
                            <button
                                onClick={() => changeLocale("en")}
                                className={cn("text-xs font-black px-3 py-1.5 rounded-lg transition-all", activeLocale === 'en' ? "bg-accent text-foreground border-2 border-transparent" : "text-foreground/60 hover:text-foreground")}
                            >
                                EN
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden h-9 w-9 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center"
                        onClick={toggleMenu}
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                    >
                        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu — Full-Screen Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="fixed inset-0 z-1000 bg-background/80 lg:hidden flex flex-col items-center justify-center p-6"
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-6 right-6 h-12 w-12 rounded-full bg-secondary flex items-center justify-center"
                            title="Close menu"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <nav className="flex flex-col items-center space-y-8 w-full max-w-sm">
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "text-3xl font-semibold tracking-tight transition-colors",
                                            isActive(link.id) ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                        </nav>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-12 flex bg-secondary p-1 rounded-full"
                        >
                            <button
                                onClick={() => { changeLocale("es"); setIsOpen(false); }}
                                className={cn("px-6 py-2 rounded-full font-semibold text-sm transition-all", activeLocale === 'es' ? "bg-white text-black shadow-sm" : "text-muted-foreground")}
                            >
                                Español
                            </button>
                            <button
                                onClick={() => { changeLocale("en"); setIsOpen(false); }}
                                className={cn("px-6 py-2 rounded-full font-semibold text-sm transition-all", activeLocale === 'en' ? "bg-white text-black shadow-sm" : "text-muted-foreground")}
                            >
                                English
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
