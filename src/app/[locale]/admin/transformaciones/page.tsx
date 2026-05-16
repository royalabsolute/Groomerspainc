import db from "@/lib/db";
import AdminTransformationsClient from "@/components/admin/AdminTransformationsClient";

export default async function AdminTransformationsPage() {
    const transformations = await (db as any).transformation.findMany({
        orderBy: { date: 'desc' }
    });

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
