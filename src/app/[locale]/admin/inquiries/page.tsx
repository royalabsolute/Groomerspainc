import db from "@/lib/db";
import AdminInquiriesClient from "@/components/admin/AdminInquiriesClient";

export default async function AdminInquiriesPage() {
    const inquiries = await db.inquiry.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const codes = await (db as any).discountCode.findMany();

    return <AdminInquiriesClient initialItems={inquiries} initialCodes={codes} />;
}
