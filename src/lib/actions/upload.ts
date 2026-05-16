"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/**
 * Server action to handle local file uploads.
 * Saves the file to public/uploads and returns the accessible URL.
 */
export async function uploadFile(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define the upload directory in public/uploads
        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure the directory exists
        await mkdir(uploadDir, { recursive: true });

        // Generate a reasonably unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
        const filename = `${timestamp}-${safeName}`;
        const filePath = join(uploadDir, filename);

        // Write the file to the filesystem
        await writeFile(filePath, buffer);

        // Return the public URL via the API route
        return {
            success: true,
            url: `/api/uploads/${filename}`
        };
    } catch (error) {
        console.error("Error in local upload:", error);
        return { success: false, error: "Upload failed" };
    }
}
