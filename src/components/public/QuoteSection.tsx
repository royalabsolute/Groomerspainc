"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { submitInquiry } from "@/lib/actions/inquiries";
import { validateDiscountCode } from "@/lib/actions/discounts";
import { isZipCodeSupported, getTravelPremium } from "@/lib/pricing";
import { useEffect, useState, useRef, useTransition } from "react";
import { Camera, Image as ImageIcon, AlertTriangle, ShieldCheck, DollarSign, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    phone: z.string().min(10, { message: "Phone number is required (min 10 digits)." }),
    address: z.string().min(5, { message: "Address must be at least 5 characters." }),
    zipCode: z.string().regex(/^\d{5}$/, { message: "ZIP Code must be exactly 5 digits." }),
    
    // Pet Specs
    petName: z.string().min(1, { message: "Pet name is required." }),
    breed: z.string().min(1, { message: "Breed is required." }),
    petWeight: z.coerce.number().min(1, { message: "Weight must be at least 1 lb." }).max(200, { message: "Weight must be under 200 lbs." }),
    petAge: z.string().min(1, { message: "Age is required." }),
    rabiesVaccinated: z.boolean().refine((val) => val === true, {
        message: "Florida health standards require rabies vaccination.",
    }),
    rabiesRegistry: z.string().optional(),

    // Services selection state will be handled dynamically outside hook form
    discountCode: z.string().optional(),
    message: z.string().optional(),
    legalAccepted: z.boolean().refine((val) => val === true, {
        message: "You must accept the estimation terms.",
    }),
});

interface ServiceItem {
    id: string;
    nameEs: string;
    nameEn: string;
    category: "MAIN_GROOMING" | "ADDON_TREATMENT" | "SPECIAL_SHAMPOO";
    basePrice: number;
    isActive: boolean;
}

interface QuoteSectionProps {
    locale: string;
    initialServices: ServiceItem[];
}

