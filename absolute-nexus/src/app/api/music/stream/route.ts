import { NextRequest } from "next/server";
import { existsSync, createReadStream, statSync } from "fs";
import db from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response("id parameter is required", { status: 400 });
    }

    // Lookup song by database ID or YouTube ID
    let song = await db.song.findUnique({
      where: { id },
    });

    if (!song) {
      song = await db.song.findUnique({
        where: { youtubeId: id },
      });
    }

    if (!song || !song.localFilePath) {
      return new Response("Song or local file path not found", { status: 404 });
    }

    const filePath = song.localFilePath;

    if (!existsSync(filePath)) {
      return new Response("File not found on disk", { status: 404 });
    }

    const stat = statSync(filePath);
    const totalSize = stat.size;
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunkSize = (end - start) + 1;

      const fileStream = createReadStream(filePath, { start, end });

      return new Response(fileStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "audio/mpeg",
        },
      });
    } else {
      const fileStream = createReadStream(filePath);
      return new Response(fileStream as any, {
        headers: {
          "Content-Length": totalSize.toString(),
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
        },
      });
    }
  } catch (error: any) {
    console.error("Audio streaming route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
