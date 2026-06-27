import db from "@/lib/db";
import AdminCuponesClient from "@/components/admin/AdminCuponesClient";

export default async function AdminCuponesPage() {
    let codes = [];
    try {
        if ((db as any).discountCode) {
            codes = await (db as any).discountCode.findMany({
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Fallback to raw query if Prisma client is not updated
            codes = await (db as any).$queryRaw`SELECT * FROM DiscountCode ORDER BY createdAt DESC`;
        }
    } catch (e) {
        console.error("Error fetching coupons:", e);
        codes = [];
    }

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4">
            <div className="max-w-7xl mx-auto">
                <AdminCuponesClient initialCodes={codes} />
            </div>
        </div>
    );
}
