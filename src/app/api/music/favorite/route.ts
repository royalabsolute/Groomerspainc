import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveSongToFavorites, getFavoriteSongs } from "@/lib/musicController";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { youtubeId, title, duration, thumbnail, localFilePath } = body;

    if (!youtubeId) {
      return NextResponse.json(
        { success: false, error: "youtubeId is required" },
        { status: 400 }
      );
    }

    const result = await saveSongToFavorites({
      youtubeId,
      title,
      duration: parseInt(duration, 10) || 0,
      thumbnail,
      localFilePath,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/music/favorite error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await getFavoriteSongs();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/music/favorite error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
