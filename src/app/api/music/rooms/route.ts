import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

// GET — list all live rooms (public to all authenticated users)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rooms = await db.liveRoom.findMany({
      select: { id: true, name: true, description: true, isLive: true, activeUsers: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, rooms });
  } catch (error: any) {
    console.error("[Rooms GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST — create a new live room
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name || "").trim();
    const description = (body.description || "").trim() || null;

    if (!name || name.length < 1) {
      return NextResponse.json({ error: "El nombre de la sala es requerido" }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: "El nombre no puede superar los 60 caracteres" }, { status: 400 });
    }

    const room = await db.liveRoom.create({
      data: { name, description, isLive: false, activeUsers: 0 },
      select: { id: true, name: true, description: true, isLive: true, activeUsers: true, createdAt: true },
    });

    return NextResponse.json({ success: true, room }, { status: 201 });
  } catch (error: any) {
    console.error("[Rooms POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE — remove a live room (any authenticated user can delete for now)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    const room = await db.liveRoom.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
    }

    await db.liveRoom.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Rooms DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
