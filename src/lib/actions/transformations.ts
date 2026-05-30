"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile } from "./upload";

// ─── READ ────────────────────────────────────────────────
export async function getAllTransformations() {
    return (db as any).transformation.findMany({ orderBy: { serviceDate: "desc" } });
}

export async function getPublicTransformations() {
    return (db as any).transformation.findMany({
        where: { visible: true },
        orderBy: { serviceDate: "desc" },
    });
}

// ─── CREATE ──────────────────────────────────────────────
export async function createTransformation(formData: FormData) {
    try {
        const petName = formData.get("petName") as string;
        const breed = formData.get("breed") as string;
        const ageRaw = formData.get("age") as string;
        const serviceDateStr = formData.get("serviceDate") as string;
        const technicalDescriptionEs = formData.get("descriptionEs") as string;
        const technicalDescriptionEn = formData.get("descriptionEn") as string;
        const visible = formData.get("visible") === "true";
        const beforeFile = formData.get("beforeImage") as File | null;
        const afterFile = formData.get("afterImage") as File | null;

        if (!petName || !breed || !ageRaw || !serviceDateStr || !technicalDescriptionEs || !technicalDescriptionEn || !beforeFile || !afterFile) {
            return { success: false, error: "Faltan campos requeridos." };
        }

        const parsedAge = parseInt(ageRaw, 10);
        const age = isNaN(parsedAge) ? null : parsedAge;

        // Upload before image
        const beforeFD = new FormData();
        beforeFD.append("file", beforeFile);
        const beforeResult = await uploadFile(beforeFD);
        if (!beforeResult.success) return { success: false, error: "Error al subir la imagen ANTES." };

        // Upload after image
        const afterFD = new FormData();
        afterFD.append("file", afterFile);
        const afterResult = await uploadFile(afterFD);
        if (!afterResult.success) return { success: false, error: "Error al subir la imagen DESPUÉS." };

        await (db as any).transformation.create({
            data: {
                petName,
                breed,
                age,
                serviceDate: new Date(serviceDateStr),
                visible,
                beforePhotoUrl: beforeResult.url!,
                afterPhotoUrl: afterResult.url!,
                technicalDescriptionEs,
                technicalDescriptionEn,
            },
        });

        revalidatePath("/admin/transformaciones");
        revalidatePath("/transformaciones");
        revalidatePath("/[locale]/transformaciones", "page");
        return { success: true };
    } catch (error) {
        console.error("createTransformation error:", error);
        return { success: false, error: "Error al crear la transformación." };
    }
}

// ─── UPDATE ──────────────────────────────────────────────
export async function updateTransformation(id: string, formData: FormData) {
    try {
        const petName = formData.get("petName") as string;
        const breed = formData.get("breed") as string;
        const ageRaw = formData.get("age") as string;
        const serviceDateStr = formData.get("serviceDate") as string;
        const technicalDescriptionEs = formData.get("descriptionEs") as string;
        const technicalDescriptionEn = formData.get("descriptionEn") as string;
        const visible = formData.get("visible") === "true";
        const beforeFile = formData.get("beforeImage") as File | null;
        const afterFile = formData.get("afterImage") as File | null;

        if (!petName || !breed || !ageRaw || !serviceDateStr || !technicalDescriptionEs || !technicalDescriptionEn) {
            return { success: false, error: "Faltan campos requeridos." };
        }

        const parsedAge = parseInt(ageRaw, 10);
        const age = isNaN(parsedAge) ? null : parsedAge;

        const existing = await (db as any).transformation.findUnique({ where: { id } });
        if (!existing) return { success: false, error: "No encontrado." };

        let beforePhotoUrl = existing.beforePhotoUrl;
        let afterPhotoUrl = existing.afterPhotoUrl;

        if (beforeFile && beforeFile.size > 0) {
            const fd = new FormData();
            fd.append("file", beforeFile);
            const r = await uploadFile(fd);
            if (r.success) beforePhotoUrl = r.url!;
        }

        if (afterFile && afterFile.size > 0) {
            const fd = new FormData();
            fd.append("file", afterFile);
            const r = await uploadFile(fd);
            if (r.success) afterPhotoUrl = r.url!;
        }

        await (db as any).transformation.update({
            where: { id },
            data: {
                petName,
                breed,
                age,
                serviceDate: new Date(serviceDateStr),
                visible,
                beforePhotoUrl,
                afterPhotoUrl,
                technicalDescriptionEs,
                technicalDescriptionEn,
            },
        });

        revalidatePath("/admin/transformaciones");
        revalidatePath("/transformaciones");
        revalidatePath("/[locale]/transformaciones", "page");
        return { success: true };
    } catch (error) {
        console.error("updateTransformation error:", error);
        return { success: false, error: "Error al actualizar." };
    }
}

// ─── DELETE ──────────────────────────────────────────────
export async function deleteTransformation(id: string) {
    try {
        await (db as any).transformation.delete({ where: { id } });
        revalidatePath("/admin/transformaciones");
        revalidatePath("/transformaciones");
        revalidatePath("/[locale]/transformaciones", "page");
        return { success: true };
    } catch (error) {
        console.error("deleteTransformation error:", error);
        return { success: false, error: "Error al eliminar." };
    }
}

// ─── TOGGLE VISIBILITY ───────────────────────────────────
export async function toggleTransformationVisible(id: string, visible: boolean) {
    try {
        await (db as any).transformation.update({ where: { id }, data: { visible } });
        revalidatePath("/admin/transformaciones");
        revalidatePath("/transformaciones");
        revalidatePath("/[locale]/transformaciones", "page");
        return { success: true };
    } catch (error) {
        console.error("toggleTransformationVisible error:", error);
        return { success: false, error: "Error al cambiar visibilidad." };
    }
}

// ─── TOGGLE PAGE ENABLED ─────────────────────────────────
export async function toggleTransformationsPage(enabled: boolean) {
    try {
        await (db as any).siteConfig.upsert({
            where: { id: "config" },
            create: { id: "config", transformationsEnabled: enabled },
            update: { transformationsEnabled: enabled },
        });
        revalidatePath("/");
        revalidatePath("/[locale]", "page");
        revalidatePath("/[locale]", "layout");
        return { success: true };
    } catch (error) {
        console.error("toggleTransformationsPage error:", error);
        return { success: false, error: "Error al cambiar estado de la página." };
    }
}
