import AdminHeader from "@/components/admin/AdminHeader";
import ServiceForm from "@/components/admin/ServiceForm";
import db from "@/lib/db";
import { notFound } from "next/navigation";

export default async function EditServicePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const service = await db.service.findUnique({
        where: { id }
    });

    if (!service) {
        notFound();
    }

    return (
        <div className="h-full bg-transparent p-4 md:p-8">
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <AdminHeader
                    title="Editar Servicio"
                    subtitle={`Modificando: ${service.titleEs}`}
                />

                <div className="mt-8">
                    <ServiceForm initialData={JSON.parse(JSON.stringify(service))} />
                </div>
            </div>
        </div>
    );
}
