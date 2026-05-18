import AdminHeader from "@/components/admin/AdminHeader";
import db from "@/lib/db";
import DashboardContent from "@/components/admin/DashboardContent";

export default async function AdminDashboard() {
    // Fetch real stats
    const [servicesCount, galleryCount, inquiriesCount, transactions, allInquiries] = await Promise.all([
        db.service.count(),
        db.galleryItem.count(),
        db.inquiry.count({ where: { status: 'PENDING' } }),
        (db as any).transaction.findMany({
            orderBy: { date: 'asc' }
        }),
        db.inquiry.findMany({
            orderBy: { createdAt: 'asc' }
        })
    ]);

    let totalEarnings = 0;
    let totalExpenses = 0;
    transactions.forEach((t: any) => {
        const amount = Number(t.amount);
        if (t.type === "INCOME") totalEarnings += amount;
        else if (t.type === "EXPENSE") totalExpenses += amount;
    });
    const netBalance = totalEarnings - totalExpenses;

    // Real dynamic monthly income calculation (last 6 months)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            monthName: months[d.getMonth()],
            income: 0,
        };
    }).reverse();

    transactions.forEach((t: any) => {
        if (t.type === "INCOME") {
            const date = new Date(t.date);
            const m = date.getMonth();
            const y = date.getFullYear();
            const match = last6Months.find(lm => lm.monthIndex === m && lm.year === y);
            if (match) {
                match.income += Number(t.amount);
            }
        }
    });

    const maxIncome = Math.max(...last6Months.map(m => m.income), 100);
    const monthlyIncomeData = last6Months.map(m => ({
        month: m.monthName,
        income: Math.round(m.income),
        height: `${Math.round((m.income / maxIncome) * 100)}%`
    }));

    // Real weekly booking trend calculation (last 6 days)
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const last6Days = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
            dayIndex: d.getDay(),
            dayName: days[d.getDay()],
            count: 0,
        };
    }).reverse();

    allInquiries.forEach((inq) => {
        const date = new Date(inq.createdAt);
        const diffTime = Math.abs(new Date().getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            const day = date.getDay();
            const match = last6Days.find(d => d.dayIndex === day);
            if (match) {
                match.count += 1;
            }
        }
    });

    const maxCount = Math.max(...last6Days.map(d => d.count), 5);
    const appointmentTrendData = last6Days.map(d => ({
        day: d.dayName,
        count: d.count,
        height: `${Math.round((d.count / maxCount) * 100)}%`
    }));

    const stats = {
        services: servicesCount,
        gallery: galleryCount,
        inquiries: inquiriesCount,
        netBalance,
        totalEarnings,
        monthlyIncome: monthlyIncomeData,
        appointmentTrend: appointmentTrendData
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8">
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
