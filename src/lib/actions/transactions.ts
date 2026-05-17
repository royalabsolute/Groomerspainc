"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTransaction(data: {
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    date?: string;
    invoiceUrl?: string | null;
}) {
    try {
        const dateObj = data.date ? new Date(data.date) : new Date();
        await (db as any).transaction.create({
            data: {
                type: data.type,
                amount: data.amount,
                description: data.description,
                date: dateObj,
                invoiceUrl: data.invoiceUrl || null,
            }
        });
        revalidatePath("/admin/finanzas");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error: "Error al crear el registro financiero" };
    }
}

export async function deleteTransaction(id: string) {
    try {
        await (db as any).transaction.delete({
            where: { id }
        });
        revalidatePath("/admin/finanzas");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return { success: false, error: "Error al eliminar el registro financiero" };
    }
}

export async function getFinancialSummary() {
    try {
        const transactions = await (db as any).transaction.findMany({
            orderBy: { date: "desc" }
        });

        let totalEarnings = 0;
        let totalExpenses = 0;

        transactions.forEach((t: any) => {
            const amountNum = Number(t.amount);
            if (t.type === "INCOME") {
                totalEarnings += amountNum;
            } else if (t.type === "EXPENSE") {
                totalExpenses += amountNum;
            }
        });

        const netBalance = totalEarnings - totalExpenses;

        return {
            success: true,
            transactions,
            summary: {
                totalEarnings,
                totalExpenses,
                netBalance
            }
        };
    } catch (error) {
        console.error("Error fetching financial summary:", error);
        return {
            success: false,
            transactions: [],
            summary: { totalEarnings: 0, totalExpenses: 0, netBalance: 0 }
        };
    }
}
