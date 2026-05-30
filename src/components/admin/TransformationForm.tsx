"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Upload, Save, X, ImageIcon } from "lucide-react";
import { createTransformation, updateTransformation } from "@/lib/actions/transformations";
import { translateText } from "@/lib/actions/translate";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface Transformation {
    id?: string;
    petName: string;
    breed: string;
    age: string;
    serviceDate: Date | string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    descriptionEs: string;
    descriptionEn: string;
    visible: boolean;
}

interface TransformationFormProps {
    initial?: Transformation;
    onClose: () => void;
    onSaved: () => void;
}

export default function TransformationForm({ initial, onClose, onSaved }: TransformationFormProps) {
    const t = useTranslations("Transformations");
    const isEditing = !!initial?.id;
    const [isPending, startTransition] = useTransition();
    const [translatingEsToEn, setTranslatingEsToEn] = useState(false);
    const [translatingEnToEs, setTranslatingEnToEs] = useState(false);

    const [petName, setPetName] = useState(initial?.petName ?? "");
    const [breed, setBreed] = useState(initial?.breed ?? "");
    const [age, setAge] = useState(initial?.age ?? "");
    const [serviceDate, setServiceDate] = useState(
        initial?.serviceDate
            ? new Date(initial.serviceDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
    );
    const [visible, setVisible] = useState(initial?.visible ?? true);
    const [descriptionEs, setDescriptionEs] = useState(initial?.descriptionEs ?? "");
    const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? "");

    const [beforeFile, setBeforeFile] = useState<File | null>(null);
    const [afterFile, setAfterFile] = useState<File | null>(null);
    const [beforePreview, setBeforePreview] = useState(initial?.beforePhotoUrl ?? "");
    const [afterPreview, setAfterPreview] = useState(initial?.afterPhotoUrl ?? "");

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "before" | "after"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (type === "before") {
            setBeforeFile(file);
            setBeforePreview(url);
        } else {
            setAfterFile(file);
            setAfterPreview(url);
        }
    };

    const handleTranslate = async (direction: "esToEn" | "enToEs") => {
        if (direction === "esToEn") {
            if (!descriptionEs) return;
            setTranslatingEsToEn(true);
            try {
                const res = await translateText(descriptionEs, "es", "en");
                if (res.success) {
                    setDescriptionEn(res.text ?? "");
                    toast.success(t("translateToEn") + " ✔");
                } else {
                    toast.error(res.error ?? "Error al traducir");
                }
            } catch {
                toast.error("Error al traducir.");
            } finally {
                setTranslatingEsToEn(false);
            }
        } else {
            if (!descriptionEn) return;
            setTranslatingEnToEs(true);
            try {
                const res = await translateText(descriptionEn, "en", "es");
                if (res.success) {
                    setDescriptionEs(res.text ?? "");
                    toast.success(t("translateToEs") + " ✔");
                } else {
                    toast.error(res.error ?? "Error al traducir");
                }
            } catch {
                toast.error("Error al traducir.");
            } finally {
                setTranslatingEnToEs(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!petName || !breed || !age || !serviceDate || !descriptionEs || !descriptionEn) {
            toast.error(t("requiredFields"));
            return;
        }
        if (!isEditing && (!beforeFile || !afterFile)) {
            toast.error(t("errorImages"));
            return;
        }

        startTransition(async () => {
            const fd = new FormData();
            fd.append("petName", petName);
            fd.append("breed", breed);
            fd.append("age", age);
            fd.append("serviceDate", serviceDate);
            fd.append("descriptionEs", descriptionEs);
            fd.append("descriptionEn", descriptionEn);
            fd.append("visible", String(visible));
            if (beforeFile) fd.append("beforeImage", beforeFile);
            if (afterFile) fd.append("afterImage", afterFile);

            const result = isEditing
                ? await updateTransformation(initial!.id!, fd)
                : await createTransformation(fd);

            if (result.success) {
                toast.success(isEditing ? t("successUpdated") : t("successCreated"));
                onSaved();
                onClose();
            } else {
                toast.error(result.error ?? t("errorSaved"));
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#3A3A3A]/50">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">
                            {isEditing ? t("edit") : t("new")}
                        </h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {isEditing ? t("edit") : t("new")} - {t("adminSubtitle")}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        title={t("cancel")}
                        aria-label={t("cancel")}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#252525] text-slate-400 hover:text-white hover:bg-[#323232] transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Pet Details Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">{t("petName")}</Label>
                            <Input
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                placeholder={t("petNamePlaceholder")}
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">{t("breed")}</Label>
                            <Input
                                value={breed}
                                onChange={(e) => setBreed(e.target.value)}
                                placeholder={t("breedPlaceholder")}
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">{t("age")}</Label>
                            <Input
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder={t("agePlaceholder")}
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Date & Visibility */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">📅 {t("serviceDate")}</Label>
                            <Input 
                                type="date" 
                                value={serviceDate} 
                                onChange={(e) => setServiceDate(e.target.value)} 
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                required 
                            />
                        </div>
                        <div className="space-y-2 flex flex-col justify-end pb-1">
                            <Label className="font-bold text-slate-300">{t("visible")}</Label>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={visible}
                                    onCheckedChange={setVisible}
                                    id="visible-switch"
                                />
                                <label htmlFor="visible-switch" className="text-sm font-semibold text-slate-300 cursor-pointer">
                                    {visible ? `✔ ${t("visibleStatus")}` : `● ${t("hiddenStatus")}`}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Description - Bilingual Input */}
                    <div className="space-y-4">
                        <div className="space-y-2 relative">
                            <Label className="font-bold text-slate-300">🇪🇸 {t("descriptionEs")}</Label>
                            <Textarea
                                value={descriptionEs}
                                onChange={(e) => setDescriptionEs(e.target.value)}
                                placeholder={t("descPlaceholderEs")}
                                className="min-h-24 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500 leading-relaxed"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1.5 text-[#7C3AED] hover:bg-[#252525] cursor-pointer mt-1"
                                onClick={() => handleTranslate("esToEn")}
                                disabled={translatingEsToEn || !descriptionEs}
                            >
                                <Wand2 className="h-3.5 w-3.5" />
                                {translatingEsToEn ? t("updating") : `${t("translateToEn")} →`}
                            </Button>
                        </div>

                        <div className="space-y-2 relative">
                            <Label className="font-bold text-slate-300">🇺🇸 {t("descriptionEn")}</Label>
                            <Textarea
                                value={descriptionEn}
                                onChange={(e) => setDescriptionEn(e.target.value)}
                                placeholder={t("descPlaceholderEn")}
                                className="min-h-24 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED] placeholder-slate-500 leading-relaxed"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1.5 text-[#7C3AED] hover:bg-[#252525] cursor-pointer mt-1"
                                onClick={() => handleTranslate("enToEs")}
                                disabled={translatingEnToEs || !descriptionEn}
                            >
                                <Wand2 className="h-3.5 w-3.5" />
                                {translatingEnToEs ? t("updating") : `← ${t("translateToEs")}`}
                            </Button>
                        </div>
                    </div>

                    {/* Double Image Uploader */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Before */}
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">📸 {t("beforePhoto")}</Label>
                            <label className="block cursor-pointer">
                                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-[#3A3A3A] hover:border-[#7C3AED]/50 transition-colors bg-[#252525]/40 flex items-center justify-center">
                                    {beforePreview ? (
                                        <Image src={beforePreview} alt="Antes" fill unoptimized className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 p-4 text-center">
                                            <Upload className="h-8 w-8 text-[#7C3AED] mb-1" />
                                            <span className="text-sm font-bold block">{t("uploadBefore")}</span>
                                        </div>
                                    )}
                                    {beforePreview && (
                                        <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                                            {t("before")}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, "before")}
                                />
                            </label>
                        </div>

                        {/* After */}
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">✨ {t("afterPhoto")}</Label>
                            <label className="block cursor-pointer">
                                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-[#3A3A3A] hover:border-[#7C3AED]/50 transition-colors bg-[#252525]/40 flex items-center justify-center">
                                    {afterPreview ? (
                                        <Image src={afterPreview} alt="Después" fill unoptimized className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 p-4 text-center">
                                            <ImageIcon className="h-8 w-8 text-[#7C3AED] mb-1" />
                                            <span className="text-sm font-bold block">{t("uploadAfter")}</span>
                                        </div>
                                    )}
                                    {afterPreview && (
                                        <div className="absolute bottom-2.5 right-2.5 bg-[#7C3AED]/85 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                                            {t("after")}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, "after")}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1 rounded-xl border-[#3A3A3A] text-slate-300 bg-[#252525] hover:bg-[#2D2D2D] hover:text-white font-bold cursor-pointer" 
                            onClick={onClose}
                        >
                            {t("cancel")}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isPending} 
                            className="flex-1 rounded-xl bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 font-black shadow-lg gap-2 cursor-pointer"
                        >
                            <Save className="h-4 w-4" />
                            {isPending 
                                ? (isEditing ? t("updating") : t("creating"))
                                : (isEditing ? t("save") : t("new"))
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
