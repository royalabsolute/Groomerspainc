"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function approveTestimonial(id: string, approved: boolean) {
    try {
        await db.testimonial.update({
            where: { id },
            data: { approved }
        });
        revalidatePath("/admin/testimonials");
        revalidatePath("/[locale]", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error approving testimonial:", error);
        return { success: false, error: "Failed to update testimonial" };
    }
}

export async function deleteTestimonial(id: string) {
    try {
        await db.testimonial.delete({
            where: { id }
        });
        revalidatePath("/admin/testimonials");
        revalidatePath("/[locale]", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        return { success: false, error: "Failed to delete testimonial" };
    }
}

export async function submitTestimonial(data: { clientName: string; messageEs: string; rating: number }) {
    try {
        const testimonial = await db.testimonial.create({
            data: {
                ...data,
                approved: false // New testimonials require approval
            }
        });
        revalidatePath("/admin/testimonials");
        return { success: true, testimonial };
    } catch (error) {
        console.error("Error submitting testimonial:", error);
        return { success: false, error: "Failed to submit testimonial" };
    }
}
