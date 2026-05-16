"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { events, EVENT_TOPICS } from "@/lib/events";

export async function addGalleryItem(url: string, type: "IMAGE" | "VIDEO" = "IMAGE") {
    try {
        const item = await db.galleryItem.create({
            data: {
                url,
                type,
                category: "GROOMING"
            }
        });
        revalidatePath("/admin/gallery");
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");
        
        // Push notification for browsers
        events.emit(EVENT_TOPICS.GALLERY_UPDATE);
        
        return { success: true, item };
    } catch (error) {
        console.error("Error adding gallery item:", error);
        return { success: false, error: "Failed to add item" };
    }
}

export async function deleteGalleryItem(id: string) {
    try {
        await db.galleryItem.delete({
            where: { id }
        });
        revalidatePath("/admin/gallery");
        revalidatePath("/");
        revalidatePath("/[locale]", "layout");
        revalidatePath("/[locale]", "page");

        // Push notification for browsers
        events.emit(EVENT_TOPICS.GALLERY_UPDATE);

        return { success: true };
    } catch (error) {
        console.error("Error deleting gallery item:", error);
        return { success: false, error: "Failed to delete item" };
    }
}
