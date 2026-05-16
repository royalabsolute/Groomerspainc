import AdminHeader from "@/components/admin/AdminHeader";
import db from "@/lib/db";
import DashboardContent from "@/components/admin/DashboardContent";

export default async function AdminDashboard() {
    // Fetch real stats
    const [servicesCount, galleryCount, inquiriesCount] = await Promise.all([
        db.service.count(),
        db.galleryItem.count(),
        db.inquiry.count({ where: { status: 'PENDING' } }),
    ]);

    const stats = {
        services: servicesCount,
        gallery: galleryCount,
        inquiries: inquiriesCount,
    };

    return (
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-7xl mx-auto space-y-10">
                <AdminHeader
                    title="Panel de Control"
                    subtitle="Vista general del estado de GroomingPet"
                />

                <DashboardContent stats={stats as any} />
            </div>
        </div>
    );
}
