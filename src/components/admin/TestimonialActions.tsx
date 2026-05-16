"use client";

import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { approveTestimonial, deleteTestimonial } from "@/lib/actions/testimonials";
import { useState } from "react";
import { toast } from "sonner";

interface TestimonialActionsProps {
    id: string;
    approved: boolean;
}

export default function TestimonialActions({ id, approved }: TestimonialActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    async function handleDelete() {
        if (!confirm("¿Estás seguro de que quieres eliminar este testimonio?")) return;

        setIsDeleting(true);
        try {
            const result = await deleteTestimonial(id);
            if (result.success) {
                toast.success("Testimonio eliminado");
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleToggle() {
        setIsToggling(true);
        try {
            const result = await approveTestimonial(id, !approved);
            if (result.success) {
                toast.success(approved ? "Testimonio desaprobado" : "Testimonio aprobado");
            } else {
                toast.error("Error al actualizar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsToggling(false);
        }
    }

    return (
        <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-border/20 pt-4 md:pt-0 md:pl-6 shrink-0">
            <Button
                onClick={handleToggle}
                disabled={isToggling}
                variant={approved ? "outline" : "default"}
                className={approved ? "flex-1 rounded-full border-amber-200 text-amber-600 hover:bg-amber-50 h-10" : "flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 h-10"}
            >
                {isToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : approved ? (
                    <><XCircle className="h-4 w-4 mr-2" /> Desaprobar</>
                ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Aprobar</>
                )}
            </Button>
            <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="ghost"
                className="flex-1 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 h-10"
            >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Eliminar
            </Button>
        </div>
    );
}
