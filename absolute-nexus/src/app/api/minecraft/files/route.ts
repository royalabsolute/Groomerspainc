import { NextRequest, NextResponse } from "next/server";
import fs, { createWriteStream, existsSync } from "fs";
import { resolve, join, basename } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { exec } from "child_process";
import { getMinecraftServerPath } from "@/lib/minecraft";
import { auth } from "@/auth";

// Resolves a virtual path (e.g., /var/minecraft/server or /var/www/grooming)
// to a physical path on the local OS.
function getPhysicalPath(virtualPath: string, minecraftServerPath: string): string {
  const isWindows = process.platform === "win32";
  
  // Clean up backslashes/slashes
  let cleanPath = virtualPath.replace(/\\/g, "/");
  
  if (cleanPath === "") {
    // If empty, default to minecraft server path
    return resolve(minecraftServerPath);
  }
  
  // If cleanPath starts with /var/minecraft/server, map it to the database base path
  if (cleanPath.startsWith("/var/minecraft/server")) {
    const relative = cleanPath.slice("/var/minecraft/server".length);
    return resolve(join(minecraftServerPath, relative));
  }
  
  if (isWindows) {
    // On Windows, if virtual path starts with /, resolve relative to current working directory/mock structures
    if (cleanPath.startsWith("/")) {
      return resolve(cleanPath.slice(1));
    }
  }
  
  return resolve(cleanPath);
}

