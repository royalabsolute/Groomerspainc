"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface ConfirmDeleteModalProps {
    onConfirm: () => Promise<void>;
    trigger: React.ReactNode;
    title?: string;
    description?: string;
}

export function ConfirmDeleteModal({ 
    onConfirm, 
    trigger, 
    title = "¿Estás seguro?", 
    description = "Esta acción no se puede deshacer. Se eliminará permanentemente la imagen."
}: ConfirmDeleteModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleConfirm = async () => {
        setIsPending(true);
        await onConfirm();
        setIsPending(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] border border-[#3A3A3A] bg-[#1A1A1A] shadow-2xl shadow-black/50 rounded-2xl p-6">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-rose-950/30 border border-rose-900/50 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-rose-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-center text-white">{title}</DialogTitle>
                    <DialogDescription className="text-center text-sm text-slate-400 font-medium">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 rounded-lg border-[#3A3A3A] bg-[#252525] text-slate-300 font-semibold h-10 hover:bg-[#3A3A3A] hover:text-white transition-all cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="flex-1 rounded-lg font-semibold h-10 bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-lg"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Eliminar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
