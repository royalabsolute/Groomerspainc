"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/actions/upload";

interface LocalImageUploadProps {
    onSuccess: (url: string) => void;
    label?: string;
}

export default function LocalImageUpload({ onSuccess, label }: LocalImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Por favor selecciona una imagen");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("La imagen es demasiado grande (máx 5MB)");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                onSuccess(result.url);
                toast.success("Imagen subida correctamente");
            } else {
                toast.error(result.error || "Error al subir la imagen");
            }
        } catch (error) {
            toast.error("Error de conexión al subir");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                className="hidden"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
                title="Seleccionar imagen"
            />
            <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-lg shadow-sm h-10 px-6 font-semibold"
            >
                {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Plus className="mr-2 h-4 w-4" />
                )}
                {label || "Subir Imagen"}
            </Button>
        </div>
    );
}
