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

    // ── Branch B: Stream from YouTube via InnerTube (youtubei.js) ────────────
    if (videoId) {
      // Lazy-import to avoid bundling issues in dev
      const { Innertube } = await import("youtubei.js");

      const yt = await Innertube.create({
        // TV_EMBEDDED client has fewer restrictions than WEB for audio extraction
        client_type: "TV_EMBEDDED" as any,
        generate_session_locally: true,
        retrieve_player: false,
      });

      // Get stream info
      const info = await yt.getInfo(videoId);
      const format = info.chooseFormat({
        type: "audio",
        quality: "best",
        format: "any",
      });

      if (!format || !format.url) {
        console.error(`[Stream] No audio format found for videoId: ${videoId}`);
        return new Response("No se pudo obtener el stream de audio", { status: 502 });
      }

      const audioUrl = format.url;
      const contentType = format.mime_type || "audio/webm;codecs=opus";

      // Forward the range header to YouTube's CDN for seek support
      const rangeHeader = request.headers.get("range");
      const upstreamHeaders: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
        "Accept": "*/*",
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      };
      if (rangeHeader) {
        upstreamHeaders["Range"] = rangeHeader;
      }

      // Fetch audio from YouTube's CDN and proxy it through our server
      const upstream = await fetch(audioUrl, { headers: upstreamHeaders });

      if (!upstream.ok || !upstream.body) {
        console.error(`[Stream] YouTube CDN responded ${upstream.status} for ${videoId}`);
        return new Response("Error obteniendo audio desde YouTube CDN", {
          status: upstream.status,
        });
      }

      const responseHeaders: Record<string, string> = {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
        // Allow player to access the stream from the browser
        "Access-Control-Allow-Origin": "*",
      };

      // Propagate Content-Length and Content-Range if available
      const upstreamLength = upstream.headers.get("content-length");
      const upstreamRange = upstream.headers.get("content-range");
      if (upstreamLength) responseHeaders["Content-Length"] = upstreamLength;
      if (upstreamRange) responseHeaders["Content-Range"] = upstreamRange;

      return new Response(upstream.body, {
        status: rangeHeader ? 206 : 200,
        headers: responseHeaders,
      });
    }

    return new Response("Se requiere el parámetro ?id= o ?videoId=", { status: 400 });
  } catch (error: any) {
    console.error("[Stream] Error:", error?.message || error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
