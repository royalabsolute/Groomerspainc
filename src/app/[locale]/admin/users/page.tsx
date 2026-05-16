import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersClient from "./AdminUsersClient";
import db from "@/lib/db";

export default async function AdminUsersPage() {
    const users = await db.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <AdminHeader title="Gestión de Usuarios" subtitle="Administra los accesos al panel" />
            <main className="container max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
                <AdminUsersClient initialUsers={users} />
            </main>
        </div>
    );
}
