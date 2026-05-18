"use server";

import db from "@/lib/db";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers() {
    try {
        const users = await db.user.findMany({
            select: { 
                id: true, 
                name: true,
                email: true, 
                image: true,
                role: true, 
                createdAt: true 
            },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, users };
    } catch (error) {
        return { success: false, error: "Error fetching users" };
    }
}

export async function createUser(data: any) {
    try {
        const existingUser = await db.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) return { success: false, error: "User already exists" };

        const hashedPassword = await hash(data.password, 12);
        await db.user.create({
            data: {
                name: data.name || null,
                email: data.email,
                password: hashedPassword,
                image: data.image || null,
                role: data.role || "MODIFIER"
            }
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error creating user" };
    }
}

export async function updateUser(id: string, data: any) {
    try {
        const existingUser = await db.user.findUnique({ where: { id } });
        if (!existingUser) return { success: false, error: "User not found" };

        const updateData: any = {
            name: data.name,
            email: data.email,
            role: data.role,
            image: data.image
        };

        if (data.password && data.password.trim() !== "") {
            updateData.password = await hash(data.password, 12);
        }

        await db.user.update({
            where: { id },
            data: updateData
        });

        revalidatePath("/admin/users");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error updating user" };
    }
}

export async function deleteUser(id: string) {
    try {
        // Prevent deleting the main admin
        const user = await db.user.findUnique({ where: { id } });
        if (user?.email === "admin@groomingpet.com") {
            return { success: false, error: "No se puede eliminar al administrador principal." };
        }

        await db.user.delete({ where: { id } });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error deleting user" };
    }
}
