"use client";

import { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Eye, EyeOff, Calendar, Sparkles } from "lucide-react";
import TransformationForm from "@/components/admin/TransformationForm";
import { deleteTransformation, toggleTransformationVisible } from "@/lib/actions/transformations";
import { toast } from "sonner";
import Image from "next/image";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface Transformation {
    id: string;
    titleEs: string;
    titleEn: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    date: Date;
    visible: boolean;
}

interface AdminTransformationsClientProps {
    initialItems: any[];
    pageEnabled: boolean;
}

export default function AdminTransformationsClient({ initialItems, pageEnabled }: AdminTransformationsClientProps) {
    const [items, setItems] = useState(initialItems);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

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

    const handleEdit = (item: any) => {
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
                            onClick={() => { setEditingItem(null); setIsFormOpen(true); }} 
                            className="rounded-xl bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 font-black h-11 px-6 shadow-lg gap-2 cursor-pointer"
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
                            <p className="text-xs">La sección pública de transformaciones está oculta actualmente.</p>
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
                                <div className="grid grid-cols-2 gap-px bg-[#252525] border-b border-[#3A3A3A]">
                                    <div className="relative aspect-square overflow-hidden">
                                        <Image src={item.beforeImageUrl} alt="Antes" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">Antes</div>
                                    </div>
                                    <div className="relative aspect-square overflow-hidden">
                                        <Image src={item.afterImageUrl} alt="Después" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2.5 right-2.5 bg-[#7C3AED]/85 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/10">Después</div>
                                    </div>
                                </div>
                                
                                <CardContent className="p-5">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="space-y-1 min-w-0 w-full sm:w-auto">
                                            <h3 className="font-black text-white leading-tight truncate text-sm sm:text-base group-hover:text-[#7C3AED] transition-colors" title={item.titleEs}>{item.titleEs}</h3>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" />
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
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
