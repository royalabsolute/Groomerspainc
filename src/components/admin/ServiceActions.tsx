"use client";

import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { deleteService, toggleServiceStatus } from "@/lib/actions/services";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/navigation";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ServiceActionsProps {
    id: string;
    active: boolean;
}

export default function ServiceActions({ id, active }: ServiceActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const result = await deleteService(id);
            if (result.success) {
                toast.success("Servicio eliminado");
                setShowDeleteDialog(false);
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
        <div className="flex flex-col space-y-2">
            <div className="flex space-x-1">
                <Link href={`/admin/services/${id}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </Link>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Estás seguro de eliminar este servicio?</DialogTitle>
                            <DialogDescription>
                                Esta acción no se puede deshacer. El servicio dejará de estar disponible para los clientes.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Eliminar Servicio
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Button
                onClick={handleToggle}
                disabled={isToggling}
                variant="ghost"
                size="sm"
                className="mt-4 px-0 justify-end text-muted-foreground hover:text-primary hover:bg-transparent"
            >
                {active ? (
                    <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        {isToggling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />} Activo
                    </span>
                ) : (
                    <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                        {isToggling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <EyeOff className="h-3 w-3 mr-1" />} Oculto
                    </span>
                )}
            </Button>
        </div>
    );
}
