import db from "@/lib/db";
import fs from "fs";
import { join } from "path";
import net from "net";

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

// RCON Packet helper creators
function createRconPacket(id: number, type: number, payload: string): Buffer {
  const payloadBuffer = Buffer.from(payload, "utf-8");
  const length = 4 + 4 + payloadBuffer.length + 2; // id(4) + type(4) + payload + null term(1) + padding(1)
  const buf = Buffer.alloc(4 + length);

  buf.writeInt32LE(length, 0);
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  payloadBuffer.copy(buf, 12);
  buf.writeUInt8(0, 12 + payloadBuffer.length); // null terminator for string
  buf.writeUInt8(0, 13 + payloadBuffer.length); // padding byte

  return buf;
}

function parseRconPacket(buf: Buffer) {
  if (buf.length < 12) return { id: -1, type: -1, payload: "" };
  const length = buf.readInt32LE(0);
  const id = buf.readInt32LE(4);
  const type = buf.readInt32LE(8);
  const payload = buf.toString("utf-8", 12, buf.length - 2);
  return { id, type, payload };
}

// Native TCP Source RCON client promise
export function sendRconCommand(host: string, port: number, pass: string, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      // Send authentication packet (Type 3 = SERVERDATA_AUTH)
      const authPacket = createRconPacket(1234, 3, pass);
      socket.write(authPacket);
    });

    let authenticated = false;

    socket.on("data", (data) => {
      try {
        const { id, type, payload } = parseRconPacket(data);
        if (!authenticated) {
          // Expected Type 2 = SERVERDATA_RESPONSE_VALUE (Auth confirmation)
          if (id === 1234) {
            authenticated = true;
            // Auth success, send execution command (Type 2 = SERVERDATA_EXECCOMMAND)
            const cmdPacket = createRconPacket(5678, 2, command);
            socket.write(cmdPacket);
          } else if (id === -1) {
            socket.destroy();
            reject(new Error("RCON Authentication Failed (Incorrect Password)"));
          }
        } else {
          // Output from the run command
          socket.destroy();
          resolve(payload);
        }
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });

    socket.setTimeout(3000, () => {
      socket.destroy();
      reject(new Error("RCON Connection Timeout"));
    });
  });
}

// Dynamic IP Detection
export async function detectAndSavePublicIp(): Promise<string> {
  let detectedIp = "mc.absolutenexus.net";
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (res.ok) {
      const data = (await res.json()) as { ip: string };
      if (data.ip) {
        detectedIp = data.ip;
      }
    }
  } catch (err) {
    console.error("Failed to detect public IP via api.ipify.org:", err);
    // fallback using network interfaces
    try {
      const os = require("os");
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (!iface.internal && iface.family === "IPv4") {
            detectedIp = iface.address;
            break;
          }
        }
      }
    } catch (osErr) {
      console.error("Failed to get IP from os.networkInterfaces:", osErr);
    }
  }

  // Update in SiteConfig database
  try {
    await db.siteConfig.upsert({
      where: { id: "config" },
      update: { publicIp: detectedIp } as any,
      create: { id: "config", publicIp: detectedIp } as any,
    });
  } catch (dbErr) {
    console.error("Failed to save detected IP to SiteConfig DB:", dbErr);
  }

  return detectedIp;
}
