import AdminHeader from "@/components/admin/AdminHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import db from "@/lib/db";

export default async function AdminConfigPage() {
    const config = await db.siteConfig.findUnique({
        where: { id: "config" }
    });

    return (
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-4xl mx-auto">
                <AdminHeader
                    title="Configuración del Sitio"
                    subtitle="Gestiona la información de contacto, textos principales y redes sociales de tu negocio."
                />

                <SettingsForm initialData={config} />
            </div>
        </div>
    );
}
