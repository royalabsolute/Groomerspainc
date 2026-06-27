import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import fs from "fs";
import path from "path";

// Standard template for server.properties
const DEFAULT_PROPERTIES = `#Minecraft server properties
enable-rcon=true
rcon.port=25575
rcon.password=tu_contraseña_segura
pvp=true
difficulty=easy
max-players=20
motd=Absolute Minecraft Server KVM4
level-name=world
online-mode=false
allow-flight=true
gamemode=survival
spawn-protection=16
`;

import { getMinecraftServerPath } from "@/lib/minecraft";

async function getPropertiesPath(): Promise<string> {
  const serverPath = await getMinecraftServerPath();
  return path.join(path.resolve(serverPath), "server.properties");
}

function parseProperties(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      const value = trimmed.substring(idx + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

function stringifyProperties(properties: Record<string, any>): string {
  let content = "#Minecraft server properties\n";
  content += `#Updated by Absolute Nexus at ${new Date().toISOString()}\n`;
  for (const [key, value] of Object.entries(properties)) {
    content += `${key}=${value}\n`;
  }
  return content;
}

// GET: Retrieve and parse server.properties
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const propertiesPath = await getPropertiesPath();
    const dir = path.dirname(propertiesPath);

    // If properties file doesn't exist, try initializing it
    if (!fs.existsSync(propertiesPath)) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(propertiesPath, DEFAULT_PROPERTIES, "utf-8");
      } catch (err: any) {
        console.warn(`Could not create directory/file at ${propertiesPath}: ${err.message}. Falling back to local project mock.`);
        // Fallback to project root for mock local-first testing
        const fallbackPath = path.join(process.cwd(), "server.properties");
        if (!fs.existsSync(fallbackPath)) {
          fs.writeFileSync(fallbackPath, DEFAULT_PROPERTIES, "utf-8");
        }
        const content = fs.readFileSync(fallbackPath, "utf-8");
        const raw = req.nextUrl.searchParams.get("raw") === "true";
        if (raw) {
          return NextResponse.json({ success: true, content, isMock: true });
        }
        return NextResponse.json({ success: true, properties: parseProperties(content), isMock: true });
      }
    }

    const content = fs.readFileSync(propertiesPath, "utf-8");
    const raw = req.nextUrl.searchParams.get("raw") === "true";
    if (raw) {
      return NextResponse.json({ success: true, content });
    }
    return NextResponse.json({ success: true, properties: parseProperties(content) });
  } catch (error: any) {
    console.error("Properties API GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH/POST: Overwrite properties with new values
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { properties, rawContent } = body;

    const propertiesPath = await getPropertiesPath();

    if (rawContent !== undefined) {
      try {
        fs.writeFileSync(propertiesPath, rawContent, "utf-8");
      } catch (err: any) {
        console.warn(`Could not write to ${propertiesPath}: ${err.message}. Writing to local mock instead.`);
        const fallbackPath = path.join(process.cwd(), "server.properties");
        fs.writeFileSync(fallbackPath, rawContent, "utf-8");
        return NextResponse.json({ success: true, isMock: true });
      }
      return NextResponse.json({ success: true, message: "Ajustes del servidor guardados correctamente." });
    }

    if (!properties || typeof properties !== "object") {
      return NextResponse.json({ success: false, error: "Parámetro 'properties' o 'rawContent' inválido o ausente." }, { status: 400 });
    }

    const newContent = stringifyProperties(properties);

    try {
      fs.writeFileSync(propertiesPath, newContent, "utf-8");
    } catch (err: any) {
      console.warn(`Could not write to ${propertiesPath}: ${err.message}. Writing to local mock instead.`);
      const fallbackPath = path.join(process.cwd(), "server.properties");
      fs.writeFileSync(fallbackPath, newContent, "utf-8");
      return NextResponse.json({ success: true, isMock: true });
    }

    return NextResponse.json({ success: true, message: "Ajustes del servidor guardados correctamente." });
  } catch (error: any) {
    console.error("Properties API PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}
