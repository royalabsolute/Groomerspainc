import AdminHeader from "@/components/admin/AdminHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import db from "@/lib/db";

export default async function AdminConfigPage() {
    const config = await db.siteConfig.findUnique({
        where: { id: "config" }
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <AdminHeader
                    title="Configuración"
                    subtitle="Gestiona la información global de la plataforma"
                />

                <SettingsForm initialData={config} />
            </div>
        </div>
    );
}
