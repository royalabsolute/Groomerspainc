import { NextRequest, NextResponse } from "next/server";
import ytSearch from "yt-search";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "Search query parameter '?q=' is required" },
        { status: 400 }
      );
    }

    // Perform search using yt-search without Google API quota limitations
    const searchResults = await ytSearch(query);

    // Extract and format the top 10 matches
    const videos = searchResults.videos.slice(0, 10);
    const formattedResults = videos.map((video: any) => ({
      id: video.videoId,
      title: video.title,
      artist: video.author?.name || "Unknown Channel",
      duration: video.timestamp, // Formatted duration e.g. "4:15"
      durationSeconds: video.seconds,    // Playback duration in seconds
      thumbnail: video.thumbnail || video.image,
      url: video.url,
    }));

    return NextResponse.json({
      success: true,
      query,
      results: formattedResults,
    });
  } catch (error: any) {
    console.error("YouTube Search API Route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
