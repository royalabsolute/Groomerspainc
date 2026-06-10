import { NextRequest, NextResponse } from "next/server";
import fs, { createWriteStream, existsSync } from "fs";
import { resolve, join } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { exec } from "child_process";

const rootPath = resolve(process.env.MINECRAFT_SERVER_PATH || "/var/minecraft/server");

// Resolves a virtual path (e.g., /var/minecraft/server or /var/www/grooming)
// to a physical path on the local OS.
function getPhysicalPath(virtualPath: string): string {
  const isWindows = process.platform === "win32";
  
  // Clean up backslashes/slashes
  let cleanPath = virtualPath.replace(/\\/g, "/");
  
  const minecraftPath = process.env.MINECRAFT_SERVER_PATH || "/var/minecraft/server";
  
  if (cleanPath === "" || cleanPath === "/") {
    // If empty or root, default to minecraft server path
    return resolve(minecraftPath);
  }
  
  // If cleanPath starts with /var/minecraft/server, map it to the process.env base path
  if (cleanPath.startsWith("/var/minecraft/server")) {
    const relative = cleanPath.slice("/var/minecraft/server".length);
    return resolve(join(minecraftPath, relative));
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
    const pathQuery = request.nextUrl.searchParams.get("path") || "";
    const targetDir = getPhysicalPath(pathQuery);

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
    const pathQuery = request.nextUrl.searchParams.get("path") || "";
    const filename = request.nextUrl.searchParams.get("filename") || "";

    if (!filename) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const targetDir = getPhysicalPath(pathQuery);

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
    const body = await request.json();
    const { path: folderPath, filename } = body;
    let action = body.action;

    if (!filename) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const targetDir = getPhysicalPath(folderPath || "");
    const targetPath = join(targetDir, filename);

    if (!action) {
      if (filename.endsWith(".zip")) {
        action = "unzip";
      } else {
        return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 });
      }
    }

    if (action === "unzip") {
      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "Zip file not found" }, { status: 404 });
      }

      // Execute unzip command using child_process.exec
      const cmd = `unzip -o "${targetPath}" -d "${targetDir}"`;
      await new Promise<void>((resolvePromise, rejectPromise) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            rejectPromise(new Error(`unzip failed: ${stderr || error.message}`));
          } else {
            resolvePromise();
          }
        });
      });

      return NextResponse.json({ success: true, message: `Extracted ${filename} successfully.` });
    } 
    
    if (action === "set_boot") {
      if (!filename.endsWith(".jar") && !filename.endsWith(".sh")) {
        return NextResponse.json({ success: false, error: "Boot file must be a .jar or .sh file" }, { status: 400 });
      }

      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
      }

      let scriptContent = "";
      if (filename.endsWith(".jar")) {
        scriptContent = `#!/bin/bash\ncd "${targetDir}"\nexec java -Xmx8G -Xms2G -jar "${filename}" nogui\n`;
      } else {
        scriptContent = `#!/bin/bash\ncd "${targetDir}"\nexec "./${filename}"\n`;
      }

      const startScriptPath = join(targetDir, "start.sh");
      await fs.promises.writeFile(startScriptPath, scriptContent, { mode: 0o755 });

      return NextResponse.json({ success: true, message: `Set ${filename} as boot target and re-wrote start.sh.` });
    }

    if (action === "delete") {
      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "File or directory not found" }, { status: 404 });
      }

      // Delete recursively
      await fs.promises.rm(targetPath, { recursive: true, force: true });
      return NextResponse.json({ success: true, message: `Deleted ${filename} successfully.` });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("Files API PATCH error:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE: Remove file or directory recursively
export async function DELETE(request: NextRequest) {
  try {
    const { path: folderPath, filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const targetDir = getPhysicalPath(folderPath || "");
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
