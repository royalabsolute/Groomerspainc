import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const serverPath = process.env.MINECRAFT_SERVER_PATH || "";
    if (!serverPath) {
      return NextResponse.json({ success: false, error: "Minecraft server path is not configured" }, { status: 500 });
    }

    // Ensure the directory exists
    if (!existsSync(serverPath)) {
      mkdirSync(serverPath, { recursive: true });
    }

    const filePath = join(serverPath, file.name);
    writeFileSync(filePath, buffer);

    console.log(`Saved uploaded file: ${filePath}`);

    return NextResponse.json({
      success: true,
      message: `Archivo ${file.name} subido exitosamente.`,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({
      success: false,
      error: "Error interno del servidor al procesar la subida.",
    }, { status: 500 });
  }
}
