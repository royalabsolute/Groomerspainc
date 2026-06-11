import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { resolve, sep } from "path";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    let requestedPath = searchParams.get("path") || "";

    const isWindows = process.platform === "win32";

    // Handle default path
    if (!requestedPath) {
      requestedPath = isWindows ? "C:\\" : "/";
    }

    // Resolve path to absolute
    let targetPath = resolve(requestedPath);

    // Verify existence
    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ success: false, error: `El directorio "${targetPath}" no existe.` }, { status: 400 });
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ success: false, error: `El path "${targetPath}" no es un directorio.` }, { status: 400 });
    }

    const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });

    // Filter to keep ONLY directories
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    // Calculate parent path
    let parentPath = targetPath;
    const parts = targetPath.split(sep).filter(Boolean);
    if (parts.length > 0) {
      parentPath = resolve(targetPath, "..");
    }

    return NextResponse.json({
      success: true,
      currentPath: targetPath,
      parentPath: parentPath,
      folders,
    });
  } catch (error: any) {
    console.error("Error in VPS explorer API:", error);
    return NextResponse.json({
      success: false,
      error: `Error al leer el directorio: ${error.message || error}`,
    }, { status: 500 });
  }
}
