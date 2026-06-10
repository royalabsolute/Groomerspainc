import AdminHeader from "@/components/admin/AdminHeader";
import PersonalizationForm from "@/components/admin/PersonalizationForm";
import db from "@/lib/db";

export default async function AdminPersonalizationPage() {
    const config = await db.siteConfig.findUnique({
        where: { id: "config" }
    });

    return (
        <div className="h-full bg-transparent p-1 sm:p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <AdminHeader
                    title="Personalización"
                    subtitle="Gestiona el diseño, textos y visibilidad de la página de inicio"
                />

                <div className="max-h-[85vh] overflow-y-auto pr-2">
                    <PersonalizationForm initialData={config} />
                </div>
            </div>
        </div>
    );
}
