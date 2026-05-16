import AdminSidebar from "@/components/admin/AdminSidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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

    return (
        <div className="flex bg-[#FDFCF8] min-h-screen">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
