import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const titleCleanupPatterns = [
  /\s*\(.*?(official|video|audio|lyrics|lyric|visualizer|hd|hq|4k|remaster|remix|live|acoustic|version|edit|extended|radio|clean|explicit).*?\)/gi,
  /\s*\[.*?(official|video|audio|lyrics|lyric|visualizer|hd|hq|4k|remaster|remix|live|acoustic|version|edit|extended|radio|clean|explicit).*?\]/gi,
  /\s*【.*?】/g,
  /\s*\|.*$/g,
  /\s*-\s*(official|video|audio|lyrics|lyric|visualizer).*$/gi,
  /\s*\(feat\..*?\)/gi,
  /\s*\(ft\..*?\)/gi,
  /\s*feat\..*$/gi,
  /\s*ft\..*$/gi
];

const artistSeparators = [" & ", " and ", ", ", " x ", " X ", " feat. ", " feat ", " ft. ", " ft ", " featuring ", " with "];

function cleanTitle(title: string): string {
  let cleaned = title.trim();
  for (const pattern of titleCleanupPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

function cleanArtist(artist: string): string {
  let cleaned = artist.trim();
  for (const separator of artistSeparators) {
    const lowerSeparators = separator.toLowerCase();
    const idx = cleaned.toLowerCase().indexOf(lowerSeparators);
    if (idx !== -1) {
      cleaned = cleaned.substring(0, idx);
      break;
    }
  }
  return cleaned.trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const songId = searchParams.get("songId");
    const title = searchParams.get("title");
    const artist = searchParams.get("artist");
    const durationStr = searchParams.get("duration");

    if (!songId) {
      return NextResponse.json({ success: false, error: "songId is required" }, { status: 400 });
    }

    // 1. Check if the song exists in our local database
    let song = await prisma.song.findUnique({
      where: { youtubeId: songId }
    });

    // 2. If it does not exist, create a placeholder Song in DB so we can link Lyrics to it
    if (!song) {
      song = await prisma.song.create({
        data: {
          youtubeId: songId,
          title: title || "Unknown Title",
          duration: durationStr ? parseInt(durationStr, 10) : 0,
          thumbnail: "", // default placeholder
        }
      });
    }

    // 3. Search for existing cached lyrics for this song (linked to song.id)
    const cachedLyrics = await prisma.lyrics.findUnique({
      where: { songId: song.id }
    });

    if (cachedLyrics) {
      console.log(`[Lyrics API] Cache hit for song: ${songId}`);
      return NextResponse.json({
        success: true,
        provider: cachedLyrics.provider,
        plainLyrics: cachedLyrics.plainLyrics,
        syncedLyrics: cachedLyrics.syncedLyrics
      });
    }

    console.log(`[Lyrics API] Cache miss for song: ${songId}. Querying LRCLIB...`);

    // Clean metadata for better query matching
    const cleanedTitle = cleanTitle(title || "");
    const cleanedArtist = cleanArtist(artist || "");
    const duration = durationStr ? parseInt(durationStr, 10) : 0;

    let lyricsData: { plainLyrics?: string | null; syncedLyrics?: string | null; provider: string } | null = null;

    // Strategy 1: Exact matching using LRCLIB /api/get
    try {
      const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanedArtist)}&track_name=${encodeURIComponent(cleanedTitle)}&duration=${duration}`;
      console.log(`[Lyrics API] Strategy 1 url: ${getUrl}`);
      const res = await fetch(getUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics || data.plainLyrics) {
          lyricsData = {
            plainLyrics: data.plainLyrics || null,
            syncedLyrics: data.syncedLyrics || null,
            provider: "LRCLIB"
          };
        }
      }
    } catch (e) {
      console.warn("[Lyrics API] Strategy 1 failed:", e);
    }

    // Strategy 2: Search endpoint with cleaned track and artist names
    if (!lyricsData) {
      try {
        const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanedTitle)}&artist_name=${encodeURIComponent(cleanedArtist)}`;
        console.log(`[Lyrics API] Strategy 2 url: ${searchUrl}`);
        const res = await fetch(searchUrl);
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results.length > 0) {
            // Find closest duration match
            const bestMatch = results
              .filter(r => r.syncedLyrics || r.plainLyrics)
              .sort((a, b) => Math.abs(a.duration - duration) - Math.abs(b.duration - duration))[0];
            
            if (bestMatch) {
              lyricsData = {
                plainLyrics: bestMatch.plainLyrics || null,
                syncedLyrics: bestMatch.syncedLyrics || null,
                provider: "LRCLIB"
              };
            }
          }
        }
      } catch (e) {
        console.warn("[Lyrics API] Strategy 2 failed:", e);
      }
    }

    // Strategy 3: Search endpoint with combined query
    if (!lyricsData) {
      try {
        const queryUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanedArtist + " " + cleanedTitle)}`;
        console.log(`[Lyrics API] Strategy 3 url: ${queryUrl}`);
        const res = await fetch(queryUrl);
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results.length > 0) {
            const bestMatch = results
              .filter(r => r.syncedLyrics || r.plainLyrics)
              .sort((a, b) => Math.abs(a.duration - duration) - Math.abs(b.duration - duration))[0];
            
            if (bestMatch) {
              lyricsData = {
                plainLyrics: bestMatch.plainLyrics || null,
                syncedLyrics: bestMatch.syncedLyrics || null,
                provider: "LRCLIB"
              };
            }
          }
        }
      } catch (e) {
        console.warn("[Lyrics API] Strategy 3 failed:", e);
      }
    }

    // 4. Cache results in database (either valid lyrics or negative empty cache)
    const finalLyrics = lyricsData || {
      plainLyrics: null,
      syncedLyrics: null,
      provider: "NONE" // Marker indicating we tried but no lyrics were found
    };

    const saved = await prisma.lyrics.create({
      data: {
        songId: song.id,
        provider: finalLyrics.provider,
        plainLyrics: finalLyrics.plainLyrics,
        syncedLyrics: finalLyrics.syncedLyrics
      }
    });

    return NextResponse.json({
      success: true,
      provider: saved.provider,
      plainLyrics: saved.plainLyrics,
      syncedLyrics: saved.syncedLyrics
    });

  } catch (error: any) {
    console.error("[Lyrics API] Error in route:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
