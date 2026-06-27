import AdminHeader from "@/components/admin/AdminHeader";
import db from "@/lib/db";
// @ts-ignore
import AdminFinanceClient from "./AdminFinanceClient";

export default async function AdminFinancePage() {
    // Fetch all transactions
    const transactions = await (db as any).transaction.findMany({
        orderBy: { date: "desc" }
    });

    // Format all decimals to numbers for client usage
    const serializedTransactions = transactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                <AdminHeader 
                    title="Control de Finanzas" 
                    subtitle="Gestión manual del balance general, ingresos y gastos de la plataforma" 
                />
                <AdminFinanceClient initialTransactions={serializedTransactions} />
            </div>
        </div>
    );
}
