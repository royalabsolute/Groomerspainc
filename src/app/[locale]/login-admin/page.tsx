"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Lock, Mail, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/navigation";

export default function LoginPage() {
    const t = useTranslations("Auth");
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const changeLocale = (nextLocale: "es" | "en") => {
        router.replace(pathname, { locale: nextLocale });
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

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
                setErrorMsg(t("incorrect_credentials"));
                toast.error(t("incorrect_credentials"));
            } else {
                toast.success(t("welcome_toast"));
                window.location.href = `/${locale}/admin`;
            }
        } catch (error) {
            setErrorMsg(t("login_error"));
            toast.error(t("login_error"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4 font-sans select-none">
            {/* Ambient Radial background glow */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_100%)] pointer-events-none" />
            
            {/* Tech grid overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Language Selector */}
            <div className="absolute top-6 right-6 z-20 flex bg-slate-900/80 backdrop-blur-md border border-slate-800 p-0.5 rounded-lg">
                <button
                    type="button"
                    onClick={() => changeLocale("es")}
                    className={cn(
                        "text-xs font-semibold px-3 py-1 rounded cursor-pointer transition-colors duration-250",
                        locale === 'es' 
                            ? "bg-indigo-600 text-white" 
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    ES
                </button>
                <button
                    type="button"
                    onClick={() => changeLocale("en")}
                    className={cn(
                        "text-xs font-semibold px-3 py-1 rounded cursor-pointer transition-colors duration-250",
                        locale === 'en' 
                            ? "bg-indigo-600 text-white" 
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    EN
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Central Glassmorphism Card */}
                <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl">
                    <CardHeader className="space-y-2 border-b border-slate-800/60 p-6 md:p-8 text-center bg-slate-950/20">
                        <div className="mx-auto w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-2">
                            <Lock className="w-5 h-5 text-indigo-400" />
                        </div>
                        <CardTitle className="text-xl md:text-2xl font-extrabold uppercase tracking-widest text-slate-100">
                            ABSOLUTE NEXUS
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs md:text-sm font-medium">
                            {locale === 'es' ? 'Acceso Restringido al Sistema Central' : 'Restricted Central System Access'}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6 md:p-8 space-y-6">
                        {/* Error alert wrapper */}
                        {errorMsg && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs md:text-sm font-medium flex items-start gap-2.5"
                            >
                                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold">{locale === 'es' ? 'Error de Seguridad' : 'Security Warning'}</p>
                                    <p className="opacity-90">{errorMsg}</p>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-semibold text-xs text-slate-400 uppercase tracking-wider ml-0.5">
                                    {t("email")}
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                                        <Mail className="h-4.5 w-4.5 text-slate-500" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@absolute.com"
                                        className="pl-11 h-11 border border-slate-800 bg-black/20 rounded-xl text-sm font-medium text-slate-100 placeholder-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 focus-visible:bg-black/35 transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-0.5">
                                    <Label htmlFor="password" className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                                        {t("password")}
                                    </Label>
                                    <Link
                                        href="/login-admin/forgot-password"
                                        className="text-xs text-indigo-400 font-semibold tracking-wide hover:text-indigo-300 transition-colors"
                                    >
                                        {t("forgot_password")}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                                        <Lock className="h-4.5 w-4.5 text-slate-500" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-11 h-11 border border-slate-800 bg-black/20 rounded-xl text-sm font-medium text-slate-100 placeholder-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 focus-visible:bg-black/35 transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700/50 rounded-xl shadow-lg hover:shadow-indigo-600/10 cursor-pointer transition-all duration-200 text-sm font-bold uppercase tracking-wider mt-2" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        <span>{t("loading")}</span>
                                    </div>
                                ) : (
                                    t("login_btn")
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Subtitle footer */}
                <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest mt-6">
                    {locale === 'es' 
                        ? 'SISTEMA PROTEGIDO POR ENCRIPTACIÓN SSL' 
                        : 'SYSTEM PROTECTED BY SSL ENCRYPTION'}
                </p>
            </motion.div>
        </div>
    );
}