// GET: Read directory contents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const pathQuery = request.nextUrl.searchParams.get("path") || "";
    const minecraftServerPath = await getMinecraftServerPath();
    const targetDir = getPhysicalPath(pathQuery, minecraftServerPath);

    if (!existsSync(targetDir)) {
      try {
        await fs.promises.mkdir(targetDir, { recursive: true });
      } catch (err) {
        return NextResponse.json({ success: false, error: "Directory not found and could not be created" }, { status: 404 });
      }
    }

    const dirents = await fs.promises.readdir(targetDir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const fullPath = join(targetDir, dirent.name);
        try {
          const stat = await fs.promises.stat(fullPath);
          return {
            name: dirent.name,
            isDirectory: dirent.isDirectory(),
            size: stat.size,
            mtime: stat.mtime.toISOString(),
          };
        } catch (err) {
          return {
            name: dirent.name,
            isDirectory: dirent.isDirectory(),
            size: 0,
            mtime: new Date().toISOString(),
          };
        }
      })
    );

    // Sort: directories first, then files alphabetically
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error("Files API GET error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Upload large files using streams to avoid memory limits
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const pathQuery = request.nextUrl.searchParams.get("path") || "";
    const filename = request.nextUrl.searchParams.get("filename") || "";

    if (!filename) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const minecraftServerPath = await getMinecraftServerPath();
    const targetDir = getPhysicalPath(pathQuery, minecraftServerPath);

    // Ensure target directory exists
    if (!existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    const targetFile = join(targetDir, filename);

    if (!request.body) {
      return NextResponse.json({ success: false, error: "Request body is empty" }, { status: 400 });
    }

    const nodeStream = Readable.fromWeb(request.body as any);
    const writeStream = createWriteStream(targetFile);

    await pipeline(nodeStream, writeStream);

    return NextResponse.json({ success: true, message: `File ${filename} uploaded successfully.` });
  } catch (error) {
    console.error("Files API POST error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: File actions (unzip, set_boot, delete)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { path: folderPath, filename, action, newName, folderName } = body;

    let resolvedAction = action;
    if (!resolvedAction) {
      if (
        filename &&
        (filename.endsWith(".zip") ||
          filename.endsWith(".rar") ||
          filename.endsWith(".7z") ||
          filename.endsWith(".tar.gz"))
      ) {
        resolvedAction = "unzip";
      } else {
        return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 });
      }
    }

    if (!filename && resolvedAction !== "mkdir") {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const minecraftServerPath = await getMinecraftServerPath();
    const targetDir = getPhysicalPath(folderPath || "", minecraftServerPath);
    const targetPath = filename ? join(targetDir, filename) : "";

    if (resolvedAction === "mkdir") {
      if (!folderName) {
        return NextResponse.json({ success: false, error: "folderName is required" }, { status: 400 });
      }
      const newFolderPath = join(targetDir, folderName);
      if (existsSync(newFolderPath)) {
        return NextResponse.json({ success: false, error: "A file or folder with that name already exists" }, { status: 400 });
      }
      await fs.promises.mkdir(newFolderPath, { recursive: true });
      return NextResponse.json({ success: true, message: `Created folder ${folderName} successfully.` });
    }

    if (resolvedAction === "rename") {
      if (!newName) {
        return NextResponse.json({ success: false, error: "newName is required" }, { status: 400 });
      }
      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "Source file or folder not found" }, { status: 404 });
      }
      const newPath = join(targetDir, newName);
      if (existsSync(newPath)) {
        return NextResponse.json({ success: false, error: "A file or folder with that name already exists" }, { status: 400 });
      }
      await fs.promises.rename(targetPath, newPath);
      return NextResponse.json({ success: true, message: `Renamed ${filename} to ${newName} successfully.` });
    }

    if (resolvedAction === "unzip" || resolvedAction === "extract") {
      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "Compressed file not found" }, { status: 404 });
      }

      const isWindows = process.platform === "win32";
      let cmd = "";
      if (isWindows) {
        cmd = filename.endsWith(".tar.gz")
          ? `7z x "${targetPath}" -so | 7z x -si -ttar -o"${targetDir}" -y`
          : `7z x "${targetPath}" -o"${targetDir}" -y`;
      } else {
        if (filename.endsWith(".tar.gz") || filename.endsWith(".tgz")) {
          cmd = `tar -xzf "${targetPath}" -C "${targetDir}"`;
        } else {
          cmd = `unzip -o "${targetPath}" -d "${targetDir}"`;
        }
      }

      await new Promise<void>((resolvePromise, rejectPromise) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            rejectPromise(new Error(`Extraction failed: ${stderr || error.message}`));
          } else {
            resolvePromise();
          }
        });
      });

      return NextResponse.json({ success: true, message: `Extracted ${filename} successfully.` });
    } 
    
    if (resolvedAction === "set_boot") {
      if (!filename.endsWith(".jar") && !filename.endsWith(".sh") && !filename.endsWith(".bat")) {
        return NextResponse.json({ success: false, error: "Boot file must be a .jar, .sh, or .bat file" }, { status: 400 });
      }

      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
      }

      let scriptContent = "";
      let batContent = "";
      if (filename.endsWith(".jar")) {
        scriptContent = `#!/bin/bash\ncd "${targetDir}"\nexec java -Xms4G -Xmx6G -XX:+UseZGC -XX:+ZGenerational -jar "${filename}" nogui\n`;
        batContent = `@echo off\ncd /d "%~dp0"\njava -Xms4G -Xmx6G -XX:+UseZGC -XX:+ZGenerational -jar "${filename}" nogui\npause\n`;
      } else if (filename.endsWith(".sh")) {
        scriptContent = `#!/bin/bash\ncd "${targetDir}"\nexec "./${filename}"\n`;
        batContent = `@echo off\ncd /d "%~dp0"\necho Cannot run shell script directly on Windows.\npause\n`;
      } else {
        scriptContent = `#!/bin/bash\ncd "${targetDir}"\necho Cannot run bat script directly on Linux.\n`;
        batContent = `@echo off\ncd /d "%~dp0"\ncall "${filename}"\npause\n`;
      }

      const startScriptPath = join(targetDir, "start.sh");
      await fs.promises.writeFile(startScriptPath, scriptContent, { mode: 0o755 });

      const startBatPath = join(targetDir, "start.bat");
      await fs.promises.writeFile(startBatPath, batContent);

      return NextResponse.json({ success: true, message: `Set ${filename} as boot target and updated start.sh / start.bat.` });
    }

    if (resolvedAction === "delete") {
      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "File or directory not found" }, { status: 404 });
      }

      // Delete recursively
      await fs.promises.rm(targetPath, { recursive: true, force: true });
      return NextResponse.json({ success: true, message: `Deleted ${filename} successfully.` });
    }

    if (resolvedAction === "copy") {
      const { sourcePath } = body;
      if (!sourcePath) {
        return NextResponse.json({ success: false, error: "sourcePath is required" }, { status: 400 });
      }
      const physicalSource = getPhysicalPath(sourcePath, minecraftServerPath);
      if (!existsSync(physicalSource)) {
        return NextResponse.json({ success: false, error: "Source file or directory not found" }, { status: 404 });
      }
      
      const physicalDestDir = getPhysicalPath(folderPath || "", minecraftServerPath);
      const sourceBasename = filename || basename(physicalSource);
      const physicalDest = join(physicalDestDir, sourceBasename);
      
      if (existsSync(physicalDest)) {
        return NextResponse.json({ success: false, error: "A file or folder with that name already exists in the destination" }, { status: 400 });
      }
      
      await fs.promises.cp(physicalSource, physicalDest, { recursive: true });
      return NextResponse.json({ success: true, message: `Copied ${sourceBasename} successfully.` });
    }

    if (resolvedAction === "move") {
      const { sourcePath } = body;
      if (!sourcePath) {
        return NextResponse.json({ success: false, error: "sourcePath is required" }, { status: 400 });
      }
      const physicalSource = getPhysicalPath(sourcePath, minecraftServerPath);
      if (!existsSync(physicalSource)) {
        return NextResponse.json({ success: false, error: "Source file or directory not found" }, { status: 404 });
      }
      
      const physicalDestDir = getPhysicalPath(folderPath || "", minecraftServerPath);
      const sourceBasename = filename || basename(physicalSource);
      const physicalDest = join(physicalDestDir, sourceBasename);
      
      if (existsSync(physicalDest)) {
        return NextResponse.json({ success: false, error: "A file or folder with that name already exists in the destination" }, { status: 400 });
      }
      
      await fs.promises.rename(physicalSource, physicalDest);
      return NextResponse.json({ success: true, message: `Moved ${sourceBasename} successfully.` });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${resolvedAction}` }, { status: 400 });
  } catch (error) {
    console.error("Files API PATCH error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE: Remove file or directory recursively
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { path: folderPath, filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const minecraftServerPath = await getMinecraftServerPath();
    const targetDir = getPhysicalPath(folderPath || "", minecraftServerPath);
    const targetPath = join(targetDir, filename);

    if (!existsSync(targetPath)) {
      return NextResponse.json({ success: false, error: "File or directory not found" }, { status: 404 });
    }

    // Delete recursively (handles files and directories)
    await fs.promises.rm(targetPath, { recursive: true, force: true });

    return NextResponse.json({ success: true, message: `Deleted ${filename} successfully.` });
  } catch (error) {
    console.error("Files API DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
