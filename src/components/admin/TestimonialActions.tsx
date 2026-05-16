"use client";

import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { approveTestimonial, deleteTestimonial } from "@/lib/actions/testimonials";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { cn } from "@/lib/utils";

interface TestimonialActionsProps {
    id: string;
    approved: boolean;
}

export default function TestimonialActions({ id, approved }: TestimonialActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    async function handleDelete() {
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
        <div className="flex md:flex-col justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
            <Button
                onClick={handleToggle}
                disabled={isToggling}
                variant="ghost"
                className={cn(
                    "h-10 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all",
                    approved 
                        ? "text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100" 
                        : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100"
                )}
            >
                {isToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : approved ? (
                    <><XCircle className="h-3.5 w-3.5 mr-2" /> Ocultar</>
                ) : (
                    <><CheckCircle className="h-3.5 w-3.5 mr-2" /> Publicar</>
                )}
            </Button>
            
            <ConfirmDeleteModal 
                onConfirm={handleDelete}
                trigger={
                    <Button
                        disabled={isDeleting}
                        variant="ghost"
                        className="h-10 px-4 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-wider border border-transparent hover:border-rose-100"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />} Eliminar
                    </Button>
                }
            />
        </div>
    );
}
