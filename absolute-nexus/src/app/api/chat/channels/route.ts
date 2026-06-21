import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    let channels = await prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed default "general" channel if empty
    if (channels.length === 0) {
      const general = await prisma.channel.create({
        data: {
          id: "general",
          name: "general",
        },
      });
      channels = [general];
    }

    return NextResponse.json(channels);
  } catch (err: any) {
    console.error("[API /chat/channels GET] Error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "El nombre del canal es requerido y debe ser texto" },
        { status: 400 }
      );
    }

    // Normalizar el nombre del canal (estilo Discord: minúsculas, guiones, sin caracteres especiales)
    const normalizedName = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    if (!normalizedName) {
      return NextResponse.json(
        { error: "Nombre de canal inválido" },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await prisma.channel.findUnique({
      where: { name: normalizedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un canal con ese nombre" },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        name: normalizedName,
      },
    });

    return NextResponse.json(channel);
  } catch (err: any) {
    console.error("[API /chat/channels POST] Error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "El ID del canal es requerido" },
        { status: 400 }
      );
    }

    if (id === "general") {
      return NextResponse.json(
        { error: "No se puede eliminar el canal general" },
        { status: 400 }
      );
    }

    // Verificar si existe
    const channel = await prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "El canal no existe" },
        { status: 404 }
      );
    }

    // Eliminar canal (cascada se encarga de los mensajes)
    await prisma.channel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[API /chat/channels DELETE] Error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
