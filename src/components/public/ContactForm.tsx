"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { submitInquiry } from "@/lib/actions/inquiries";
import { useEffect, useState, useRef } from "react";
import { Camera, X, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    phone: z.string().optional(),
    service: z.string().optional(),
    message: z.string().min(10, { message: "Message must be at least 10 characters." }),
    discountCode: z.string().optional(),
});

interface ContactFormProps {
    locale: string;
    services?: any[];
    initialService?: string;
    onSuccess?: () => void;
}

import { validateDiscountCode } from "@/lib/actions/discounts";

export default function ContactForm({ locale, services, initialService, onSuccess }: ContactFormProps) {
    const t = useTranslations("Index");
    const [petImage, setPetImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
    const [showExhaustedDialog, setShowExhaustedDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!petImage) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(petImage);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [petImage]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            service: initialService || "",
            message: "",
            discountCode: "",
        },
    });

    const checkCode = async () => {
        const code = form.getValues("discountCode");
        if (!code) return;
        
        setIsCheckingCode(true);
        try {
            const result = await validateDiscountCode(code);
            if (result.valid) {
                setAppliedDiscount(result.discount || "Activo");
                toast.success(locale === 'es' ? `¡Cupón aplicado: ${result.discount}!` : `Coupon applied: ${result.discount}!`);
            } else {
                setAppliedDiscount(null);
                if (result.message === "Código agotado") {
                    setShowExhaustedDialog(true);
                } else {
                    toast.error(result.message);
                }
            }
        } catch (error) {
            toast.error("Error al validar");
        } finally {
            setIsCheckingCode(false);
        }
    };

    const handleContinueWithoutDiscount = () => {
        form.setValue("discountCode", "");
        setAppliedDiscount(null);
        setShowExhaustedDialog(false);
    };

    const handleCorrectCode = () => {
        setShowExhaustedDialog(false);
        // Focus on input if possible, or just let user edit
    };

    useEffect(() => {
        if (initialService) {
            form.setValue("service", initialService);
        }
    }, [initialService, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("email", values.email);
            if (values.phone) formData.append("phone", values.phone);
            if (values.service) formData.append("service", values.service);
            formData.append("message", values.message);
            if (values.discountCode) formData.append("discountCode", values.discountCode);
            if (petImage) formData.append("petImage", petImage);

            const result = await submitInquiry(formData);
            if (result.success) {
                toast.success(t('contactSuccess', { defaultMessage: "¡Mensaje recibido! Te contactaremos pronto." }));
                form.reset();
                setPetImage(null);
                setAppliedDiscount(null);
                if (onSuccess) onSuccess();
            } else {
                toast.error(t('contactError', { defaultMessage: "Error al enviar. Inténtalo de nuevo." }));
            }
        } catch (error) {
            toast.error(locale === 'es' ? "Ocurrió un error inesperado." : "An unexpected error occurred.");
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <div className="grid gap-1">
                <Label htmlFor="name" className="font-bold text-sm">{t('formName', { defaultMessage: "Nombre" })}</Label>
                <Input id="name" placeholder="John Doe" {...form.register("name")} className="border-2 sm:border-[3px] border-black rounded-xl focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_#0F172A] sm:focus-visible:shadow-[4px_4px_0px_0px_#0F172A] transition-shadow text-base h-9 sm:h-11" />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="email" className="font-bold">{t('formEmail', { defaultMessage: "Email" })}</Label>
                    <Input id="email" type="email" placeholder="john@example.com" {...form.register("email")} className="border-2 sm:border-[3px] border-black rounded-xl focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_#0F172A] sm:focus-visible:shadow-[4px_4px_0px_0px_#0F172A] transition-shadow text-base h-9 sm:h-11" />
                    {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="phone" className="font-bold">{t('formPhone', { defaultMessage: "Teléfono" })}</Label>
                    <Input id="phone" type="tel" placeholder="(305) 555-0123" {...form.register("phone")} className="border-2 sm:border-[3px] border-black rounded-xl focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_#0F172A] sm:focus-visible:shadow-[4px_4px_0px_0px_#0F172A] transition-shadow text-base h-9 sm:h-11" />
                    {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-1">
                    <Label htmlFor="service" className="font-bold text-sm">{t('formService', { defaultMessage: "Servicio de Interés" })}</Label>
                    <select
                        id="service"
                        className="flex h-9 sm:h-11 w-full rounded-xl border-2 sm:border-[3px] border-black bg-background px-3 py-1 sm:py-2 text-base focus-visible:outline-none focus-visible:shadow-[2px_2px_0px_0px_#0F172A] sm:focus-visible:shadow-[4px_4px_0px_0px_#0F172A] transition-shadow disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-medium"
                        {...form.register("service")}
                    >
                        <option value="">{t('selectService', { defaultMessage: "Selecciona un servicio" })}</option>
                        {services?.map((s) => (
                            <option key={s.id} value={locale === 'es' ? s.titleEs : s.titleEn}>
                                {locale === 'es' ? s.titleEs : s.titleEn} {s.price ? `($${Number(s.price).toFixed(2)})` : ''}
                            </option>
                        ))}
                        <option value="Otro / General">{t('otherGeneral', { defaultMessage: "Otro / General" })}</option>
                    </select>
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="discountCode" className="font-bold text-sm">
                        {locale === 'es' ? "Código de Descuento" : "Discount Code"}
                        {appliedDiscount && <span className="ml-2 text-emerald-600">✓ {appliedDiscount}</span>}
                    </Label>
                        <div className="flex gap-2">
                            <Input 
                                id="discountCode" 
                                placeholder="CUPON123" 
                                {...form.register("discountCode")} 
                                className="border-2 sm:border-[3px] border-black rounded-xl focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_#0F172A] sm:focus-visible:shadow-[4px_4px_0px_0px_#0F172A] transition-shadow text-base uppercase font-black h-9 sm:h-11" 
                            />
                            <Button 
                                type="button" 
                                onClick={checkCode}
                                disabled={isCheckingCode}
                                className="h-9 sm:h-11 bg-accent border-2 sm:border-[3px] border-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] text-foreground font-black px-4"
                            >
                                {isCheckingCode ? "..." : "OK"}
                            </Button>
                        </div>
                </div>
            </div>

            {(() => {
                const selectedServiceTitle = form.watch("service");
                const selectedService = services?.find(s => 
                    (locale === 'es' ? s.titleEs : s.titleEn) === selectedServiceTitle ||
                    `${locale === 'es' ? s.titleEs : s.titleEn} ($${Number(s.price).toFixed(2)})` === selectedServiceTitle
                );

                if (!selectedService || !selectedService.price) return null;
                const originalPrice = Number(selectedService.price);
                
                let discountedPrice = originalPrice;
                if (appliedDiscount) {
                    if (appliedDiscount.includes('%')) {
                        const percent = parseFloat(appliedDiscount.replace('%', ''));
                        discountedPrice = Math.max(0, originalPrice * (1 - percent / 100));
                    } else if (appliedDiscount.includes('$')) {
                        const fixed = parseFloat(appliedDiscount.replace('$', ''));
                        discountedPrice = Math.max(0, originalPrice - fixed);
                    } else {
                        const fixed = parseFloat(appliedDiscount) || 0;
                        discountedPrice = Math.max(0, originalPrice - fixed);
                    }
                }

                return (
                    <div className="p-4 bg-muted/30 rounded-xl border-2 border-dashed border-border/50 flex justify-between items-center">
                        <span className="font-bold text-sm">{locale === 'es' ? 'Precio Estimado:' : 'Estimated Price:'}</span>
                        <div className="text-right">
                            {appliedDiscount ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm line-through text-muted-foreground">${originalPrice.toFixed(2)}</span>
                                    <span className="text-xl font-black text-emerald-600">${discountedPrice.toFixed(2)}</span>
                                </div>
                            ) : (
                                <span className="text-xl font-black">${originalPrice.toFixed(2)}</span>
                            )}
                        </div>
                    </div>
                );
            })()}
            <div className="grid gap-1">
                <Label htmlFor="message" className="font-bold text-sm">{t('formMessage', { defaultMessage: "Mensaje" })}</Label>
                <Textarea id="message" placeholder={t('formMessagePlaceholder', { defaultMessage: "Cuéntanos sobre tu mascota..." })} {...form.register("message")} className="border-2 sm:border-[3px] border-black rounded-xl focus-visible:ring-0 focus-visible:shadow-[2px_2px_0px_0px_#0F172A] sm:focus-visible:shadow-[4px_4px_0px_0px_#0F172A] transition-shadow text-base resize-none min-h-[60px] sm:min-h-[100px]" />
                {form.formState.errors.message && <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>}
            </div>

            <div className="grid gap-1">
                <div className="flex items-center justify-between">
                    <Label htmlFor="pet-photo" className="text-sm font-medium">
                        {t('uploadPetPhoto', { defaultMessage: "Subir foto de tu mascota (Opcional)" })}
                    </Label>
                    {petImage && (
                        <button 
                            type="button" 
                            onClick={() => setPetImage(null)}
                            className="text-xs text-destructive hover:underline flex items-center gap-1"
                        >
                            <X className="h-3 w-3" /> Quitar
                        </button>
                    )}
                </div>

                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "relative h-14 sm:h-24 w-full rounded-2xl border-2 sm:border-[3px] border-dashed border-black transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden hover:shadow-[2px_2px_0px_0px_#0F172A] sm:hover:shadow-[4px_4px_0px_0px_#0F172A]",
                        petImage 
                            ? "bg-secondary/20" 
                            : "bg-background hover:bg-secondary/10"
                    )}
                >
                    {previewUrl ? (
                        <>
                            <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                            <div className="relative z-10 flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-primary/20">
                                <ImageIcon className="h-5 w-5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px]">
                                    {petImage?.name}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <Camera className="h-6 w-6 text-muted-foreground/40" />
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                Seleccionar Imagen
                            </span>
                        </>
                    )}
                </div>

                <input
                    id="pet-photo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    title="Upload pet photo"
                    aria-label="Upload pet photo"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPetImage(file);
                    }}
                />
            </div>
            <Button type="submit" size="lg" className="w-full h-11 sm:h-14 rounded-2xl border-2 sm:border-[3px] border-black shadow-[4px_4px_0px_0px_#0F172A] sm:shadow-[6px_6px_0px_0px_#0F172A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0F172A] sm:hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all text-base sm:text-lg font-black bg-primary text-white mt-2" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('sending', { defaultMessage: "Enviando..." }) : t('send', { defaultMessage: "Enviar Mensaje" })}
            </Button>

            <Dialog open={showExhaustedDialog} onOpenChange={setShowExhaustedDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-[3px] border-black bg-white p-8 shadow-[12px_12px_0px_0px_#0F172A] z-[100]">
                    <DialogHeader className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 border-2 border-destructive">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                            {locale === 'es' ? "¡Cupón Agotado!" : "Coupon Exhausted!"}
                        </DialogTitle>
                        <DialogDescription className="text-foreground/70 font-bold text-lg mt-2">
                            {locale === 'es' 
                                ? "Este código ya ha alcanzado su límite de usos y no es válido actualmente." 
                                : "This code has reached its usage limit and is no longer valid."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-6">
                        <Button 
                            onClick={handleCorrectCode}
                            className="w-full h-12 rounded-xl border-2 border-black bg-white text-foreground font-black shadow-[4px_4px_0px_0px_#0F172A] hover:bg-muted transition-all"
                        >
                            {locale === 'es' ? "Corregir Código" : "Correct Code"}
                        </Button>
                        <Button 
                            onClick={handleContinueWithoutDiscount}
                            variant="destructive"
                            className="w-full h-12 rounded-xl border-2 border-black font-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                        >
                            {locale === 'es' ? "Continuar sin Descuento" : "Continue without Discount"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </form>
    );
}
