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
            toast.success("Visibilidad actualizada");
        }
    };

    const handleDelete = async (id: string) => {
        const result = await deleteTransformation(id);
        if (result.success) {
            setItems(items.filter(item => item.id !== id));
            toast.success("Eliminado correctamente");
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminHeader
                    title="Antes & Después"
                    subtitle="Gestiona el catálogo de transformaciones realizadas"
                    action={
                        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="rounded-lg gap-2 shadow-sm h-11 px-6 font-semibold">
                            <Plus className="h-4 w-4" />
                            Nueva Transformación
                        </Button>
                    }
                />

                {!pageEnabled && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800">
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
                            <div className="border-2 border-dashed border-slate-200 bg-white py-24 flex flex-col items-center rounded-xl">
                                <Sparkles className="h-12 w-12 text-slate-200 mb-4" />
                                <p className="font-semibold text-slate-900">No hay transformaciones aún</p>
                                <p className="text-sm text-slate-400">Sube tu primer trabajo para mostrarlo.</p>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => (
                            <Card key={item.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl group bg-white">
                                <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100">
                                    <div className="relative aspect-square">
                                        <Image src={item.beforeImageUrl} alt="Antes" fill unoptimized className="object-cover" />
                                        <div className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Antes</div>
                                    </div>
                                    <div className="relative aspect-square">
                                        <Image src={item.afterImageUrl} alt="Después" fill unoptimized className="object-cover" />
                                        <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Después</div>
                                    </div>
                                </div>
                                
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-900 leading-tight">{item.titleEs}</h3>
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => handleToggleVisible(item.id, item.visible)}>
                                                {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-rose-500" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => handleEdit(item)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <ConfirmDeleteModal 
                                                onConfirm={() => handleDelete(item.id)}
                                                trigger={
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
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
