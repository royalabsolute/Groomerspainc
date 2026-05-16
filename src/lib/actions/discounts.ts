"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createDiscountCode(data: { code: string, description: string, discount: string, maxUses: string }) {
    try {
        data.code = data.code.trim().toUpperCase();
        const discountCode = (db as any).discountCode;
        if (discountCode) {
            const existing = await discountCode.findUnique({ where: { code: data.code } });
            if (existing) throw new Error("El código ya existe");

            const result = await discountCode.create({
                data: {
                    code: data.code,
                    description: data.description,
                    discount: data.discount,
                    maxUses: parseInt(data.maxUses) || 1,
                }
            });
            revalidatePath("/admin/cupones");
            return result;
        } else {
            // Raw fallback for creation
            const existing: any[] = await (db as any).$queryRaw`SELECT * FROM DiscountCode WHERE code = ${data.code}`;
            if (existing.length > 0) throw new Error("El código ya existe");

            const id = crypto.randomUUID();
            await (db as any).$executeRaw`
                INSERT INTO DiscountCode (id, code, description, discount, maxUses, usedCount, isActive, createdAt, updatedAt)
                VALUES (${id}, ${data.code}, ${data.description}, ${data.discount}, ${parseInt(data.maxUses) || 1}, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;
            revalidatePath("/admin/cupones");
            return { id, ...data, isActive: true, usedCount: 0 };
        }
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export async function deleteDiscountCode(id: string) {
    if ((db as any).discountCode) {
        await (db as any).discountCode.delete({ where: { id } });
    } else {
        await (db as any).$executeRaw`DELETE FROM DiscountCode WHERE id = ${id}`;
    }
    revalidatePath("/admin/cupones");
}

export async function toggleDiscountCode(id: string, isActive: boolean) {
    if ((db as any).discountCode) {
        await (db as any).discountCode.update({
            where: { id },
            data: { isActive }
        });
    } else {
        const activeNum = isActive ? 1 : 0;
        await (db as any).$executeRaw`UPDATE DiscountCode SET isActive = ${activeNum} WHERE id = ${id}`;
    }
    revalidatePath("/admin/cupones");
}

export async function validateDiscountCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    let disc: any = null;
    if ((db as any).discountCode) {
        disc = await (db as any).discountCode.findUnique({ where: { code } });
    } else {
        const results: any[] = await (db as any).$queryRaw`SELECT * FROM DiscountCode WHERE code = ${code}`;
        disc = results[0] || null;
    }

    if (!disc) return { valid: false, message: "Código no encontrado" };
    if (!disc.isActive && disc.isActive !== 1) return { valid: false, message: "Código inactivo" };
    if (disc.maxUses && disc.usedCount >= disc.maxUses) return { valid: false, message: "Código agotado" };
    
    return { valid: true, discount: disc.discount };
}
