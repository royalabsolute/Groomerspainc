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
            <DialogContent className="sm:max-w-[425px] border border-slate-200 shadow-lg rounded-2xl p-6">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-center text-slate-900">Validar Pago y Finalizar</DialogTitle>
                    <DialogDescription className="text-center text-sm text-slate-500 font-medium">
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
                                className="pl-9 h-11 border-slate-200 rounded-lg focus:ring-emerald-500/20"
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
                            className="h-11 border-slate-200 rounded-lg focus:ring-emerald-500/20"
                            placeholder="Ej: Servicio + extra, se aplicó cupón..."
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 rounded-lg border-slate-200 font-semibold h-11 hover:bg-slate-50 transition-all"
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
