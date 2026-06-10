"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Eye, EyeOff, Calendar, Sparkles, Footprints } from "lucide-react";
import TransformationForm from "@/components/admin/TransformationForm";
import { deleteTransformation, toggleTransformationVisible } from "@/lib/actions/transformations";
import { toast } from "sonner";
import Image from "next/image";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface Transformation {
    id: string;
    petName: string;
    breed: string;
    age: string;
    serviceDate: Date | string;
    beforePhotoUrl: string;
    afterPhotoUrl: string;
    contractImage?: string;
    descriptionEs: string;
    descriptionEn: string;
    visible: boolean;
}

interface AdminTransformationsClientProps {
    initialItems: any[];
    pageEnabled: boolean;
}

export default function AdminTransformationsClient({ initialItems, pageEnabled }: AdminTransformationsClientProps) {
    const [items, setItems] = useState<Transformation[]>(initialItems);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Transformation | undefined>(undefined);

    const handleToggleVisible = async (id: string, currentVisible: boolean) => {
        const result = await toggleTransformationVisible(id, !currentVisible);
        if (result.success) {
            setItems(items.map(item => 
                item.id === id ? { ...item, visible: !currentVisible } : item
            ));
            toast.success("Visibilidad de transformación actualizada");
        }
    };

    const handleDelete = async (id: string) => {
        const result = await deleteTransformation(id);
        if (result.success) {
            setItems(items.filter(item => item.id !== id));
            toast.success("Transformación eliminada correctamente");
        }
    };

    const handleEdit = (item: Transformation) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Antes & Después"
                    subtitle="Gestiona el catálogo de transformaciones de mascotas"
                    action={
                        <Button 
                            onClick={() => { setEditingItem(undefined); setIsFormOpen(true); }} 
                            className="rounded-xl bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 font-black h-11 px-6 shadow-lg gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                        >
                            <Plus className="h-4.5 w-4.5" />
                            Nueva Transformación
                        </Button>
                    }
                />

                {!pageEnabled && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-400">
                        <EyeOff className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Página deshabilitada</p>
                            <p className="text-xs">La sección pública de transformaciones está oculta actualmente en la configuración del sitio.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.length === 0 ? (
                        <div className="col-span-full">
                            <div className="border-2 border-dashed border-[#3A3A3A] bg-[#1A1A1A] py-24 flex flex-col items-center rounded-2xl shadow-xl">
                                <Sparkles className="h-12 w-12 text-[#3A3A3A] mb-4" />
                                <p className="font-bold text-white">No hay transformaciones aún</p>
                                <p className="text-sm text-slate-500 mt-1">Sube tu primer trabajo para mostrarlo en la web.</p>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => (
                            <Card key={item.id} className="overflow-hidden border-[#3A3A3A] hover:border-[#7C3AED]/40 shadow-xl transition-all duration-300 rounded-2xl group bg-[#1A1A1A]">
                                {/* Photos Comparison */}
                                <div className="grid grid-cols-2 gap-px bg-[#252525] border-b border-[#3A3A3A]">
                                    <div className="relative aspect-square overflow-hidden bg-black/20">
                                        <Image src={item.beforePhotoUrl} alt="Antes" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">Antes</div>
                                    </div>
                                    <div className="relative aspect-square overflow-hidden bg-black/20">
                                        <Image src={item.afterPhotoUrl} alt="Después" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute bottom-2.5 right-2.5 bg-[#7C3AED]/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">Después</div>
                                    </div>
                                </div>
                                
                                <CardContent className="p-5 space-y-4">
                                    {/* Header & Date */}
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 text-[#7C3AED]">
                                                <Footprints className="h-4.5 w-4.5 shrink-0" />
                                                <h3 className="font-black text-white text-base leading-tight truncate group-hover:text-[#7C3AED] transition-colors" title={item.petName}>
                                                    {item.petName}
                                                </h3>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 mt-1 truncate">
                                                {item.breed} • {item.age}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 text-[10px] font-black bg-[#252525] border border-[#3A3A3A] px-2 py-1 rounded-lg text-slate-400">
                                            <Calendar className="h-3 w-3 text-[#7C3AED]" />
                                            {typeof item.serviceDate === "string" 
                                                ? item.serviceDate.split("T")[0] 
                                                : new Date(item.serviceDate).toISOString().split("T")[0]
                                            }
                                        </div>
                                    </div>

                                    {/* Description Snippet Block */}
                                    <div className="bg-[#222] border border-[#2A2A2A] rounded-xl p-3 space-y-2 text-xs leading-relaxed">
                                        <div className="line-clamp-2 text-slate-300">
                                            <span className="inline-block mr-1">🇪🇸</span> {item.descriptionEs || <span className="italic text-slate-600">Sin descripción en español</span>}
                                        </div>
                                        <div className="line-clamp-2 text-slate-400 border-t border-[#333] pt-1.5">
                                            <span className="inline-block mr-1">🇺🇸</span> {item.descriptionEn || <span className="italic text-slate-600">Sin descripción en inglés</span>}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between pt-2 border-t border-[#3A3A3A]/40">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                item.visible 
                                                    ? "bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/20" 
                                                    : "bg-rose-500/15 text-rose-500 border border-rose-500/20"
                                            }`}>
                                                {item.visible ? "Visible" : "Oculto"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8.5 w-8.5 p-0 rounded-xl text-slate-400 hover:text-white hover:bg-[#252525] border border-[#3A3A3A] cursor-pointer" 
                                                onClick={() => handleToggleVisible(item.id, item.visible)}
                                                title={item.visible ? "Ocultar de la web" : "Mostrar en la web"}
                                            >
                                                {item.visible ? <Eye className="h-4 w-4 text-[#2ECC71]" /> : <EyeOff className="h-4 w-4 text-rose-500" />}
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8.5 w-8.5 p-0 rounded-xl text-slate-400 hover:text-white hover:bg-[#252525] border border-[#3A3A3A] cursor-pointer" 
                                                onClick={() => handleEdit(item)}
                                                title="Editar"
                                            >
                                                <Edit2 className="h-4 w-4 text-[#7C3AED]" />
                                            </Button>
                                            <ConfirmDeleteModal 
                                                onConfirm={() => handleDelete(item.id)}
                                                trigger={
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-8.5 w-8.5 p-0 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-950/20 border border-[#3A3A3A] cursor-pointer"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {isFormOpen && (
                    <TransformationForm
                        initial={editingItem}
                        onClose={() => setIsFormOpen(false)}
                        onSaved={async () => {
                            window.location.reload();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
