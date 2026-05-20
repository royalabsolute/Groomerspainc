"use client";

import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Loader2, Copy, Check } from "lucide-react";
import { deleteGalleryItem } from "@/lib/actions/gallery";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface GalleryItemActionsProps {
    id: string;
    url: string;
}

export default function GalleryItemActions({ id, url }: GalleryItemActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("URL copiada al portapapeles");
        setTimeout(() => setCopied(false), 2000);
    };

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const result = await deleteGalleryItem(id);
            if (result.success) {
                toast.success("Imagen eliminada");
                router.refresh();
            } else {
                toast.error("Error al eliminar la imagen");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="absolute inset-0 bg-slate-900/20 lg:bg-slate-900/40 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200 flex items-center justify-center space-x-2 backdrop-blur-[1px]">
            {/* View Full */}
            <Button
                onClick={() => window.open(url, '_blank')}
                size="icon"
                variant="secondary"
                title="Ver imagen completa"
                className="h-9 w-9 rounded-lg bg-[#252525] hover:bg-[#3A3A3A] text-slate-400 hover:text-white border border-[#3A3A3A] shadow-sm cursor-pointer"
            >
                <ExternalLink className="h-4 w-4" />
            </Button>

            {/* Copy URL */}
            <Button
                onClick={copyToClipboard}
                size="icon"
                variant="secondary"
                title="Copiar URL"
                className="h-9 w-9 rounded-lg bg-[#252525] hover:bg-[#3A3A3A] text-slate-400 hover:text-white border border-[#3A3A3A] shadow-sm cursor-pointer"
            >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>

            {/* Delete */}
            <ConfirmDeleteModal
                onConfirm={handleDelete}
                trigger={
                    <Button
                        disabled={isDeleting}
                        size="icon"
                        variant="destructive"
                        title="Eliminar imagen"
                        className="h-9 w-9 rounded-lg bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                }
            />
        </div>
    );
}
