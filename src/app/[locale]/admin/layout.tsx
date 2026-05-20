import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeaderBar from "@/components/admin/AdminHeaderBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import SessionProviderWrapper from "@/components/admin/SessionProviderWrapper";

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const session = await auth();

    // Protection to ensure only authorized users access this layout
    const { locale } = await (params as any);
    if (!session) {
        redirect(`/${locale}/login-admin`);
    }

    const pendingInquiries = await db.inquiry.findMany({
        where: { status: 'PENDING', deleted: false } as any,
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const serializedInquiries = JSON.parse(JSON.stringify(pendingInquiries));

    return (
        <SessionProviderWrapper>
            <div className="admin-scope flex bg-[#121212] text-[#E0E0E0] h-screen w-full overflow-hidden">
                <AdminSidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <AdminHeaderBar user={session?.user} pendingInquiries={serializedInquiries} />
                    <main className="flex-1 overflow-y-auto pt-6 pb-24 lg:pt-8 lg:pb-8 px-4 md:px-8">
                        {children}
                    </main>
                </div>
            </div>
        </SessionProviderWrapper>
    );
}
