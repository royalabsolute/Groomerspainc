"use client";

import { signIn } from "next-auth/react";

export async function loginAction(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");

    try {
        const result = await signIn("credentials", {
            email,
            password,
            redirect: true,
            callbackUrl: "/es/admin/dashboard",
        });
        return result;
    } catch (error) {
        throw error;
    }
}
