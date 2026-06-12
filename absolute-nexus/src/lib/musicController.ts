import db from "@/lib/db";

export interface FavoriteSongInput {
  youtubeId: string;
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  localFilePath?: string;
}

/**
 * Saves a song to the local database (PostgreSQL/SQLite via Prisma)
 * when marked as a favorite. If the song already exists, it returns
 * the existing record.
 */
export async function saveSongToFavorites(input: FavoriteSongInput) {
  try {
    if (!input.youtubeId) {
      throw new Error("youtubeId is required to save a song");
    }

    // Check if the song already exists
    let song = await db.song.findUnique({
      where: { youtubeId: input.youtubeId },
    });

    if (song) {
      return {
        success: true,
        message: "Song already in favorites",
        song,
      };
    }

    // Create a new song record in the database
    song = await db.song.create({
      data: {
        youtubeId: input.youtubeId,
        title: input.title || "Unknown Title",
        duration: input.duration || 0,
        thumbnail: input.thumbnail || "",
        localFilePath: input.localFilePath || null,
      },
    });

    return {
      success: true,
      message: "Song successfully added to favorites",
      song,
    };
  } catch (error: any) {
    console.error("Failed to save song to favorites:", error);
    throw new Error(error.message || "Database operation failed");
  }
}

/**
 * Retrieves all favorited songs from the database.
 */
export async function getFavoriteSongs() {
  try {
    const songs = await db.song.findMany({
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      songs,
    };
  } catch (error: any) {
    console.error("Failed to retrieve favorite songs:", error);
    throw new Error(error.message || "Database operation failed");
  }
}
