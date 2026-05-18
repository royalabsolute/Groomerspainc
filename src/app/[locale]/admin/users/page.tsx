import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersClient from "./AdminUsersClient";
import db from "@/lib/db";

export default async function AdminUsersPage() {
    const users = await db.user.findMany({
        select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" }
    });

    const sanitizedUsers = users.map(user => JSON.parse(JSON.stringify(user)));

    return (
        <div className="min-h-screen bg-transparent p-1 sm:p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                <AdminHeader 
                    title="Gestión de Usuarios" 
                    subtitle="Administra los accesos al panel de control" 
                />
                <AdminUsersClient initialUsers={sanitizedUsers} />
            </div>
        </div>
    );
}
