import AdminHeader from "@/components/admin/AdminHeader";
import db from "@/lib/db";
import DashboardContent from "@/components/admin/DashboardContent";

export default async function AdminDashboard() {
    // Fetch real stats
    const [servicesCount, galleryCount, inquiriesCount, transactions] = await Promise.all([
        db.service.count(),
        db.galleryItem.count(),
        db.inquiry.count({ where: { status: 'PENDING' } }),
        (db as any).transaction.findMany(),
    ]);

    let totalEarnings = 0;
    let totalExpenses = 0;
    transactions.forEach((t: any) => {
        const amount = Number(t.amount);
        if (t.type === "INCOME") totalEarnings += amount;
        else if (t.type === "EXPENSE") totalExpenses += amount;
    });
    const netBalance = totalEarnings - totalExpenses;

    const stats = {
        services: servicesCount,
        gallery: galleryCount,
        inquiries: inquiriesCount,
        netBalance,
        totalEarnings,
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                <AdminHeader
                    title="Panel de Control"
                    subtitle="Vista general del estado de GroomingPet"
                />

                <DashboardContent stats={stats as any} />
            </div>
        </div>
    );
}
