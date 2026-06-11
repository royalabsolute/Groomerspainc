import db from "@/lib/db";
import fs from "fs";
import { join } from "path";

export async function getMinecraftServerPath(): Promise<string> {
  const defaultPath = process.env.MINECRAFT_SERVER_PATH || "/var/minecraft/server";
  try {
    let config = await db.siteConfig.findUnique({
      where: { id: "config" },
    }) as any;
    if (!config) {
      config = await db.siteConfig.create({
        data: {
          id: "config",
          minecraftServerPath: defaultPath,
          minecraftPath: defaultPath,
        } as any,
      }) as any;
    }
    return config.minecraftServerPath || config.minecraftPath || defaultPath;
  } catch (err) {
    console.error("Error reading/writing SiteConfig for Minecraft path:", err);
    return defaultPath;
  }
}

export function getRconPassword(serverPath: string): string {
  try {
    const propertiesPath = join(serverPath, "server.properties");
    if (fs.existsSync(propertiesPath)) {
      const content = fs.readFileSync(propertiesPath, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("rcon.password=")) {
          return trimmed.substring("rcon.password=".length).trim();
        }
      }
    }
  } catch (err) {
    console.error("Error reading rcon password from server.properties:", err);
  }
  return process.env.RCON_PASSWORD || "tu_contraseña_segura";
}
