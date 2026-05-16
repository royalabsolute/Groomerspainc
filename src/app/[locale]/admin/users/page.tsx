import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersClient from "./AdminUsersClient";
import db from "@/lib/db";

export default async function AdminUsersPage() {
    const users = await db.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <AdminHeader 
                    title="Gestión de Usuarios" 
                    subtitle="Administra los accesos al panel de control" 
                />
                <AdminUsersClient initialUsers={users} />
            </div>
        </div>
    );
}
