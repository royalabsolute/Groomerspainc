"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile } from "./upload";

// ─── READ ────────────────────────────────────────────────
export async function getAllTransformations() {
    return (db as any).transformation.findMany({ orderBy: { date: "desc" } });
}

export async function getPublicTransformations() {
    return (db as any).transformation.findMany({
        where: { visible: true },
        orderBy: { date: "desc" },
    });
}

// ─── CREATE ──────────────────────────────────────────────
export async function createTransformation(formData: FormData) {
    try {
        const titleEs = formData.get("titleEs") as string;
        const titleEn = formData.get("titleEn") as string;
        const dateStr = formData.get("date") as string;
        const visible = formData.get("visible") === "true";
        const beforeFile = formData.get("beforeImage") as File | null;
        const afterFile = formData.get("afterImage") as File | null;

        if (!titleEs || !titleEn || !beforeFile || !afterFile) {
            return { success: false, error: "Faltan campos requeridos." };
        }

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
                titleEs,
                titleEn,
                date: dateStr ? new Date(dateStr) : new Date(),
                visible,
                beforeImageUrl: beforeResult.url!,
                afterImageUrl: afterResult.url!,
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
        const titleEs = formData.get("titleEs") as string;
        const titleEn = formData.get("titleEn") as string;
        const dateStr = formData.get("date") as string;
        const visible = formData.get("visible") === "true";
        const beforeFile = formData.get("beforeImage") as File | null;
        const afterFile = formData.get("afterImage") as File | null;

        const existing = await (db as any).transformation.findUnique({ where: { id } });
        if (!existing) return { success: false, error: "No encontrado." };

        let beforeImageUrl = existing.beforeImageUrl;
        let afterImageUrl = existing.afterImageUrl;

        if (beforeFile && beforeFile.size > 0) {
            const fd = new FormData();
            fd.append("file", beforeFile);
            const r = await uploadFile(fd);
            if (r.success) beforeImageUrl = r.url!;
        }

        if (afterFile && afterFile.size > 0) {
            const fd = new FormData();
            fd.append("file", afterFile);
            const r = await uploadFile(fd);
            if (r.success) afterImageUrl = r.url!;
        }

        await (db as any).transformation.update({
            where: { id },
            data: {
                titleEs,
                titleEn,
                date: dateStr ? new Date(dateStr) : existing.date,
                visible,
                beforeImageUrl,
                afterImageUrl,
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
