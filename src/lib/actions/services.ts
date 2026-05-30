"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createService(data: {
    id?: string;
    nameEs: string;
    nameEn: string;
    category: "MAIN_GROOMING" | "ADDON_TREATMENT" | "SPECIAL_SHAMPOO";
    basePrice: number;
    isActive: boolean;
}) {
    try {
        const service = await (db as any).serviceItem.upsert({
            where: { id: data.id || "new-temp-id" },
            update: {
                nameEs: data.nameEs,
                nameEn: data.nameEn,
                category: data.category,
                basePrice: data.basePrice,
                isActive: data.isActive,
            },
            create: {
                nameEs: data.nameEs,
                nameEn: data.nameEn,
                category: data.category,
                basePrice: data.basePrice,
                isActive: data.isActive,
            }
        });
        
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        revalidatePath("/admin/services");
        revalidatePath("/admin/servicios");
        
        return { success: true, serviceId: service.id };
    } catch (error) {
        console.error("Error saving service item:", error);
        return { success: false, error: "Failed to save service" };
    }
}

export async function deleteService(id: string) {
    try {
        await (db as any).serviceItem.delete({
            where: { id }
        });
        
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        revalidatePath("/admin/services");
        revalidatePath("/admin/servicios");

        return { success: true };
    } catch (error) {
        console.error("Error deleting service item:", error);
        return { success: false, error: "Failed to delete service" };
    }
}

export async function toggleServiceStatus(id: string, active: boolean) {
    try {
        await (db as any).serviceItem.update({
            where: { id },
            data: { isActive: active }
        });
        
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        revalidatePath("/admin/services");
        revalidatePath("/admin/servicios");

        return { success: true };
    } catch (error) {
        console.error("Error toggling service status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
