"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { submitInquiry } from "@/lib/actions/inquiries";
import { validateDiscountCode } from "@/lib/actions/discounts";
import { isZipCodeSupported, getTravelPremium } from "@/lib/pricing";
import { useEffect, useState, useRef, useTransition, useId } from "react";
import { 
    Camera, Image as ImageIcon, AlertTriangle, ShieldCheck, DollarSign,
    Dog, PawPrint, Calendar, Clock, User, Gift, Check, Info, PlusCircle, 
    Scissors, Tag, Sparkles, MessageSquare, ChevronDown, ChevronUp, Star, MapPin, UploadCloud,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    phone: z.string().min(10, { message: "Phone number is required (min 10 digits)." }),
    address: z.string().min(5, { message: "Address must be at least 5 characters." }),
    zipCode: z.string().regex(/^\d{5}$/, { message: "ZIP Code must be exactly 5 digits." }),
    appointmentDate: z.string().min(1, { message: "Appointment date is required." }),
    appointmentTime: z.string().min(1, { message: "Appointment time is required." }),
    
    // Pet Specs
    pets: z.array(z.object({
        name: z.string().min(1, { message: "Pet name is required." }),
        breed: z.string().min(1, { message: "Breed is required." }),
        weight: z.coerce.number().min(1, { message: "Weight must be at least 1 lb." }).max(200, { message: "Weight must be under 200 lbs." }),
        age: z.string().min(1, { message: "Age is required." }),
        rabiesVaccinated: z.boolean().refine((val) => val === true, {
            message: "Florida health standards require rabies vaccination.",
        }),
        rabiesRegistry: z.string().optional(),
    })).min(1, { message: "Must add at least one pet." }),

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

    const uniqueId = useId();
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);

    // Selected services states per pet index
    const [petServices, setPetServices] = useState<{
        [index: number]: {
            mainGrooming: string;
            addons: string[];
            shampoo: string;
        }
    }>({
        0: { mainGrooming: "", addons: [], shampoo: "" }
    });

    const [petImages, setPetImages] = useState<{ [index: number]: File }>({});
    const [petPreviewUrls, setPetPreviewUrls] = useState<{ [index: number]: string }>({});
    const [expandedPetIndex, setExpandedPetIndex] = useState<number>(0);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            zipCode: "",
            appointmentDate: "",
            appointmentTime: "",
            pets: [
                {
                    name: "",
                    breed: "",
                    weight: undefined as any,
                    age: "",
                    rabiesVaccinated: false,
                    rabiesRegistry: ""
                }
            ],
            discountCode: "",
            message: "",
            legalAccepted: false
        },
        mode: "onChange"
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "pets"
    });

    const handleFileChange = (index: number, file: File) => {
        setPetImages(prev => ({ ...prev, [index]: file }));
        const url = URL.createObjectURL(file);
        setPetPreviewUrls(prev => {
            if (prev[index]) URL.revokeObjectURL(prev[index]);
            return { ...prev, [index]: url };
        });
    };

    // Image preview cleanup
    useEffect(() => {
        return () => {
            Object.values(petPreviewUrls).forEach(url => URL.revokeObjectURL(url));
        };
    }, [petPreviewUrls]);

    // Group initial active services
    const mainGroomings = initialServices.filter(s => s.isActive && s.category === "MAIN_GROOMING");
    const addons = initialServices.filter(s => s.isActive && s.category === "ADDON_TREATMENT");
    const shampoos = initialServices.filter(s => s.isActive && s.category === "SPECIAL_SHAMPOO");

    // Select first main grooming by default if available for newly added pets
    useEffect(() => {
        if (mainGroomings.length > 0) {
            const watchedPets = form.watch("pets") || [];
            let updated = false;
            const newServices = { ...petServices };
            watchedPets.forEach((_, idx) => {
                if (!newServices[idx]) {
                    newServices[idx] = { mainGrooming: mainGroomings[0].id, addons: [], shampoo: "" };
                    updated = true;
                } else if (!newServices[idx].mainGrooming) {
                    newServices[idx].mainGrooming = mainGroomings[0].id;
                    updated = true;
                }
            });
            if (updated) {
                setPetServices(newServices);
            }
        }
    }, [mainGroomings, form.watch("pets")]);

    // Live calculations
    const watchedZip = form.watch("zipCode") || "";
    const petsList = form.watch("pets") || [];

    // Calculate dynamic pricing breakdown for each pet
    const petsCalculated = petsList.map((pet, index) => {
        let petWeightBasePrice = 45;
        const w = Number(pet.weight) || 0;
        if (w >= 15 && w < 30) {
            petWeightBasePrice = 60;
        } else if (w >= 30 && w < 60) {
            petWeightBasePrice = 75;
        } else if (w >= 60) {
            petWeightBasePrice = 95;
        }

        const servicesForPet = petServices[index] || { mainGrooming: "", addons: [], shampoo: "" };
        const petMainServicePrice = Number(mainGroomings.find(s => s.id === servicesForPet.mainGrooming)?.basePrice || 0);
        const petAddonsPrice = (servicesForPet.addons || []).reduce((sum, id) => {
            const ad = addons.find(a => a.id === id);
            return sum + Number(ad ? ad.basePrice : 0);
        }, 0);
        const petShampooPrice = Number(shampoos.find(s => s.id === servicesForPet.shampoo)?.basePrice || 0);

        const subtotal = petWeightBasePrice + petMainServicePrice + petAddonsPrice + petShampooPrice;
        
        return {
            name: pet.name || `Perro #${index + 1}`,
            weightBasePrice: petWeightBasePrice,
            mainPrice: petMainServicePrice,
            addonsPrice: petAddonsPrice,
            shampooPrice: petShampooPrice,
            subtotal
        };
    });

    const totalPetsSubtotal = petsCalculated.reduce((sum, p) => sum + p.subtotal, 0);
    const isZipValid = isZipCodeSupported(watchedZip);
    const travelSurcharge = isZipValid ? getTravelPremium(watchedZip) : 0;
    
    const originalPrice = totalPetsSubtotal + travelSurcharge;

    // Coupon discount calculation
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

    const handleNextStep1 = async () => {
        const isValid = await form.trigger(["name", "email", "phone", "address", "zipCode", "appointmentDate", "appointmentTime"]);
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
        const isValid = await form.trigger(["pets"]);
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

        startTransition(async () => {
            try {
                const fd = new FormData();
                fd.append("ownerName", values.name);
                fd.append("name", values.name);
                fd.append("ownerEmail", values.email);
                fd.append("email", values.email);
                fd.append("ownerPhone", values.phone);
                fd.append("phone", values.phone);
                fd.append("address", values.address);
                fd.append("zipCode", values.zipCode);
                fd.append("appointmentDate", values.appointmentDate);
                fd.append("appointmentTime", values.appointmentTime);
                fd.append("legalAccepted", String(values.legalAccepted));
                fd.append("termsAccepted", String(values.legalAccepted));
                if (values.discountCode) fd.append("discountCode", values.discountCode);
                if (values.message) fd.append("message", values.message);
                fd.append("systemEstimatedPrice", String(discountedPrice));

                // Map pets into payload JSON
                const petsPayload = values.pets.map((pet, index) => {
                    const servicesForPet = petServices[index] || { mainGrooming: "", addons: [], shampoo: "" };
                    const allSelectedIds = [servicesForPet.mainGrooming];
                    (servicesForPet.addons || []).forEach(id => allSelectedIds.push(id));
                    if (servicesForPet.shampoo) allSelectedIds.push(servicesForPet.shampoo);

                    return {
                        name: pet.name,
                        breed: pet.breed,
                        weight: String(pet.weight),
                        weightLbs: pet.weight,
                        age: pet.age,
                        rabiesVaccinated: pet.rabiesVaccinated,
                        rabiesRegistry: pet.rabiesRegistry || null,
                        shampooId: servicesForPet.shampoo || null,
                        selectedServiceIds: allSelectedIds,
                    };
                });
                fd.append("pets", JSON.stringify(petsPayload));

                // Attach images for pets
                Object.keys(petImages).forEach(key => {
                    const idx = Number(key);
                    const file = petImages[idx];
                    if (file) {
                        fd.append(`petImage_${idx}`, file);
                    }
                });

                const result = await submitInquiry(fd);
                if (result.success) {
                    toast.success(t("success"));
                    form.reset();
                    setPetImages({});
                    setPetPreviewUrls({});
                    setAppliedDiscount(null);
                    setPetServices({
                        0: { mainGrooming: mainGroomings[0]?.id || "", addons: [], shampoo: "" }
                    });
                    setStep(1);
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
        const discountInputId = `${uniqueId}-discountCode-${isMobileLayout ? "mobile" : "desktop"}`;
        return (
            <div className={cn(
                "bg-white border-4 border-black p-6 rounded-3xl text-neutral-900 shadow-[8px_8px_0px_0px_#000] space-y-5 relative overflow-hidden transition-all",
                isMobileLayout && "border-2 rounded-2xl shadow-[4px_4px_0_0_#000] p-4"
            )}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-black">
                    <DollarSign className="h-28 w-28" />
                </div>

                <h4 className="text-xs font-black uppercase text-[#06B6D4] tracking-widest border-b border-black/10 pb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#06B6D4]" /> {t("estimation")}
                </h4>

                {/* Promo Discount Input */}
                <div className="grid gap-1.5 border-b border-black/10 pb-4">
                    <Label htmlFor={discountInputId} className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-[#06B6D4]" /> {t("coupon")}
                        {appliedDiscount && <span className="ml-2 text-emerald-600 font-black">✓ {appliedDiscount}</span>}
                    </Label>
                    <div className="flex gap-2">
                        <Input id={discountInputId} placeholder="CUPON123" {...form.register("discountCode")} className="border-3 border-black bg-[#FAFAFA] text-neutral-900 rounded-xl text-sm h-10 focus-visible:ring-0 uppercase placeholder-slate-400 font-black tracking-wider" />
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

                {/* Dynamic Dogs Breakdown */}
                <div className="space-y-4 border-b border-black/10 pb-4">
                    <h5 className="font-black text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Dog className="h-3.5 w-3.5 text-slate-400" /> {locale === "es" ? "Desglose por Perro" : "Dog Breakdown"}
                    </h5>
                    <div className="space-y-3">
                        {petsCalculated.map((p, idx) => {
                            return (
                                <div key={idx} className="bg-[#FAFAFA] border-2 border-black rounded-xl p-3 text-xs space-y-1">
                                    <div className="flex justify-between items-center border-b border-black/5 pb-1">
                                        <span className="font-black text-neutral-900 uppercase flex items-center gap-1.5">
                                            <Dog className="h-3 w-3 text-[#06B6D4]" /> {p.name}
                                        </span>
                                        <span className="font-black text-[#06B6D4]">
                                            ${p.subtotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5 text-[10px] text-slate-500 font-bold leading-normal">
                                        <div className="flex justify-between">
                                            <span>Base Peso:</span>
                                            <span>${p.weightBasePrice.toFixed(2)}</span>
                                        </div>
                                        {p.mainPrice > 0 && (
                                            <div className="flex justify-between">
                                                <span>Grooming:</span>
                                                <span>${p.mainPrice.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {p.addonsPrice > 0 && (
                                            <div className="flex justify-between">
                                                <span>Add-ons:</span>
                                                <span>+${p.addonsPrice.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {p.shampooPrice > 0 && (
                                            <div className="flex justify-between">
                                                <span>Champú:</span>
                                                <span>+${p.shampooPrice.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Surcharges and discounts */}
                <div className="space-y-2 text-[11px] font-bold text-slate-500">
                    {travelSurcharge > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="uppercase flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {locale === "es" ? "Traslado / Zona" : "Travel surcharge"}:</span>
                            <span className="font-black text-neutral-800">${travelSurcharge.toFixed(2)}</span>
                        </div>
                    )}
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-rose-600">
                            <span className="uppercase flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-rose-500" /> {t("discount")}:</span>
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
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-neutral-900 leading-none">
                        {locale === "es" ? "Cotiza tu Servicio" : "Quote Your Service"}
                    </h2>
                    <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">
                        {locale === "es" 
                            ? "Calcula en tiempo real y solicita tu cita a domicilio" 
                            : "Calculate in real time & book your door-to-door appointment"}
                    </p>
                </div>

                {/* Form Container */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative pb-16 md:pb-0">
                    
                    {/* COLUMNA IZQUIERDA: Formulario dinámico por pasos (Ocupa 7/12) */}
                    <div className="md:col-span-7 space-y-6">
                        
                        {/* Barra de Progreso Neo-Brutalista */}
                        <div className="w-full bg-[#E5E7EB] border-4 border-black h-8 rounded-xl overflow-hidden relative shadow-[4px_4px_0_0_#000] mb-2 select-none">
                            <div 
                                className={cn(
                                    "bg-[#06B6D4] h-full border-r-4 border-black transition-all duration-300 flex items-center justify-end pr-3",
                                    step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"
                                )}
                            >
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {step}/3
                                </span>
                            </div>
                        </div>

                        {/* Contenedor del paso actual */}
                        <div className={cn(
                            "bg-white border-3 md:border-4 border-black min-h-[380px] flex flex-col justify-between transition-all duration-300",
                            step === 2 
                                ? "rounded-xl md:rounded-2xl p-4 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" 
                                : "rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_#000]"
                        )}>
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
                                                <User className="h-5 w-5 text-[#06B6D4]" /> {locale === "es" ? "1. Datos de Contacto y Ubicación" : "1. Contact & Location"}
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor={`${uniqueId}-name`} className="font-black text-xs uppercase tracking-wider text-slate-700">{t("ownerName")}</Label>
                                                <Input id={`${uniqueId}-name`} placeholder={t("ownerNamePlaceholder")} {...form.register("name")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                {form.formState.errors.name && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.name.message}</p>}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor={`${uniqueId}-email`} className="font-black text-xs uppercase tracking-wider text-slate-700">{t("email")}</Label>
                                                    <Input id={`${uniqueId}-email`} type="email" placeholder={t("emailPlaceholder")} {...form.register("email")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.email && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.email.message}</p>}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor={`${uniqueId}-phone`} className="font-black text-xs uppercase tracking-wider text-slate-700">{t("phone")}</Label>
                                                    <Input id={`${uniqueId}-phone`} type="tel" placeholder={t("phonePlaceholder")} {...form.register("phone")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.phone && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.phone.message}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2 grid gap-1.5">
                                                    <Label htmlFor={`${uniqueId}-address`} className="font-black text-xs uppercase tracking-wider text-slate-700">{t("address")}</Label>
                                                    <Input id={`${uniqueId}-address`} placeholder={t("addressPlaceholder")} {...form.register("address")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                    {form.formState.errors.address && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.address.message}</p>}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor={`${uniqueId}-zipCode`} className="font-black text-xs uppercase tracking-wider text-slate-700">{t("zipCode")}</Label>
                                                    <Input id={`${uniqueId}-zipCode`} maxLength={5} placeholder={t("zipCodePlaceholder")} {...form.register("zipCode")} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] uppercase placeholder-slate-400 font-black tracking-widest text-neutral-900" />
                                                    {form.formState.errors.zipCode && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.zipCode.message}</p>}
                                                    {watchedZip && !isZipValid && (
                                                        <p className="text-[10px] font-black text-amber-600 uppercase mt-0.5 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {locale === "es" ? "Fuera de cobertura" : "No coverage area"}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor={`${uniqueId}-appointmentDate`} className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5"><Calendar className="h-4 w-4 text-[#06B6D4]" /> {t("bookingDate")}</Label>
                                                    <Input 
                                                        id={`${uniqueId}-appointmentDate`} 
                                                        type="date" 
                                                        min={new Date().toISOString().split('T')[0]}
                                                        {...form.register("appointmentDate")} 
                                                        className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] font-bold text-neutral-900" 
                                                    />
                                                    {form.formState.errors.appointmentDate && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.appointmentDate.message}</p>}
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor={`${uniqueId}-appointmentTime`} className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#06B6D4]" /> {t("bookingTime")}</Label>
                                                    <select
                                                        id={`${uniqueId}-appointmentTime`}
                                                        {...form.register("appointmentTime")}
                                                        className="flex h-12 w-full rounded-xl border-3 border-black bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[3px_3px_0_0_#000] font-bold text-slate-800"
                                                    >
                                                        <option value="">{locale === "es" ? "Seleccione un horario" : "Select a time slot"}</option>
                                                        <option value="09:00 - 12:00">09:00 AM - 12:00 PM ({locale === "es" ? "Mañana" : "Morning"})</option>
                                                        <option value="12:00 - 15:00">12:00 PM - 03:00 PM ({locale === "es" ? "Mediodía" : "Midday"})</option>
                                                        <option value="15:00 - 18:00">03:00 PM - 06:00 PM ({locale === "es" ? "Tarde" : "Afternoon"})</option>
                                                    </select>
                                                    {form.formState.errors.appointmentTime && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{form.formState.errors.appointmentTime.message}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t-3 border-black">
                                            <Button
                                                type="button"
                                                onClick={handleNextStep1}
                                                className="w-full sm:w-auto bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-white font-black h-12 px-8 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                {locale === "es" ? "Siguiente" : "Next"} <ChevronRight className="ml-1.5 h-4 w-4 shrink-0 inline" />
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
                                        {/* Step 2 Header */}
                                        <div className="border-b-3 border-black pb-3">
                                            <h3 className="font-black text-lg uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                                                <PawPrint className="h-5 w-5 text-[#06B6D4]" />
                                                {locale === "es" ? "Ficha y Salud de la Mascota" : "Pet Profiler & Health"}
                                            </h3>
                                        </div>

                                        {/* Collapsible Accordion Panels */}
                                        <div className="space-y-4">
                                            {fields.map((field, index) => {
                                                const errors = form.formState.errors.pets?.[index];
                                                const isVaccinated = form.watch(`pets.${index}.rabiesVaccinated`);
                                                const previewUrl = petPreviewUrls[index];
                                                const isExpanded = expandedPetIndex === index;

                                                return (
                                                    <div key={field.id} className="transition-all duration-300">
                                                        {/* Accordion Header */}
                                                        <div 
                                                            onClick={() => setExpandedPetIndex(isExpanded ? -1 : index)}
                                                            className={cn(
                                                                "flex justify-between items-center p-3.5 bg-white border-2 border-black transition-all duration-300 cursor-pointer select-none",
                                                                isExpanded 
                                                                    ? "rounded-t-lg border-b-2 bg-slate-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
                                                                    : "rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <Dog className="h-5 w-5 text-[#06B6D4]" />
                                                                <span className="font-black text-sm uppercase tracking-tight text-neutral-900">
                                                                    {form.watch(`pets.${index}.name`) || `${locale === "es" ? "Perro" : "Pet"} #${index + 1}`}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {fields.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            remove(index);
                                                                            setPetImages(prev => {
                                                                                const copy = { ...prev };
                                                                                delete copy[index];
                                                                                return copy;
                                                                            });
                                                                            setPetPreviewUrls(prev => {
                                                                                const copy = { ...prev };
                                                                                if (copy[index]) URL.revokeObjectURL(copy[index]);
                                                                                delete copy[index];
                                                                                return copy;
                                                                            });
                                                                            setExpandedPetIndex(Math.max(0, index - 1));
                                                                        }}
                                                                        className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase h-7 px-3 rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
                                                                    >
                                                                        {locale === "es" ? "Eliminar" : "Remove"}
                                                                    </button>
                                                                )}
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-5 w-5 text-neutral-900" />
                                                                ) : (
                                                                    <ChevronDown className="h-5 w-5 text-neutral-500" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Accordion Content */}
                                                        <AnimatePresence initial={false}>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="border-x-2 border-b-2 border-black rounded-b-lg p-5 bg-[#FAFAFA] -mt-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4 overflow-hidden"
                                                                >
                                                                    {/* 2-Column Professional CSS Grid */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                                        {/* Column 1: Image Upload (span 4) */}
                                                                        <div className="md:col-span-4 flex flex-col justify-start space-y-2">
                                                                            <Label className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                                                <UploadCloud className="h-4 w-4 text-[#06B6D4]" />
                                                                                {t("uploadPhoto")}
                                                                            </Label>
                                                                            <div 
                                                                                onClick={() => {
                                                                                    const el = document.getElementById(`${uniqueId}-pet-photo-${index}`);
                                                                                    if (el) el.click();
                                                                                }}
                                                                                className="relative h-40 w-full rounded-xl border-2 border-dashed border-black/25 transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden hover:bg-black/5 bg-white shadow-[2px_2px_0_0_rgba(0,0,0,0.05)]"
                                                                            >
                                                                                {previewUrl ? (
                                                                                    <>
                                                                                        <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                                                        <div className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-all flex items-center justify-center">
                                                                                            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border-2 border-black shadow-md">
                                                                                                <UploadCloud className="h-3.5 w-3.5 text-[#06B6D4]" />
                                                                                                <span className="text-[9px] font-black uppercase truncate max-w-[120px]">
                                                                                                    {locale === "es" ? "Cambiar" : "Change"}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <UploadCloud className="h-7 w-7 text-slate-400" />
                                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">
                                                                                            {locale === "es" ? "Subir Foto" : "Upload Photo"}
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                            <input
                                                                                id={`${uniqueId}-pet-photo-${index}`}
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="sr-only"
                                                                                title={locale === "es" ? "Subir foto de mascota" : "Upload pet photo"}
                                                                                aria-label={locale === "es" ? "Subir foto de mascota" : "Upload pet photo"}
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) handleFileChange(index, file);
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        {/* Column 2: Information Inputs (span 8) */}
                                                                        <div className="md:col-span-8 space-y-4 flex flex-col justify-between">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                <div className="grid gap-1.5">
                                                                                    <Label className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petName")}</Label>
                                                                                    <Input placeholder={t("petNamePlaceholder")} {...form.register(`pets.${index}.name`)} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                                                    {errors?.name && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{errors.name.message}</p>}
                                                                                </div>
                                                                                <div className="grid gap-1.5">
                                                                                    <Label className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petBreed")}</Label>
                                                                                    <Input placeholder={t("petBreedPlaceholder")} {...form.register(`pets.${index}.breed`)} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                                                    {errors?.breed && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{errors.breed.message}</p>}
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                <div className="grid gap-1.5">
                                                                                    <Label className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petWeight")}</Label>
                                                                                    <div className="relative">
                                                                                        <Input type="number" placeholder={t("petWeightPlaceholder")} {...form.register(`pets.${index}.weight`)} className="border-3 border-black bg-white rounded-xl text-sm h-11 pr-12 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">LBS</span>
                                                                                    </div>
                                                                                    {errors?.weight && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{errors.weight.message}</p>}
                                                                                </div>
                                                                                <div className="grid gap-1.5">
                                                                                    <Label className="font-black text-xs uppercase tracking-wider text-slate-700">{t("petAge")}</Label>
                                                                                    <Input placeholder={t("petAgePlaceholder")} {...form.register(`pets.${index}.age`)} className="border-3 border-black bg-white rounded-xl text-sm h-11 focus-visible:ring-0 focus-visible:shadow-[3px_3px_0_0_#000] placeholder-slate-400 font-bold text-neutral-900" />
                                                                                    {errors?.age && <p className="text-xs font-black text-rose-500 uppercase mt-0.5">{errors.age.message}</p>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Rabies Control Section */}
                                                                    <div className="border-2 border-black rounded-xl p-4 bg-white shadow-[2px_2px_0_0_#000] space-y-4">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                                                                                <Label htmlFor={`rabiesVaccinated-${index}`} className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-tight leading-tight cursor-pointer select-none">
                                                                                    {t("rabiesVaccination")}
                                                                                </Label>
                                                                            </div>
                                                                            <input
                                                                                id={`rabiesVaccinated-${index}`}
                                                                                type="checkbox"
                                                                                className="h-6 w-6 accent-[#06B6D4] border-3 border-black rounded-lg cursor-pointer shrink-0"
                                                                                {...form.register(`pets.${index}.rabiesVaccinated`)}
                                                                            />
                                                                        </div>

                                                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase flex items-center gap-1.5">
                                                                            <Info className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" />
                                                                            {t("rabiesVaccinationPlaceholder")}
                                                                        </p>

                                                                        {isVaccinated ? (
                                                                            <div className="grid gap-1.5 pt-2 border-t-2 border-black/5">
                                                                                <Label htmlFor={`rabiesRegistry-${index}`} className="font-black text-xs text-slate-600 uppercase tracking-wider">{t("rabiesNumber")}</Label>
                                                                                <Input id={`rabiesRegistry-${index}`} placeholder={t("rabiesNumberPlaceholder")} {...form.register(`pets.${index}.rabiesRegistry`)} className="border-3 border-black bg-white rounded-xl text-sm h-10 focus-visible:ring-0 placeholder-slate-400 font-bold tracking-widest uppercase text-neutral-900" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-rose-500/10 border-2 border-rose-500 text-rose-600 p-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider leading-relaxed flex items-start gap-2 mt-2">
                                                                                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                                                                                <span>{t("rabiesRequired")}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Add Pet Button */}
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                append({ name: "", breed: "", weight: undefined as any, age: "", rabiesVaccinated: false, rabiesRegistry: "" });
                                                setExpandedPetIndex(fields.length);
                                            }}
                                            className="w-full bg-amber-400 hover:bg-amber-500 text-neutral-900 font-black h-12 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 uppercase text-xs"
                                        >
                                            <PlusCircle className="h-4.5 w-4.5" /> {locale === "es" ? "Añadir otra mascota" : "Add another pet"}
                                        </Button>

                                        {/* Actions buttons */}
                                        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t-3 border-black">
                                            <Button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="w-full sm:w-auto bg-slate-100 text-black hover:bg-slate-200 font-black h-12 px-6 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <ChevronLeft className="h-4 w-4 shrink-0" /> {locale === "es" ? "Anterior" : "Back"}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleNextStep2}
                                                className="w-full sm:w-auto bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-white font-black h-12 px-8 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                {locale === "es" ? "Siguiente" : "Next"} <ChevronRight className="ml-1.5 h-4 w-4 shrink-0 inline" />
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
                                                <Scissors className="h-5 w-5 text-[#06B6D4]" /> {locale === "es" ? "3. Elige los Servicios para tus Perros" : "3. Choose Services for Your Dogs"}
                                            </h3>
                                        </div>

                                        <div className="space-y-8">
                                            {fields.map((field, petIdx) => {
                                                const petName = form.watch(`pets.${petIdx}.name`) || `Perro #${petIdx + 1}`;
                                                const servicesForPet = petServices[petIdx] || { mainGrooming: "", addons: [], shampoo: "" };

                                                const setMainGroomingForPet = (id: string) => {
                                                    setPetServices(prev => ({
                                                        ...prev,
                                                        [petIdx]: {
                                                            ...prev[petIdx],
                                                            mainGrooming: id
                                                        }
                                                    }));
                                                };

                                                const toggleAddonForPet = (id: string) => {
                                                    setPetServices(prev => {
                                                        const currentAddons = prev[petIdx]?.addons || [];
                                                        const newAddons = currentAddons.includes(id)
                                                            ? currentAddons.filter(x => x !== id)
                                                            : [...currentAddons, id];
                                                        return {
                                                            ...prev,
                                                            [petIdx]: {
                                                                ...prev[petIdx],
                                                                addons: newAddons
                                                            }
                                                        };
                                                    });
                                                };

                                                const setShampooForPet = (id: string) => {
                                                    setPetServices(prev => ({
                                                        ...prev,
                                                        [petIdx]: {
                                                            ...prev[petIdx],
                                                            shampoo: id
                                                        }
                                                    }));
                                                };

                                                return (
                                                    <div key={field.id} className="border-4 border-black p-5 rounded-2xl bg-white space-y-4 shadow-[4px_4px_0_0_#000]">
                                                        <div className="border-b-2 border-black/10 pb-2">
                                                            <h4 className="font-black text-sm uppercase tracking-widest text-[#06B6D4] flex items-center gap-2">
                                                                <Dog className="h-4 w-4 text-[#06B6D4] shrink-0" /> {locale === "es" ? "Servicios para:" : "Services for:"} {petName}
                                                            </h4>
                                                        </div>

                                                        {/* 1. Main Grooming Select */}
                                                        <div className="space-y-2">
                                                            <Label className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                                <Tag className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" /> {locale === "es" ? "Paquete de Grooming (Selecciona 1)" : "Grooming Package (Select 1)"}
                                                            </Label>
                                                            <div className="space-y-2">
                                                                {mainGroomings.map(s => {
                                                                    const name = activeLocale === "es" ? s.nameEs : s.nameEn;
                                                                    const isSelected = servicesForPet.mainGrooming === s.id;
                                                                    return (
                                                                        <div 
                                                                            key={s.id}
                                                                            onClick={() => setMainGroomingForPet(s.id)}
                                                                            className={cn(
                                                                                "border-3 rounded-xl p-3.5 min-h-[48px] flex justify-between items-center cursor-pointer transition-all select-none",
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
                                                                <Label className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                                    <Sparkles className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" /> {locale === "es" ? "Tratamientos Extras (Add-ons)" : "Extra Treatments (Add-ons)"}
                                                                </Label>
                                                                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                                                                    {addons.map(s => {
                                                                        const name = activeLocale === "es" ? s.nameEs : s.nameEn;
                                                                        const isChecked = (servicesForPet.addons || []).includes(s.id);
                                                                        return (
                                                                            <div 
                                                                                key={s.id}
                                                                                onClick={() => toggleAddonForPet(s.id)}
                                                                                className={cn(
                                                                                    "border-3 rounded-xl p-3.5 min-h-[48px] flex justify-between items-center cursor-pointer transition-all select-none",
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
                                                                <Label htmlFor={`special-shampoo-${petIdx}`} className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                                    <Sparkles className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" /> {locale === "es" ? "Champú Especial (Opcional)" : "Special Shampoo (Optional)"}
                                                                </Label>
                                                                <select
                                                                    id={`special-shampoo-${petIdx}`}
                                                                    title={locale === "es" ? "Champú Especial (Opcional)" : "Special Shampoo (Optional)"}
                                                                    value={servicesForPet.shampoo}
                                                                    onChange={(e) => setShampooForPet(e.target.value)}
                                                                    className="flex h-12 w-full rounded-xl border-3 border-black bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[3px_3px_0_0_#000] appearance-none font-bold text-slate-800"
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
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Optional Client Message */}
                                        <div className="space-y-1.5 pt-4 border-t-2 border-black/5">
                                            <Label htmlFor={`${uniqueId}-message`} className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                <MessageSquare className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" /> {locale === "es" ? "Mensaje o Nota Opcional" : "Optional Message or Note"}
                                            </Label>
                                            <Textarea 
                                                id={`${uniqueId}-message`} 
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
                                                    id={`${uniqueId}-legalAccepted`}
                                                    className="h-5 w-5 accent-[#06B6D4] border-3 border-black rounded cursor-pointer mt-0.5 shrink-0"
                                                    {...form.register("legalAccepted")}
                                                />
                                                <Label htmlFor={`${uniqueId}-legalAccepted`} className="text-[10px] font-semibold text-slate-650 leading-relaxed uppercase select-none cursor-pointer flex items-start gap-1.5">
                                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                    <span>
                                                        {locale === "es" 
                                                            ? "Declaro que la vacuna de la rabia está al día según la ley de Florida y acepto que el precio es un estimado provisional sujeto a reajuste tras inspección física por nudos o conducta de la mascota."
                                                            : "I declare that the rabies vaccine is active under Florida law and accept that this price is a provisional estimate subject to final physical check (due to matting or dog temperament)."}
                                                    </span>
                                                </Label>
                                            </div>
                                            {form.formState.errors.legalAccepted && (
                                                <p className="text-[10px] font-black text-rose-500 uppercase">{form.formState.errors.legalAccepted.message}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t-3 border-black">
                                            <Button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                className="w-full sm:w-auto bg-slate-100 text-black hover:bg-slate-200 font-black h-12 px-6 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <ChevronLeft className="h-4 w-4 shrink-0" /> {locale === "es" ? "Anterior" : "Back"}
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isPending || !form.watch("legalAccepted") || petsList.some(pet => !pet.name || !pet.breed || !pet.weight || !pet.age || !pet.rabiesVaccinated)}
                                                className="w-full sm:w-auto bg-[#2ECC71] text-neutral-900 hover:bg-[#2ECC71]/90 font-black h-12 px-8 rounded-xl border-3 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                                            >
                                                {isPending ? tIndex("sending", { defaultMessage: "Enviando..." }) : t("submit")}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Sticky Resumen de Cotización (Ocupa 5/12) */}
                    <div className="hidden md:block md:col-span-5 md:sticky md:top-24">
                        {renderSummaryCard(false)}
                    </div>
                </form>

                {/* PORTABLE FLOATING BOTTOM BAR FOR MOBILE LAYOUT */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black p-4 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.15)] md:hidden select-none">
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
                                className="bg-[#06B6D4] text-white font-black h-10 px-5 rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] text-xs uppercase flex items-center justify-center gap-1.5"
                            >
                                {locale === "es" ? "Siguiente" : "Next"} <ChevronRight className="h-3.5 w-3.5 shrink-0 inline" />
                            </Button>
                        ) : (
                            <Button 
                                type="button"
                                onClick={() => {
                                    const element = document.getElementById("legalAccepted");
                                    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
                                    toast.info(locale === "es" ? "Acepte los términos y haga clic en Enviar" : "Accept terms and click Submit");
                                }}
                                className="bg-[#2ECC71] text-neutral-900 font-black h-10 px-5 rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000] text-xs uppercase flex items-center justify-center gap-1.5"
                            >
                                {locale === "es" ? "Confirmar" : "Confirm"} <Check className="h-3.5 w-3.5 shrink-0 inline" />
                            </Button>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
}
