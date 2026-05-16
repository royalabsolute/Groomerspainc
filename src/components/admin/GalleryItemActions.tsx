"use client";

import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Loader2 } from "lucide-react";
import { deleteGalleryItem } from "@/lib/actions/gallery";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GalleryItemActionsProps {
    id: string;
    url: string;
}

export default function GalleryItemActions({ id, url }: GalleryItemActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("¿Estás seguro de que quieres eliminar esta imagen?")) return;

        setIsDeleting(true);
        try {
            const result = await deleteGalleryItem(id);
            if (result.success) {
                toast.success("Imagen eliminada");
                router.refresh();
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
            <Button
                onClick={() => window.open(url, '_blank')}
                size="icon"
                variant="secondary"
                className="rounded-full h-10 w-10"
            >
                <ExternalLink className="h-5 w-5" />
            </Button>
            <Button
                onClick={handleDelete}
                disabled={isDeleting}
                size="icon"
                variant="destructive"
                className="rounded-full h-10 w-10"
            >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </Button>
        </div>
    );
}
