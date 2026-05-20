import AdminHeader from "@/components/admin/AdminHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import db from "@/lib/db";

export default async function AdminConfigPage() {
    const config = await db.siteConfig.findUnique({
        where: { id: "config" }
    });

    return (
        <div className="h-full bg-transparent p-1 sm:p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <AdminHeader
                    title="Configuración"
                    subtitle="Gestiona la información global de la plataforma"
                />

                <div className="max-h-[85vh] overflow-y-auto pr-2">
                    <SettingsForm initialData={config} />
                </div>
            </div>
        </div>
    );
}
