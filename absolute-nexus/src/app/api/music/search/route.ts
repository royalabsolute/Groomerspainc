import { NextRequest, NextResponse } from "next/server";
import ytSearch from "yt-search";

export async function GET(request: NextRequest) {
  try {
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

    // Extract and format the top 15 matches
    const videos = searchResults.videos.slice(0, 15);
    const formattedResults = videos.map((video) => ({
      id: video.videoId,
      title: video.title,
      author: video.author?.name || "Unknown Channel",
      duration: video.timestamp, // Formatted duration e.g. "4:15"
      seconds: video.seconds,    // Playback duration in seconds
      thumbnail: video.thumbnail || video.image,
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