export default function QuoteSection({ locale, initialServices }: QuoteSectionProps) {
    const t = useTranslations("QuoteForm");
    const tIndex = useTranslations("Index");
    const activeLocale = useLocale();

    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [petImage, setPetImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);

    // Selected services states
    const [selectedMainGrooming, setSelectedMainGrooming] = useState<string>("");
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [selectedShampoo, setSelectedShampoo] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            zipCode: "",
            petName: "",
            breed: "",
            petWeight: undefined as any,
            petAge: "",
            rabiesVaccinated: false,
            rabiesRegistry: "",
            discountCode: "",
            message: "",
            legalAccepted: false
        },
        mode: "onChange"
    });

    // Image preview cleanup
    useEffect(() => {
        if (!petImage) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(petImage);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [petImage]);

    // Group initial active services
    const mainGroomings = initialServices.filter(s => s.isActive && s.category === "MAIN_GROOMING");
    const addons = initialServices.filter(s => s.isActive && s.category === "ADDON_TREATMENT");
    const shampoos = initialServices.filter(s => s.isActive && s.category === "SPECIAL_SHAMPOO");

    // Select first main grooming by default if available
    useEffect(() => {
        if (mainGroomings.length > 0 && !selectedMainGrooming) {
            setSelectedMainGrooming(mainGroomings[0].id);
        }
    }, [mainGroomings, selectedMainGrooming]);

    // Live calculations
    const watchedWeight = form.watch("petWeight") || 0;
    const watchedZip = form.watch("zipCode") || "";

    // 1. Base por peso
    let weightBasePrice = 45;
    if (watchedWeight >= 15 && watchedWeight < 30) {
        weightBasePrice = 60;
    } else if (watchedWeight >= 30 && watchedWeight < 60) {
        weightBasePrice = 75;
    } else if (watchedWeight >= 60) {
        weightBasePrice = 95;
    }

    // 2. Travel Surcharge
    const isZipValid = isZipCodeSupported(watchedZip);
    const travelSurcharge = isZipValid ? getTravelPremium(watchedZip) : 0;

    // 3. Suma de Servicios elegidos
    const mainServicePrice = Number(mainGroomings.find(s => s.id === selectedMainGrooming)?.basePrice || 0);
    const addonsPrice = selectedAddons.reduce((sum, id) => {
        const ad = addons.find(a => a.id === id);
        return sum + Number(ad ? ad.basePrice : 0);
    }, 0);
    const shampooPrice = Number(shampoos.find(s => s.id === selectedShampoo)?.basePrice || 0);

    const originalPrice = weightBasePrice + mainServicePrice + addonsPrice + shampooPrice + travelSurcharge;

    // 4. Coupon discount
    let discountedPrice = originalPrice;
    let discountAmount = 0;
    if (appliedDiscount && originalPrice > 0) {
        if (appliedDiscount.includes('%')) {
            const percent = parseFloat(appliedDiscount.replace('%', ''));
            discountAmount = originalPrice * (percent / 100);
            discountedPrice = Math.max(0, originalPrice - discountAmount);
        } else {
            discountAmount = parseFloat(appliedDiscount.replace('$', '')) || 0;
            discountedPrice = Math.max(0, originalPrice - discountAmount);
        }
    }

    const checkCode = async () => {
        const code = form.getValues("discountCode");
        if (!code) return;
        
        setIsCheckingCode(true);
        try {
            const result = await validateDiscountCode(code);
            if (result.valid) {
                setAppliedDiscount(result.discount || "Active");
                toast.success(locale === "es" ? "¡Cupón aplicado!" : "Coupon applied!");
            } else {
                setAppliedDiscount(null);
                toast.error(result.message);
            }
        } catch {
            toast.error("Error validating coupon");
        } finally {
            setIsCheckingCode(false);
        }
    };

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleNextStep1 = async () => {
        const isValid = await form.trigger(["name", "email", "phone", "address", "zipCode"]);
        if (isValid) {
            if (!isZipValid) {
                toast.error(t("zipCodeNoCoverage"));
                return;
            }
            setStep(2);
        } else {
            toast.error(locale === "es" ? "Por favor complete los campos requeridos correctamente." : "Please fill in the required fields correctly.");
        }
    };

    const handleNextStep2 = async () => {
        const isValid = await form.trigger(["petName", "breed", "petWeight", "petAge", "rabiesVaccinated"]);
        if (isValid) {
            setStep(3);
        } else {
            toast.error(locale === "es" ? "Por favor complete la ficha médica de su mascota." : "Please fill in your pet's medical specs.");
        }
    };

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!isZipValid) {
            toast.error(t("zipCodeNoCoverage"));
            return;
        }

        // Selected service IDs compilation
        const allSelectedIds = [selectedMainGrooming];
        selectedAddons.forEach(id => allSelectedIds.push(id));
        if (selectedShampoo) allSelectedIds.push(selectedShampoo);

        startTransition(async () => {
            try {
                const fd = new FormData();
                // Owner fields (mapped to server-side expected names)
                fd.append("ownerName", values.name);
                fd.append("name", values.name);
                fd.append("ownerEmail", values.email);
                fd.append("email", values.email);
                fd.append("ownerPhone", values.phone);
                fd.append("phone", values.phone);
                fd.append("address", values.address);
                fd.append("zipCode", values.zipCode);
                fd.append("legalAccepted", String(values.legalAccepted));
                fd.append("termsAccepted", String(values.legalAccepted));
                if (values.discountCode) fd.append("discountCode", values.discountCode);
                if (values.message) fd.append("message", values.message);
                fd.append("systemEstimatedPrice", String(discountedPrice));

                // Build pet as a JSON array for the server action
                const petsPayload = [
                    {
                        name: values.petName,
                        breed: values.breed,
                        weight: String(values.petWeight),
                        weightLbs: values.petWeight,
                        age: values.petAge,
                        rabiesVaccinated: values.rabiesVaccinated,
                        rabiesRegistry: values.rabiesRegistry || null,
                        shampooId: selectedShampoo || null,
                        selectedServiceIds: allSelectedIds,
                    }
                ];
                fd.append("pets", JSON.stringify(petsPayload));

                // Attach pet image as petImage_0 (index-based for the server loop)
                if (petImage) fd.append("petImage_0", petImage);

                const result = await submitInquiry(fd);
                if (result.success) {
                    toast.success(t("success"));
                    form.reset();
                    setPetImage(null);
                    setAppliedDiscount(null);
                    setSelectedAddons([]);
                    setSelectedShampoo("");
                    setStep(1);
                    if (mainGroomings.length > 0) {
                        setSelectedMainGrooming(mainGroomings[0].id);
                    }
                } else {
                    if (result.error === "no_coverage") {
                        toast.error(t("zipCodeNoCoverage"));
                    } else if (result.error === "file_too_large") {
                        toast.error(t("largeFileError"));
                    } else if (result.error === "invalid_file_type") {
                        toast.error(t("fileTypeError"));
                    } else {
                        toast.error(t("error"));
                    }
                }
            } catch (err) {
                toast.error(locale === 'es' ? "Ocurrió un error inesperado." : "An unexpected error occurred.");
            }
        });
    };

    const renderSummaryCard = (isMobileLayout: boolean = false) => {
        return (
            <div className={cn(
                "bg-white border-4 border-black p-6 rounded-3xl text-neutral-900 shadow-[8px_8px_0px_0px_#000] space-y-5 relative overflow-hidden transition-all",
                isMobileLayout && "border-2 rounded-2xl shadow-[4px_4px_0_0_#000] p-4"
            )}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-black">
                    <DollarSign className="h-28 w-28" />
                </div>

                <h4 className="text-xs font-black uppercase text-[#06B6D4] tracking-widest border-b border-black/10 pb-2 flex items-center gap-1.5">
                    📊 {t("estimation")}
                </h4>

                {/* Foto de la Mascota */}
                <div className="grid gap-2 border-b border-black/10 pb-4">
                    <Label htmlFor="pet-photo" className="font-black text-xs uppercase tracking-wider text-slate-700 cursor-pointer">
                        📸 {t("uploadPhoto")}
                    </Label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "relative h-16 w-full rounded-xl border-3 border-dashed border-black/20 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden hover:bg-black/5 bg-[#FAFAFA]"
                        )}
                    >
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                                <div className="relative z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg border-2 border-black shadow-md">
                                    <ImageIcon className="h-3.5 w-3.5 text-[#06B6D4]" />
                                    <span className="text-[9px] font-black uppercase truncate max-w-[150px]">
                                        {petImage?.name}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <Camera className="h-4 w-4 text-slate-400" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {locale === "es" ? "Seleccionar Imagen" : "Choose Image"}
                                </span>
                            </>
                        )}
                    </div>
                    <input
                        id="pet-photo"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        title={locale === "es" ? "Subir foto de la mascota" : "Upload pet photo"}
                        className="sr-only"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setPetImage(file);
                        }}
                    />
                </div>

                {/* Promo Discount Input */}
                <div className="grid gap-1.5 border-b border-black/10 pb-4">
                    <Label htmlFor="discountCode" className="font-black text-xs uppercase tracking-wider text-slate-700">
                        🎟️ {t("coupon")}
                        {appliedDiscount && <span className="ml-2 text-emerald-600 font-black">✓ {appliedDiscount}</span>}
                    </Label>
                    <div className="flex gap-2">
                        <Input id="discountCode" placeholder="CUPON123" {...form.register("discountCode")} className="border-3 border-black bg-[#FAFAFA] text-neutral-900 rounded-xl text-sm h-10 focus-visible:ring-0 uppercase placeholder-slate-400 font-black tracking-wider" />
                        <Button 
                            type="button" 
                            onClick={checkCode}
                            disabled={isCheckingCode}
                            className="h-10 bg-[#06B6D4] border-3 border-black shadow-[2px_2px_0_0_#000] text-white font-black px-4 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer text-xs transition-all"
                        >
                            {isCheckingCode ? "..." : "OK"}
                        </Button>
                    </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="space-y-2 text-[11px] font-bold text-slate-500">
                    <div className="flex justify-between">
                        <span className="uppercase">📦 {locale === "es" ? "Base Peso + Zona" : "Weight base + Surcharge"}:</span>
                        <span className="font-black text-neutral-800">${(weightBasePrice + travelSurcharge).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="uppercase">✂️ {locale === "es" ? "Grooming & Adicionales" : "Grooming & Addons"}:</span>
                        <span className="font-black text-neutral-800">${(mainServicePrice + addonsPrice + shampooPrice).toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-rose-600">
                            <span className="uppercase">🎟️ {t("discount")}:</span>
                            <span className="font-black">-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* Total Pricing Output */}
                <div className="flex justify-between items-end border-t-3 border-black border-dashed pt-3 mt-1">
                    <span className="text-xs font-black uppercase text-[#06B6D4] tracking-widest leading-none mb-1">
                        {t("totalEstimation")}:
                    </span>
                    <span className="text-3xl font-black text-neutral-900 leading-none">
                        ${discountedPrice.toFixed(2)}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <section id="cotizar" className="py-16 bg-[#FDFCF8] relative overflow-hidden px-4 sm:px-6 lg:px-8 border-b-4 border-black">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <div className="inline-block bg-[#06B6D4] text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 border-3 border-black shadow-[3px_3px_0px_0px_#000] -rotate-1">
                        {locale === "es" ? "PRESUPUESTO AL INSTANTE" : "INSTANT ESTIMATION"}
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                        {locale === "es" ? "Cotiza tu Servicio" : "Quote Your Service"}
                    </h2>
                    <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">
                        {locale === "es" 
                            ? "Calcula en tiempo real y solicita tu cita a domicilio" 
                            : "Calculate in real time & book your door-to-door appointment"}
                    </p>
                </div>

                {/* Form Container */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-16 lg:pb-0">
                    
                    {/* ⬅️ COLUMNA IZQUIERDA: Formulario dinámico por pasos (Ocupa 7/12) */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Barra de Progreso Neo-Brutalista */}
                        <div className="w-full bg-[#E5E7EB] border-4 border-black h-8 rounded-xl overflow-hidden relative shadow-[4px_4px_0_0_#000] mb-2 select-none">
                            <div 
                                className="bg-[#06B6D4] h-full border-r-4 border-black transition-all duration-300 flex items-center justify-end pr-3"
                                style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
                            >
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {step}/3
                                </span>
                            </div>
                        </div>

                        {/* Contenedor del paso actual */}
                        <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_#000] min-h-[380px] flex flex-col justify-between">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -50, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="border-b-3 border-black pb-3">
                                            <h3 className="font-black text-lg uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                                                👤 {locale === "es" ? "1. Datos de Contacto y Ubicación" : "1. Contact & Location"}
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="name" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("ownerName")}</Label>
                                                <Input id="name" placeholder={t("ownerNamePlaceholder")} {...form.register("name")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                {form.formState.errors.name && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.name.message}</p>}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="email" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("email")}</Label>
                                                    <Input id="email" type="email" placeholder={t("emailPlaceholder")} {...form.register("email")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.email && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.email.message}</p>}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="phone" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("phone")}</Label>
                                                    <Input id="phone" type="tel" placeholder={t("phonePlaceholder")} {...form.register("phone")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.phone && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.phone.message}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2 grid gap-1.5">
                                                    <Label htmlFor="address" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("address")}</Label>
                                                    <Input id="address" placeholder={t("addressPlaceholder")} {...form.register("address")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.address && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.address.message}</p>}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="zipCode" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("zipCode")}</Label>
                                                    <Input id="zipCode" maxLength={5} placeholder={t("zipCodePlaceholder")} {...form.register("zipCode")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] uppercase placeholder-slate-400 font-black tracking-widest text-neutral-900" />
                                                    {form.formState.errors.zipCode && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.zipCode.message}</p>}
                                                    {watchedZip && !isZipValid && (
                                                        <p className="text-[10px] font-black text-amber-600 uppercase mt-0.5">⚠️ {locale === "es" ? "Fuera de cobertura" : "No coverage area"}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t-3 border-black">
                                            <Button
                                                type="button"
                                                onClick={handleNextStep1}
                                                className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-white font-black h-12 px-8 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer flex items-center gap-2"
                                            >
                                                {locale === "es" ? "Siguiente" : "Next"} ➔
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -50, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="border-b-3 border-black pb-3">
                                            <h3 className="font-black text-lg uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                                                🐾 {locale === "es" ? "2. Ficha y Salud de la Mascota" : "2. Pet Profiler & Health"}
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="petName" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petName")}</Label>
                                                    <Input id="petName" placeholder={t("petNamePlaceholder")} {...form.register("petName")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.petName && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.petName.message}</p>}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="breed" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petBreed")}</Label>
                                                    <Input id="breed" placeholder={t("petBreedPlaceholder")} {...form.register("breed")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.breed && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.breed.message}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="petWeight" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petWeight")}</Label>
                                                    <div className="relative">
                                                        <Input id="petWeight" type="number" placeholder={t("petWeightPlaceholder")} {...form.register("petWeight")} className="border-3 border-black bg-white rounded-xl text-sm h-11 pr-12 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">LBS</span>
                                                    </div>
                                                    {form.formState.errors.petWeight && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.petWeight.message}</p>}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="petAge" className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petAge")}</Label>
                                                    <Input id="petAge" placeholder={t("petAgePlaceholder")} {...form.register("petAge")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.petAge && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.petAge.message}</p>}
                                                </div>
                                            </div>

                                            {/* Florida Rabies mandated Protection */}
                                            <div className="border-3 border-black rounded-2xl p-4 bg-[#FAFAFA] shadow-[3px_3px_0_0_#000] space-y-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                                                        <Label htmlFor="rabiesVaccinated" className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-tight leading-tight cursor-pointer">
                                                            🛡️ {t("rabiesVaccination")}
                                                        </Label>
                                                    </div>
                                                    <input
                                                        id="rabiesVaccinated"
                                                        type="checkbox"
                                                        className="h-6 w-6 accent-[#06B6D4] border-3 border-black rounded-lg cursor-pointer shrink-0"
                                                        {...form.register("rabiesVaccinated")}
                                                    />
                                                </div>

                                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                                                    ℹ️ {t("rabiesVaccinationPlaceholder")}
                                                </p>

                                                {form.watch("rabiesVaccinated") ? (
                                                    <div className="grid gap-1.5 pt-2 border-t-2 border-black/5">
                                                        <Label htmlFor="rabiesRegistry" className="font-black text-xs text-slate-600 uppercase tracking-wider">{t("rabiesNumber")}</Label>
                                                        <Input id="rabiesRegistry" placeholder={t("rabiesNumberPlaceholder")} {...form.register("rabiesRegistry")} className="border-3 border-black bg-white rounded-xl text-sm h-10 focus-visible:ring-0 placeholder-slate-400 font-bold tracking-widest uppercase text-neutral-900" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-rose-500/10 border-2 border-rose-500 text-rose-600 p-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider leading-relaxed flex items-start gap-2 mt-2">
                                                        <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                                                        <span>{t("rabiesRequired")}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-4 border-t-3 border-black">
                                            <Button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="bg-slate-100 text-black hover:bg-slate-200 font-black h-12 px-6 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer"
                                            >
                                                ⇠ {locale === "es" ? "Anterior" : "Back"}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleNextStep2}
                                                className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-white font-black h-12 px-8 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer flex items-center gap-2"
                                            >
                                                {locale === "es" ? "Siguiente" : "Next"} ➔
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -50, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="border-b-3 border-black pb-3">
                                            <h3 className="font-black text-lg uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                                                ✂️ {locale === "es" ? "3. Elige tus Servicios" : "3. Choose Services"}
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            {/* 1. Main Grooming Select */}
                                            <div className="space-y-2">
                                                <Label className="font-black text-xs uppercase tracking-wider text-slate-700">
                                                    🏷️ {locale === "es" ? "Paquete de Grooming (Selecciona 1)" : "Grooming Package (Select 1)"}
                                                </Label>
                                                <div className="space-y-2">
                                                    {mainGroomings.map(s => {
                                                        const name = activeLocale === "es" ? s.nameEs : s.nameEn;
                                                        const isSelected = selectedMainGrooming === s.id;
                                                        return (
                                                            <div 
                                                                key={s.id}
                                                                onClick={() => setSelectedMainGrooming(s.id)}
                                                                className={cn(
                                                                    "border-3 rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all select-none",
                                                                    isSelected 
                                                                        ? "bg-[#06B6D4]/10 border-[#06B6D4] shadow-[2px_2px_0_0_#06B6D4]" 
                                                                        : "bg-[#FAFAFA] border-black/10 hover:border-black"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={cn(
                                                                        "h-4 w-4 rounded-full border-2 border-black flex items-center justify-center shrink-0",
                                                                        isSelected && "bg-[#06B6D4]"
                                                                    )}>
                                                                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                                    </div>
                                                                    <span className="font-black text-xs sm:text-sm uppercase tracking-tight text-neutral-800">{name}</span>
                                                                </div>
                                                                <span className="font-black text-sm text-[#06B6D4]">${Number(s.basePrice).toFixed(2)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* 2. Add-on Treatments Checklist */}
                                            {addons.length > 0 && (
                                                <div className="space-y-2 pt-2 border-t-2 border-black/5">
                                                    <Label className="font-black text-xs uppercase tracking-wider text-slate-700">
                                                        ✨ {locale === "es" ? "Tratamientos Extras (Add-ons)" : "Extra Treatments (Add-ons)"}
                                                    </Label>
                                                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                                                        {addons.map(s => {
                                                            const name = activeLocale === "es" ? s.nameEs : s.nameEn;
                                                            const isChecked = selectedAddons.includes(s.id);
                                                            return (
                                                                <div 
                                                                    key={s.id}
                                                                    onClick={() => toggleAddon(s.id)}
                                                                    className={cn(
                                                                        "border-3 rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all select-none",
                                                                        isChecked 
                                                                            ? "bg-amber-500/10 border-amber-500 shadow-[2px_2px_0_0_#d97706]" 
                                                                            : "bg-[#FAFAFA] border-black/10 hover:border-black"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            readOnly
                                                                            title={name}
                                                                            aria-label={name}
                                                                            className="h-4.5 w-4.5 accent-amber-500 border-2 border-black rounded cursor-pointer"
                                                                        />
                                                                        <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight text-neutral-800 leading-tight">{name}</span>
                                                                    </div>
                                                                    <span className="font-black text-xs text-amber-600 shrink-0">+${Number(s.basePrice).toFixed(2)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. Special Shampoo Selector */}
                                            {shampoos.length > 0 && (
                                                <div className="space-y-2 pt-2 border-t-2 border-black/5">
                                                    <Label htmlFor="special-shampoo" className="font-black text-xs uppercase tracking-wider text-slate-700">
                                                        🧼 {locale === "es" ? "Champú Especial (Opcional)" : "Special Shampoo (Optional)"}
                                                    </Label>
                                                    <select
                                                        id="special-shampoo"
                                                        title={locale === "es" ? "Champú Especial (Opcional)" : "Special Shampoo (Optional)"}
                                                        value={selectedShampoo}
                                                        onChange={(e) => setSelectedShampoo(e.target.value)}
                                                        className="flex h-11 w-full rounded-xl border-3 border-black bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[3px_3px_0_0_#000] appearance-none font-bold text-slate-800"
                                                    >
                                                        <option value="">{locale === "es" ? "Ninguno (Champú Orgánico Estándar)" : "None (Standard Organic Shampoo)"}</option>
                                                        {shampoos.map(s => {
                                                            const name = activeLocale === "es" ? s.nameEs : s.nameEn;
                                                            return (
                                                                <option key={s.id} value={s.id}>
                                                                    {name} (+${Number(s.basePrice).toFixed(2)})
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Optional Client Message */}
                                            <div className="space-y-1.5 pt-2 border-t-2 border-black/5">
                                                <Label htmlFor="message" className="font-black text-xs uppercase tracking-wider text-slate-700">
                                                    ✉️ {locale === "es" ? "Mensaje o Nota Opcional" : "Optional Message or Note"}
                                                </Label>
                                                <Textarea 
                                                    id="message" 
                                                    placeholder={locale === "es" ? "Indicaciones especiales sobre tu mascota o domicilio..." : "Special instructions about your pet or address..."} 
                                                    {...form.register("message")} 
                                                    className="border-3 border-black bg-white rounded-xl text-sm min-h-[70px] focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] font-bold text-neutral-900"
                                                />
                                            </div>

                                            {/* Summary card embedded inside wizard step 3 on mobile */}
                                            <div className="lg:hidden pt-4">
                                                {renderSummaryCard(true)}
                                            </div>

                                            {/* legal acceptance checkbox */}
                                            <div className="space-y-3 pt-4 border-t-2 border-black/5">
                                                <div className="flex items-start gap-2.5">
                                                    <input 
                                                        type="checkbox"
                                                        id="legalAccepted"
                                                        className="h-5 w-5 accent-[#06B6D4] border-3 border-black rounded cursor-pointer mt-0.5 shrink-0"
                                                        {...form.register("legalAccepted")}
                                                    />
                                                    <Label htmlFor="legalAccepted" className="text-[10px] font-semibold text-slate-650 leading-relaxed uppercase select-none cursor-pointer">
                                                        ⚠️ {locale === "es" 
                                                            ? "Declaro que la vacuna de la rabia está al día según la ley de Florida y acepto que el precio es un estimado provisional sujeto a reajuste tras inspección física por nudos o conducta de la mascota."
                                                            : "I declare that the rabies vaccine is active under Florida law and accept that this price is a provisional estimate subject to final physical check (due to matting or dog temperament)."}
                                                    </Label>
                                                </div>
                                                {form.formState.errors.legalAccepted && (
                                                    <p className="text-[10px] font-black text-rose-500 uppercase">{form.formState.errors.legalAccepted.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-4 border-t-3 border-black">
                                            <Button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                className="bg-slate-100 text-black hover:bg-slate-200 font-black h-12 px-6 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer"
                                            >
                                                ⇠ {locale === "es" ? "Anterior" : "Back"}
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isPending || !form.watch("legalAccepted") || (watchedWeight <= 0) || !form.watch("rabiesVaccinated")}
                                                className="bg-[#2ECC71] text-neutral-900 hover:bg-[#2ECC71]/90 font-black h-12 px-8 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                                            >
                                                {isPending ? tIndex("sending", { defaultMessage: "Enviando..." }) : t("submit")} 🫧
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ➡️ COLUMNA DERECHA: Sticky Resumen de Cotización (Ocupa 5/12) */}
                    <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24">
                        {renderSummaryCard(false)}
                    </div>
                </form>

                {/* 📱 PORTABLE FLOATING BOTTOM BAR FOR MOBILE LAYOUT */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black p-4 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.15)] lg:hidden select-none">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                            {locale === "es" ? "Total Estimado" : "Estimated Total"}
                        </span>
                        <span className="font-black text-xl text-neutral-900 leading-none">
                            ${discountedPrice.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {step < 3 ? (
                            <Button 
                                type="button"
                                onClick={step === 1 ? handleNextStep1 : handleNextStep2}
                                className="bg-[#06B6D4] text-white font-black h-10 px-5 rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] text-xs uppercase"
                            >
                                {locale === "es" ? "Siguiente" : "Next"} ➔
                            </Button>
                        ) : (
                            <Button 
                                type="button"
                                onClick={() => {
                                    const element = document.getElementById("legalAccepted");
                                    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
                                    toast.info(locale === "es" ? "Acepte los términos y haga clic en Enviar" : "Accept terms and click Submit");
                                }}
                                className="bg-[#2ECC71] text-neutral-900 font-black h-10 px-5 rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] text-xs uppercase"
                            >
                                {locale === "es" ? "Confirmar" : "Confirm"} ✓
                            </Button>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
}
