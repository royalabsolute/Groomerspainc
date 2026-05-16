"use client";

import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, MailOpen, Loader2 } from "lucide-react";
import { markInquiryAsRead, deleteInquiry } from "@/lib/actions/inquiries";
import { useState } from "react";
import { toast } from "sonner";

interface InquiryActionsProps {
    id: string;
    read: boolean;
}

export default function InquiryActions({ id, read }: InquiryActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    async function handleDelete() {
        if (!confirm("¿Estás seguro de que quieres eliminar esta consulta?")) return;

        setIsDeleting(true);
        try {
            const result = await deleteInquiry(id);
            if (result.success) {
                toast.success("Consulta eliminada");
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleMarkRead() {
        if (read) return;
        setIsToggling(true);
        try {
            const result = await markInquiryAsRead(id, true);
            if (result.success) {
                toast.success("Mensaje marcado como leído");
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
        <div className="flex space-x-2">
            {!read && (
                <Button
                    onClick={handleMarkRead}
                    disabled={isToggling}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                >
                    {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailOpen className="h-4 w-4 mr-2" />} Leer
                </Button>
            )}
            <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50"
            >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    );
}
