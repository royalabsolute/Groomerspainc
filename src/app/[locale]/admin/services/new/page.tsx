import AdminHeader from "@/components/admin/AdminHeader";
import ServiceForm from "@/components/admin/ServiceForm";

export default function NewServicePage() {
    return (
        <div className="h-full bg-transparent p-4 md:p-8">
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <AdminHeader
                    title="Añadir Nuevo Servicio"
                    subtitle="Completa el formulario para publicar un nuevo paquete de grooming."
                />

                <div className="mt-8">
                    <ServiceForm />
                </div>
            </div>
        </div>
    );
}
