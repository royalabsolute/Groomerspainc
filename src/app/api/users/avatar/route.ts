import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, extname } from "path";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse form-data
    const data = await request.formData();
    const file = data.get("file") as unknown as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Validate that it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "El archivo proporcionado no es una imagen válida" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Define paths and upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Create a unique filename: avatar_[userId]_[timestamp].[ext]
    const originalExt = extname(file.name) || ".png";
    const uniqueFilename = `avatar_${userId}_${Date.now()}${originalExt}`;
    const filePath = join(uploadDir, uniqueFilename);

    // Save file
    writeFileSync(filePath, buffer);
    console.log(`[Avatar Upload] Saved avatar for user ${userId} to ${filePath}`);

    // 4. Update user in database
    const publicUrl = `/uploads/avatars/${uniqueFilename}`;
    await db.user.update({
      where: { id: userId },
      data: { image: publicUrl },
    });

    return NextResponse.json({
      success: true,
      message: "Avatar subido y actualizado correctamente.",
      url: publicUrl,
    });
  } catch (error: any) {
    console.error("[Avatar Upload API Error]:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Error interno al procesar la subida del avatar.",
    }, { status: 500 });
  }
}
