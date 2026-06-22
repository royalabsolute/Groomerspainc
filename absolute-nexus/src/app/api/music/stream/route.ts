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
    const localId = searchParams.get("id");
    const videoId = searchParams.get("videoId");

    // ── Branch A: Stream a LOCAL file from disk ──────────────────────────────
    if (localId) {
      let song = await db.song.findUnique({ where: { id: localId } });
      if (!song) {
        song = await db.song.findUnique({ where: { youtubeId: localId } });
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
        const chunkSize = end - start + 1;

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
    }

    // ── Branch B: Stream from YouTube via InnerTube (youtubei.js v17) ────────
    if (videoId) {
      // Dynamic import needed because youtubei.js is ESM-only (type: module)
      const { Innertube } = await import("youtubei.js");

      const yt = await Innertube.create({ client_type: "ANDROID" } as any);
      const stream = await yt.download(videoId, { type: "audio", quality: "best" });
      
      // Conversión crítica para Next.js
      const reader = stream.getReader();
      const webStream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        }
      });
      
      return new Response(webStream, {
        headers: {
          "Content-Type": "audio/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    return new Response("Se requiere el parámetro ?id= o ?videoId=", { status: 400 });
  } catch (error: any) {
    console.error("[Stream] Error:", error?.message ?? String(error));
    return new Response("Internal Server Error", { status: 500 });
  }
}
