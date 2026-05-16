"use client";

import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { deleteService, toggleServiceStatus } from "@/lib/actions/services";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/navigation";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface ServiceActionsProps {
    id: string;
    active: boolean;
}

export default function ServiceActions({ id, active }: ServiceActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const result = await deleteService(id);
            if (result.success) {
                toast.success("Servicio eliminado");
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
            const result = await toggleServiceStatus(id, !active);
            if (result.success) {
                toast.success(active ? "Servicio ocultado" : "Servicio activado");
            } else {
                toast.error("Error al actualizar estado");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsToggling(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-1">
                <Link href={`/admin/services/${id}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </Link>
                
                <ConfirmDeleteModal 
                    onConfirm={handleDelete}
                    title="¿Eliminar servicio?"
                    description="Esta acción eliminará el paquete de servicios de forma permanente."
                    trigger={
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    }
                />
            </div>

            <button
                onClick={handleToggle}
                disabled={isToggling}
                className="transition-opacity hover:opacity-80 disabled:opacity-50"
            >
                {active ? (
                    <span className="flex items-center text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {isToggling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />} Visible
                    </span>
                ) : (
                    <span className="flex items-center text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {isToggling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <EyeOff className="h-3 w-3 mr-1" />} Oculto
                    </span>
                )}
            </button>
        </div>
    );
}
