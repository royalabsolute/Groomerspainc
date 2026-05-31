"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Lock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/navigation";
import { PopArtDots, PopArtSticker, PopArtZap, PopArtBurst } from "@/components/public/PopArtDecorations";
import { ZigzagYellowDoodle, CyanPlusDoodle, OrangeBlobDoodle } from "@/components/public/Doodles";

export default function LoginPage() {
    const t = useTranslations("Auth");
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const changeLocale = (nextLocale: "es" | "en") => {
        router.replace(pathname, { locale: nextLocale });
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error(t("incorrect_credentials"));
            } else {
                toast.success(t("welcome_toast"));
                window.location.href = `/${locale}/admin/dashboard`;
            }
        } catch (error) {
            toast.error(t("login_error"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-4">
            {/* Background Decorations */}
            <PopArtDots className="absolute inset-0 z-0 opacity-20" />
            
            <motion.div 
                className="absolute top-10 left-[5%] w-32 h-32 z-0 opacity-40 rotate-12"
                animate={{ y: [0, -20, 0], rotate: [12, 15, 12] }}
                transition={{ duration: 5, repeat: Infinity }}
            >
                <OrangeBlobDoodle className="w-full h-full" />
            </motion.div>
            
            <motion.div 
                className="absolute bottom-10 right-[5%] z-0 opacity-40 -rotate-12"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
            >
                <ZigzagYellowDoodle className="w-48 h-24" />
            </motion.div>

            <CyanPlusDoodle className="absolute top-[20%] right-[10%] opacity-30" />
            <PopArtZap className="absolute bottom-[20%] left-[10%] w-20 h-20 opacity-30 -rotate-12" />

            {/* Language Selector in top right */}
            <div className="absolute top-4 right-4 z-20 flex bg-white border-2 border-black p-0.5 rounded-xl shadow-[3px_3px_0px_0px_#000] scale-95">
                <button
                    type="button"
                    onClick={() => changeLocale("es")}
                    className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                        locale === 'es' 
                            ? "bg-accent text-foreground border-2 border-transparent" 
                            : "text-foreground/60 hover:text-foreground"
                    )}
                >
                    ES
                </button>
                <button
                    type="button"
                    onClick={() => changeLocale("en")}
                    className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                        locale === 'en' 
                            ? "bg-accent text-foreground border-2 border-transparent" 
                            : "text-foreground/60 hover:text-foreground"
                    )}
                >
                    EN
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Stickers around the card - sanitised of emojis */}
                <div className="absolute -top-12 -right-8 z-20 hidden md:block">
                    <PopArtSticker text="ADMIN ONLY" color="bg-accent" className="text-sm rotate-12 scale-110" />
                </div>
                <div className="absolute -bottom-6 -left-12 z-20 hidden md:block">
                    <PopArtSticker text="LOCKED" color="bg-info" className="text-xs -rotate-12" />
                </div>

                {/* Minimalist Design (Logo removed) */}
                <div className="mt-8">
                    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_#000] md:shadow-[16px_16px_0px_0px_#000] bg-white overflow-hidden rounded-4xl md:rounded-[2.5rem]">
                        <CardHeader className="space-y-2 bg-secondary/10 border-b-4 border-black p-5 md:p-8">
                            <CardTitle className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
                                {t("welcome")}
                            </CardTitle>
                            <CardDescription className="text-foreground/80 font-bold text-base md:text-lg leading-tight">
                                {t("credentials_desc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 md:p-8 space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="font-black uppercase text-[10px] md:text-xs tracking-widest ml-1">{t("email")}</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                            <Mail className="h-5 w-5 text-foreground" />
                                        </div>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            className="pl-12 h-12 md:h-14 border-[3px] border-black bg-white rounded-2xl text-base md:text-lg font-bold shadow-[4px_4px_0px_0px_#000] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[2px_2px_0px_0px_#000] transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <Label htmlFor="password" className="font-black uppercase text-[10px] md:text-xs tracking-widest">{t("password")}</Label>
                                        <Link
                                            href="/login-admin/forgot-password"
                                            className="text-[9px] md:text-[10px] text-primary font-black uppercase tracking-widest hover:underline decoration-2"
                                        >
                                            {t("forgot_password")}
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                            <Lock className="h-5 w-5 text-foreground" />
                                        </div>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            className="pl-12 h-12 md:h-14 border-[3px] border-black bg-white rounded-2xl text-base md:text-lg font-bold shadow-[4px_4px_0px_0px_#000] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[2px_2px_0px_0px_#000] transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full h-14 md:h-16 bg-primary hover:bg-primary border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] md:hover:shadow-[6px_6px_0px_0px_#000] transition-all text-white font-black text-xl md:text-2xl uppercase tracking-tighter" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 md:h-6 md:w-6 animate-spin" />
                                            {t("loading")}
                                        </>
                                    ) : (
                                        t("login_btn")
                                    )}
                                </Button>

                                <div className="text-center pt-2">
                                    <Link 
                                        href="/" 
                                        className="inline-flex items-center text-xs md:text-sm font-black uppercase tracking-wider text-slate-600 hover:text-black transition-colors"
                                    >
                                        &larr; {t("back_to_site")}
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="relative mt-12 flex flex-col items-center">
                    <PopArtBurst className="absolute -top-6 -left-4 w-12 h-12 opacity-30" />
                    <p className="text-center text-xs text-foreground uppercase tracking-[0.3em] font-black bg-white border-2 border-black px-4 py-1 rounded-full shadow-[3px_3px_0px_0px_#000]">
                        {t("restricted_access")}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
