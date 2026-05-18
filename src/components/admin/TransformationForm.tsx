"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Wand2, Upload, Save, X, ImageIcon } from "lucide-react";
import { createTransformation, updateTransformation } from "@/lib/actions/transformations";
import { translateText } from "@/lib/actions/translate";
import Image from "next/image";

interface Transformation {
    id?: string;
    titleEs: string;
    titleEn: string;
    beforeImageUrl?: string;
    afterImageUrl?: string;
    date: Date;
    visible: boolean;
}

interface TransformationFormProps {
    initial?: Transformation;
    onClose: () => void;
    onSaved: () => void;
}

export default function TransformationForm({ initial, onClose, onSaved }: TransformationFormProps) {
    const isEditing = !!initial?.id;
    const [isPending, startTransition] = useTransition();
    const [translating, setTranslating] = useState(false);

    const [titleEs, setTitleEs] = useState(initial?.titleEs ?? "");
    const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
    const [date, setDate] = useState(
        initial?.date
            ? new Date(initial.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
    );
    const [visible, setVisible] = useState(initial?.visible ?? true);
    const [beforeFile, setBeforeFile] = useState<File | null>(null);
    const [afterFile, setAfterFile] = useState<File | null>(null);
    const [beforePreview, setBeforePreview] = useState(initial?.beforeImageUrl ?? "");
    const [afterPreview, setAfterPreview] = useState(initial?.afterImageUrl ?? "");

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "before" | "after"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (type === "before") { setBeforeFile(file); setBeforePreview(url); }
        else { setAfterFile(file); setAfterPreview(url); }
    };

    const handleTranslate = async (direction: "esToEn" | "enToEs") => {
        setTranslating(true);
        try {
            if (direction === "esToEn" && titleEs) {
                const res = await translateText(titleEs, "es", "en");
                if (res.success) setTitleEn(res.text ?? "");
            } else if (direction === "enToEs" && titleEn) {
                const res = await translateText(titleEn, "en", "es");
                if (res.success) setTitleEs(res.text ?? "");
            }
            toast.success("Traducción aplicada ✔");
        } catch {
            toast.error("Error al traducir.");
        } finally {
            setTranslating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!titleEs || !titleEn) { toast.error("El título es obligatorio en ambos idiomas."); return; }
        if (!isEditing && (!beforeFile || !afterFile)) {
            toast.error("Debes subir ambas imágenes (Antes y Después)."); return;
        }

        startTransition(async () => {
            const fd = new FormData();
            fd.append("titleEs", titleEs);
            fd.append("titleEn", titleEn);
            fd.append("date", date);
            fd.append("visible", String(visible));
            if (beforeFile) fd.append("beforeImage", beforeFile);
            if (afterFile) fd.append("afterImage", afterFile);

            const result = isEditing
                ? await updateTransformation(initial!.id!, fd)
                : await createTransformation(fd);

            if (result.success) {
                toast.success(isEditing ? "Transformación actualizada ✔" : "Transformación creada ✔");
                onSaved();
                onClose();
            } else {
                toast.error(result.error ?? "Error al guardar.");
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
                            {isEditing ? "Editar Transformación" : "Nueva Transformación"}
                        </h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Sube las fotos de antes y después del grooming de la mascota.
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        title="Cerrar"
                        aria-label="Cerrar"
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#252525] text-slate-400 hover:text-white hover:bg-[#323232] transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Titles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">🇪🇸 Título en Español</Label>
                            <Input
                                value={titleEs}
                                onChange={(e) => setTitleEs(e.target.value)}
                                placeholder="Ej: Transformación de Luna"
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB] placeholder-slate-500"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1.5 text-[#00DDEB] hover:bg-[#252525] cursor-pointer"
                                onClick={() => handleTranslate("esToEn")}
                                disabled={translating || !titleEs}
                            >
                                <Wand2 className="h-3.5 w-3.5" />
                                Traducir al inglés →
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">🇺🇸 Title in English</Label>
                            <Input
                                value={titleEn}
                                onChange={(e) => setTitleEn(e.target.value)}
                                placeholder="e.g.: Luna's Transformation"
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB] placeholder-slate-500"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1.5 text-[#00DDEB] hover:bg-[#252525] cursor-pointer"
                                onClick={() => handleTranslate("enToEs")}
                                disabled={translating || !titleEn}
                            >
                                <Wand2 className="h-3.5 w-3.5" />
                                ← Traducir al español
                            </Button>
                        </div>
                    </div>

                    {/* Date & Visible */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">📅 Fecha</Label>
                            <Input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#00DDEB] focus:ring-[#00DDEB]"
                                required 
                            />
                        </div>
                        <div className="space-y-2 flex flex-col justify-end pb-1">
                            <Label className="font-bold text-slate-300">Visibilidad en la Web</Label>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={visible}
                                    onCheckedChange={setVisible}
                                    id="visible-switch"
                                />
                                <label htmlFor="visible-switch" className="text-sm font-semibold text-slate-300 cursor-pointer">
                                    {visible ? "✔ Visible en página" : "● Oculta"}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Image Uploaders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Before */}
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-300">📸 Foto ANTES</Label>
                            <label className="block cursor-pointer">
                                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-[#3A3A3A] hover:border-[#00DDEB]/50 transition-colors bg-[#252525]/40 flex items-center justify-center">
                                    {beforePreview ? (
                                        <Image src={beforePreview} alt="Antes" fill unoptimized className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <Upload className="h-8 w-8 text-[#00DDEB]" />
                                            <span className="text-sm font-bold">Subir imagen ANTES</span>
                                        </div>
                                    )}
                                    {beforePreview && (
                                        <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                                            ANTES
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
                            <Label className="font-bold text-slate-300">✨ Foto DESPUÉS</Label>
                            <label className="block cursor-pointer">
                                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-[#3A3A3A] hover:border-[#00DDEB]/50 transition-colors bg-[#252525]/40 flex items-center justify-center">
                                    {afterPreview ? (
                                        <Image src={afterPreview} alt="Después" fill unoptimized className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <ImageIcon className="h-8 w-8 text-[#00DDEB]" />
                                            <span className="text-sm font-bold">Subir imagen DESPUÉS</span>
                                        </div>
                                    )}
                                    {afterPreview && (
                                        <div className="absolute bottom-2.5 right-2.5 bg-[#00DDEB]/85 backdrop-blur-md text-black text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                                            DESPUÉS
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
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isPending} 
                            className="flex-1 rounded-xl bg-[#00DDEB] text-black hover:bg-[#00DDEB]/90 font-black shadow-lg gap-2 cursor-pointer"
                        >
                            <Save className="h-4 w-4" />
                            {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Crear Transformación"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
