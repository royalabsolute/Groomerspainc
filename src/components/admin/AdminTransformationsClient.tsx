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
        if (!confirm("¿Estás seguro de eliminar esta transformación?")) return;
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
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminHeader
                    title="Transformaciones Antes & Después"
                    subtitle="Gestiona las fotos de los resultados de tus trabajos."
                    action={
                        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            Nueva Transformación
                        </Button>
                    }
                />

                {!pageEnabled && (
                    <Card className="bg-amber-50 border-amber-200 p-4">
                        <div className="flex items-center gap-3 text-amber-800">
                            <EyeOff className="h-5 w-5" />
                            <div>
                                <p className="font-bold">Página deshabilitada</p>
                                <p className="text-sm">La página pública de transformaciones está oculta. Actívala en la Configuración General.</p>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.length === 0 ? (
                        <Card className="col-span-full border-dashed border-2 py-20 flex flex-col items-center opacity-50">
                            <Sparkles className="h-12 w-12 mb-4" />
                            <p className="font-bold text-xl">No hay transformaciones aún</p>
                            <p className="text-sm">Empieza subiendo el Antes y Después de un perrito.</p>
                        </Card>
                    ) : (
                        items.map((item) => (
                            <Card key={item.id} className="overflow-hidden border-border/40 hover:shadow-xl transition-all duration-300 relative group">
                                <div className="grid grid-cols-2 gap-px bg-muted">
                                    <div className="relative aspect-square">
                                        <Image src={item.beforeImageUrl} alt="Antes" fill unoptimized className="object-cover" />
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Antes</div>
                                    </div>
                                    <div className="relative aspect-square">
                                        <Image src={item.afterImageUrl} alt="Después" fill unoptimized className="object-cover" />
                                        <div className="absolute top-2 right-2 bg-primary/80 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Después</div>
                                    </div>
                                </div>
                                
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-sm tracking-tight">{item.titleEs}</h3>
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => handleToggleVisible(item.id, item.visible)}>
                                                {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(item)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
                            // Simple refresh approach - in a real app might use router.refresh()
                            window.location.reload();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
