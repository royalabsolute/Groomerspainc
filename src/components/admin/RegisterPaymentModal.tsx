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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2, CreditCard } from "lucide-react";
import { useState } from "react";

interface RegisterPaymentModalProps {
    onConfirm: (amount: number, notes: string) => Promise<void>;
    trigger: React.ReactNode;
    defaultAmount?: number;
    defaultNotes?: string;
}

export function RegisterPaymentModal({ 
    onConfirm, 
    trigger,
    defaultAmount = 50,
    defaultNotes = "Servicio Pagado"
}: RegisterPaymentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [amount, setAmount] = useState<string>(defaultAmount.toString());
    const [notes, setNotes] = useState<string>(defaultNotes);

    const handleConfirm = async () => {
        setIsPending(true);
        const parsedAmount = parseFloat(amount) || 0;
        await onConfirm(parsedAmount, notes);
        setIsPending(false);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border border-[#3A3A3A] bg-[#1A1A1A] shadow-2xl shadow-black/50 rounded-2xl p-6">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-emerald-950/30 border border-emerald-900/50 rounded-full flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-emerald-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-center text-white">Validar Pago y Finalizar</DialogTitle>
                    <DialogDescription className="text-center text-sm text-slate-400 font-medium">
                        Ingresa el monto final recibido y las notas del servicio. Esto quedará registrado en finanzas.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Monto Recibido ($)
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-9 h-11 border-[#3A3A3A] bg-[#121212] text-white rounded-lg focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                                placeholder="Ej: 50.00"
                            />
                        </div>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Notas o Detalles (Opcional)
                        </Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="h-11 border-[#3A3A3A] bg-[#121212] text-white rounded-lg focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                            placeholder="Ej: Servicio + extra, se aplicó cupón..."
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 rounded-lg border-[#3A3A3A] bg-[#252525] text-slate-300 font-semibold h-11 hover:bg-[#3A3A3A] hover:text-white transition-all cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isPending || parseFloat(amount) < 0}
                        className="flex-1 rounded-lg font-semibold h-11 bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                    >
                        {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Cobrar y Finalizar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
