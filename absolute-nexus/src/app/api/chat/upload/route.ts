import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Definir la ruta de uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
    
    // Crear el directorio si no existe
    await fs.mkdir(uploadDir, { recursive: true });

    // Generar un nombre único (ej. Date.now() + - + file.name)
    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Escribir el archivo en disco
    await fs.writeFile(filePath, buffer);

    // Determinar el tipo de archivo (image, video, audio, file)
    let type = "file";
    const mime = file.type.toLowerCase();
    if (mime.startsWith("image/")) {
      type = "image";
    } else if (mime.startsWith("video/")) {
      type = "video";
    } else if (mime.startsWith("audio/")) {
      type = "audio";
    }

    return NextResponse.json({
      url: `/uploads/chat/${uniqueFilename}`,
      type,
    });
  } catch (err: any) {
    console.error("[API /chat/upload] Error:", err);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    );
  }
}
