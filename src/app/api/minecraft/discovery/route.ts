import { NextRequest, NextResponse } from "next/server";
import { existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

import { getMinecraftServerPath } from "@/lib/minecraft";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const serverPath = await getMinecraftServerPath();
    
    let modsCount = 0;
    let worldExists = false;

    // Check mods folder
    const modsPath = join(serverPath, "mods");
    if (existsSync(modsPath)) {
      try {
        const files = readdirSync(modsPath);
        modsCount = files.filter(f => f.endsWith(".jar") && statSync(join(modsPath, f)).isFile()).length;
      } catch (err) {
        console.error("Error reading mods folder:", err);
      }
    }

    // Check world folder
    const worldPath = join(serverPath, "world");
    if (existsSync(worldPath)) {
      try {
        const stats = statSync(worldPath);
        worldExists = stats.isDirectory();
      } catch (err) {
        console.error("Error checking world folder:", err);
      }
    }

    return NextResponse.json({
      success: true,
      modsCount,
      worldExists,
    });
  } catch (error) {
    console.error("Discovery API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
