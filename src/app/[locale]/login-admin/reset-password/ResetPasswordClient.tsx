"use client";
 
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "@/navigation";
import Image from "next/image";
import { resetPassword } from "@/lib/actions/auth";
import { PopArtDots, PopArtSticker, PopArtZap, PopArtBurst } from "@/components/public/PopArtDecorations";
import { ZigzagYellowDoodle, CyanPlusDoodle, OrangeBlobDoodle } from "@/components/public/Doodles";
 
export default function ResetPasswordClient({ token }: { token: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
 
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        
        if (!token) {
            toast.error("Enlace inválido o expirado.");
            return;
        }
 
        setIsLoading(true);
 
        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;
 
        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            setIsLoading(false);
            return;
        }
 
        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres.");
            setIsLoading(false);
            return;
        }
 
        try {
            const result = await resetPassword(token, password);
            if (result.success) {
                setIsSubmitted(true);
                toast.success("Contraseña actualizada con éxito");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al procesar la solicitud");
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
 
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Stickers */}
                <div className="absolute -top-12 -right-8 z-20 hidden md:block">
                    <PopArtSticker text="NEW PASS 🔑" color="bg-accent" className="text-sm rotate-12 scale-110" />
                </div>
                <div className="absolute -bottom-6 -left-12 z-20 hidden md:block">
                    <PopArtSticker text="SAFE 🛡️" color="bg-info" className="text-xs -rotate-12" />
                </div>
 
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="relative h-40 w-full max-w-[500px] mb-4"
                    >
                        <Image 
                            src="/favicon.svg" 
                            alt="GroomingPet Logo" 
                            fill 
                            className="object-contain"
                            priority
                        />
                    </motion.div>
                    <div className="px-6 py-2">
                        <p className="text-foreground font-black uppercase tracking-[0.4em] text-sm">
                            Restablecer Clave
                        </p>
                    </div>
                </div>
 
                <Card className="border-4 border-black shadow-[16px_16px_0px_0px_#000] bg-white overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="space-y-2 bg-secondary/10 border-b-4 border-black p-8">
                        <CardTitle className="text-4xl font-black uppercase tracking-tight text-foreground">Nueva Contraseña</CardTitle>
                        <CardDescription className="text-foreground/80 font-bold text-lg leading-tight">
                            Crea una nueva contraseña maestra para acceder al panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {!token ? (
                            <div className="text-center py-6 space-y-6">
                                <div className="bg-red-400 p-5 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                                    <p className="text-black font-black text-xl uppercase tracking-tight">
                                        ❌ ENLACE INVÁLIDO
                                    </p>
                                </div>
                                <p className="text-black font-bold text-lg leading-tight">
                                    El enlace de recuperación no es válido o ha expirado.
                                </p>
                                <Link href="/login-admin/forgot-password">
                                    <Button className="w-full h-16 bg-black hover:bg-black/90 border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-white font-black text-xl uppercase tracking-tighter">
                                        Solicitar nuevo enlace
                                    </Button>
                                </Link>
                            </div>
                        ) : isSubmitted ? (
                            <div className="text-center py-6 space-y-6">
                                <div className="flex justify-center">
                                    <div className="bg-emerald-400 p-5 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                                        <CheckCircle2 className="h-14 w-14 text-black" />
                                    </div>
                                </div>
                                <p className="text-black font-black text-xl uppercase tracking-tight">
                                    ¡Tu contraseña ha sido actualizada exitosamente!
                                </p>
                                <Link href="/login-admin">
                                    <Button className="w-full h-16 bg-primary hover:bg-primary border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all text-white font-black text-xl uppercase tracking-tighter">
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="password" className="font-black uppercase text-xs tracking-widest ml-1 text-foreground/70">Nueva Contraseña</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                            <KeyRound className="h-5 w-5 text-foreground" />
                                        </div>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-12 h-14 border-[3px] border-black bg-white rounded-2xl text-lg font-bold shadow-[4px_4px_0px_0px_#000] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[2px_2px_0px_0px_#000] transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="confirmPassword" className="font-black uppercase text-xs tracking-widest ml-1 text-foreground/70">Confirmar Contraseña</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                            <Lock className="h-5 w-5 text-foreground" />
                                        </div>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-12 h-14 border-[3px] border-black bg-white rounded-2xl text-lg font-bold shadow-[4px_4px_0px_0px_#000] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[2px_2px_0px_0px_#000] transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full h-16 bg-primary hover:bg-primary border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all text-white font-black text-2xl uppercase tracking-tighter" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                            ACTUALIZANDO...
                                        </>
                                    ) : (
                                        "Actualizar Clave"
                                    )}
                                </Button>
                                <div className="flex justify-center pt-2">
                                    <Link href="/login-admin" className="flex items-center gap-2 text-foreground font-black uppercase text-xs tracking-widest hover:text-primary transition-colors">
                                        <ArrowLeft className="h-4 w-4" /> Regresar al cuartel general
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
 
                <div className="relative mt-12 flex flex-col items-center">
                    <PopArtBurst className="absolute -top-6 -left-4 w-12 h-12 opacity-30" />
                    <p className="text-center text-xs text-foreground uppercase tracking-[0.3em] font-black bg-white border-2 border-black px-4 py-1 rounded-full shadow-[3px_3px_0px_0px_#000]">
                        Protección Maestra &bull; GroomingPet System
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
