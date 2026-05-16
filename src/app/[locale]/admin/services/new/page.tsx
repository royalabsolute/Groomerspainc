import AdminHeader from "@/components/admin/AdminHeader";
import ServiceForm from "@/components/admin/ServiceForm";

export default function NewServicePage() {
    return (
        <div className="min-h-screen bg-muted/20 p-8">
            <div className="max-w-5xl mx-auto">
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
