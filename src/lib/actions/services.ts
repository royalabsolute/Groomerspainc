"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { events, EVENT_TOPICS } from "@/lib/events";

export async function createService(data: any) {
    try {
        const service = await db.service.upsert({
            where: { id: data.id || "new-temp-id" },
            update: {
                titleEs: data.titleEs,
                titleEn: data.titleEn,
                descEs: data.descEs,
                descEn: data.descEn,
                price: data.price,
                active: data.active,
                imageUrl: data.imageUrl,
                icon: data.icon,
                recommendedProducts: data.recommendedProducts,
            },
            create: {
                titleEs: data.titleEs,
                titleEn: data.titleEn,
                descEs: data.descEs,
                descEn: data.descEn,
                price: data.price,
                active: data.active,
                imageUrl: data.imageUrl,
                icon: data.icon,
                recommendedProducts: data.recommendedProducts,
            }
        });
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        revalidatePath("/[locale]/services", "page");
        revalidatePath("/admin/services");
        
        events.emit(EVENT_TOPICS.SERVICES_UPDATE);
        
        return { success: true, serviceId: service.id };
    } catch (error) {
        console.error("Error saving service:", error);
        return { success: false, error: "Failed to save service" };
    }
}

export async function deleteService(id: string) {
    try {
        await db.service.delete({
            where: { id }
        });
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        revalidatePath("/admin/services");

        events.emit(EVENT_TOPICS.SERVICES_UPDATE);

        return { success: true };
    } catch (error) {
        console.error("Error deleting service:", error);
        return { success: false, error: "Failed to delete service" };
    }
}

export async function toggleServiceStatus(id: string, active: boolean) {
    try {
        await db.service.update({
            where: { id },
            data: { active }
        });
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        revalidatePath("/admin/services");

        events.emit(EVENT_TOPICS.SERVICES_UPDATE);

        return { success: true };
    } catch (error) {
        console.error("Error toggling service status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
