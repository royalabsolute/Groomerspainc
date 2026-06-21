import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

// GET — list playlists for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playlists = await db.playlist.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, createdAt: true, isPublic: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, playlists });
  } catch (error: any) {
    console.error("[Playlists GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST — create a new playlist
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name || "").trim();

    if (!name || name.length < 1) {
      return NextResponse.json({ error: "El nombre de la playlist es requerido" }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json({ error: "El nombre no puede superar los 60 caracteres" }, { status: 400 });
    }

    const playlist = await db.playlist.create({
      data: {
        name,
        ownerId: session.user.id,
        isPublic: body.isPublic ?? false,
      },
      select: { id: true, name: true, createdAt: true, isPublic: true },
    });

    return NextResponse.json({ success: true, playlist }, { status: 201 });
  } catch (error: any) {
    console.error("[Playlists POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE — remove a playlist (only owner can delete)
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

    // Verify ownership before deleting
    const playlist = await db.playlist.findUnique({ where: { id } });
    if (!playlist) {
      return NextResponse.json({ error: "Playlist no encontrada" }, { status: 404 });
    }
    if (playlist.ownerId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await db.playlist.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Playlists DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
