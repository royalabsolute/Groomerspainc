import db from "@/lib/db";
import AdminTransformationsClient from "@/components/admin/AdminTransformationsClient";

export default async function AdminTransformationsPage() {
    const raw = await (db as any).transformation.findMany({
        orderBy: { serviceDate: 'desc' }
    });

    const transformations = raw.map((t: any) => ({
        id: t.id,
        petName: t.petName,
        breed: t.breed,
        age: t.age !== null && t.age !== undefined ? String(t.age) : "",
        serviceDate: t.serviceDate.toISOString(),
        beforePhotoUrl: t.beforePhotoUrl,
        afterPhotoUrl: t.afterPhotoUrl,
        descriptionEs: t.technicalDescriptionEs,
        descriptionEn: t.technicalDescriptionEn,
        visible: t.visible,
    }));

    const config = await (db as any).siteConfig.findUnique({
        where: { id: "config" }
    });

    // Check if transformations page exists in config, otherwise default to false
    const transformationsEnabled = (config as any)?.transformationsEnabled ?? false;

    return (
        <AdminTransformationsClient 
            initialItems={transformations} 
            pageEnabled={transformationsEnabled} 
        />
    );
}
