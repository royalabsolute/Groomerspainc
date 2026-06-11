import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const defaultPath = process.env.MINECRAFT_SERVER_PATH || "/var/minecraft/server";
    let config = await db.siteConfig.findUnique({
      where: { id: "config" }
    }) as any;

    if (!config) {
      config = await db.siteConfig.create({
        data: {
          id: "config",
          minecraftServerPath: defaultPath,
          minecraftPath: defaultPath,
        } as any
      }) as any;
    }

    return NextResponse.json({
      success: true,
      minecraftServerPath: config.minecraftServerPath || config.minecraftPath || defaultPath
    });
  } catch (error: any) {
    console.error("Config API GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { minecraftServerPath } = body;

    if (!minecraftServerPath) {
      return NextResponse.json({ success: false, error: "La ruta del servidor es requerida." }, { status: 400 });
    }

    const config = await db.siteConfig.upsert({
      where: { id: "config" },
      update: {
        minecraftServerPath,
        minecraftPath: minecraftServerPath, // keep backward compatibility
      } as any,
      create: {
        id: "config",
        minecraftServerPath,
        minecraftPath: minecraftServerPath,
      } as any
    });

    return NextResponse.json({
      success: true,
      message: "Configuración global de Minecraft guardada correctamente.",
      config
    });
  } catch (error: any) {
    console.error("Config API PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PATCH(request);
}
