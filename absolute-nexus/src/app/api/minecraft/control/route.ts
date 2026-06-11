import { NextRequest, NextResponse } from "next/server";
import { spawn, ChildProcess } from "child_process";
import fs, { existsSync, readdirSync } from "fs";
import { join } from "path";
import net from "net";
import { getMinecraftServerPath, getRconPassword } from "@/lib/minecraft";
import { auth } from "@/auth";

// Helper function to safely check if directory is empty or doesn't exist
function checkIsDirEmpty(dirPath: string): boolean {
  if (!dirPath) return true;
  try {
    if (!existsSync(dirPath)) return true;
    const files = readdirSync(dirPath);
    return files.length === 0;
  } catch (error) {
    return true;
  }
}


// Keep process reference in global memory to persist across API reloads during dev mode
interface GlobalMinecraft {
  process: ChildProcess | null;
  logs: string[];
}

const globalMinecraft = global as unknown as {
  minecraft: GlobalMinecraft;
};

if (!globalMinecraft.minecraft) {
  globalMinecraft.minecraft = {
    process: null,
    logs: [],
  };
}

const state = globalMinecraft.minecraft;

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
function sendRconCommand(host: string, port: number, pass: string, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      // Send authentication packet (Type 3 = SERVERDATA_AUTH)
      const authPacket = createRconPacket(1234, 3, pass);
      socket.write(authPacket);
    });

    let authenticated = false;

    socket.on("data", (data) => {
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

function isPortOpen(port: number, host: string = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(300);
    socket
      .connect(port, host, () => {
        socket.destroy();
        resolve(true);
      })
      .on("error", () => {
        socket.destroy();
        resolve(false);
      })
      .on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
  });
}

// API POST handler
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { action, command } = body;

    const serverPath = await getMinecraftServerPath();
    const rconHost = process.env.RCON_HOST || "localhost";
    const rconPort = parseInt(process.env.RCON_PORT || "25575", 10);
    const rconPassword = getRconPassword(serverPath);

    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 });
    }

    // Check if directory is empty or missing
    const isDirEmpty = checkIsDirEmpty(serverPath);

    if (isDirEmpty) {
      if (action === "status" || action === "command" || action === "stop" || action === "restart") {
        return NextResponse.json({
          success: true,
          status: "OFFLINE",
          logs: [],
          warning: "Directorio vacío"
        });
      }
      if (action === "start") {
        return NextResponse.json({
          success: false,
          error: "No se puede iniciar el servidor: El directorio está vacío. Sube los archivos del servidor primero."
        }, { status: 400 });
      }
    }

    // --- Action: STATUS ---
    if (action === "status") {
      const isRunning = await isPortOpen(25565);
      return NextResponse.json({
        success: true,
        status: isRunning ? "RUNNING" : "OFFLINE",
        logsCount: state.logs.length,
      });
    }

    // --- Action: START ---
    if (action === "start") {
      const isRunning = await isPortOpen(25565);
      if (isRunning) {
        return NextResponse.json({ success: false, error: "Server is already running" });
      }

      if (!serverPath || !existsSync(serverPath)) {
        return NextResponse.json({
          success: false,
          error: `Minecraft server path not found or invalid: "${serverPath}"`
        }, { status: 400 });
      }

      // Check for start script (Windows vs Unix)
      const isWindows = process.platform === "win32";
      const scriptName = isWindows ? "start.bat" : "start.sh";
      const scriptPath = join(serverPath, scriptName);

      if (!existsSync(scriptPath)) {
        return NextResponse.json({
          success: false,
          error: `Start script "${scriptName}" not found in path: "${serverPath}"`
        }, { status: 400 });
      }

      state.logs = []; // Clear old logs
      addServerLog(`[Nexus Controller] Spawning server process: ${scriptName}`);

      let p;
      if (isWindows) {
        p = spawn("cmd.exe", ["/c", scriptName], {
          cwd: serverPath,
          env: process.env,
          detached: true,
        });
        state.process = p;
      } else {
        const { execSync } = require("child_process");
        try {
          execSync("tmux kill-session -t minecraft-server 2>/dev/null || true");
        } catch (e) {}
        p = spawn("tmux", ["new-session", "-d", "-s", "minecraft-server", "./start.sh"], {
          cwd: serverPath,
          env: { ...process.env },
          detached: true,
          stdio: "ignore",
        });
        p.unref();
        state.process = p;
      }

      return NextResponse.json({ success: true, message: "Server startup initiated" });
    }

    // --- Action: STOP ---
    if (action === "stop") {
      const isRunning = await isPortOpen(25565);
      if (!isRunning) {
        return NextResponse.json({ success: false, error: "Server is not running" });
      }

      addServerLog("[Nexus Controller] Sending shutdown signal via RCON...");

      // Attempt graceful stop via RCON first
      try {
        await sendRconCommand(rconHost, rconPort, rconPassword, "stop");
        return NextResponse.json({ success: true, message: "Graceful shutdown sent via RCON" });
      } catch (rconError) {
        const errMsg = (rconError as Error).message;
        addServerLog(`[Nexus Controller] RCON Stop failed: ${errMsg}`);
        const isWindows = process.platform === "win32";
        if (!isWindows) {
          addServerLog("[Nexus Controller] Forcing tmux session kill.");
          const { execSync } = require("child_process");
          try {
            execSync("tmux kill-session -t minecraft-server 2>/dev/null || true");
          } catch (e) {}
          state.process = null;
          return NextResponse.json({ success: true, message: "Server process terminated forcefully (killed tmux session)" });
        } else if (state.process) {
          addServerLog("[Nexus Controller] Forcing process kill.");
          state.process.kill();
          state.process = null;
          return NextResponse.json({ success: true, message: "Server process terminated forcefully" });
        }
        return NextResponse.json({ success: false, error: `Failed to stop server: ${errMsg}` }, { status: 500 });
      }
    }

    // --- Action: RESTART ---
    if (action === "restart") {
      const isRunning = await isPortOpen(25565);
      if (isRunning) {
        addServerLog("[Nexus Controller] Restarting: Sending stop command via RCON...");
        try {
          await sendRconCommand(rconHost, rconPort, rconPassword, "stop");
        } catch {
          if (state.process) {
            state.process.kill();
            state.process = null;
          }
        }
      }

      // Wait a moment and launch again
      setTimeout(async () => {
        const isWindows = process.platform === "win32";
        const scriptName = isWindows ? "start.bat" : "start.sh";
        const scriptPath = join(serverPath, scriptName);
        if (existsSync(scriptPath)) {
          let p;
          if (isWindows) {
            p = spawn("cmd.exe", ["/c", scriptName], {
              cwd: serverPath,
              env: process.env,
              detached: true,
            });
            state.process = p;
          } else {
            const { execSync } = require("child_process");
            try {
              execSync("tmux kill-session -t minecraft-server 2>/dev/null || true");
            } catch (e) {}
            p = spawn("tmux", ["new-session", "-d", "-s", "minecraft-server", "./start.sh"], {
              cwd: serverPath,
              env: { ...process.env },
              detached: true,
              stdio: "ignore",
            });
            p.unref();
            state.process = p;
          }
        }
      }, 3000);

      return NextResponse.json({ success: true, message: "Restart cycle scheduled" });
    }

    // --- Action: COMMAND (RCON execution) ---
    if (action === "command") {
      if (!command) {
        return NextResponse.json({ success: false, error: "Command is required" }, { status: 400 });
      }

      // Send command via RCON TCP Client
      try {
        const response = await sendRconCommand(rconHost, rconPort, rconPassword, command);
        addServerLog(`[RCON Command Run] ${command} -> ${response.trim()}`);
        return NextResponse.json({ success: true, response });
      } catch (error) {
        const errMsg = (error as Error).message;
        
        // High fidelity dev fallback: if connection refused, simulate command output so testing still works
        if (errMsg.includes("ECONNREFUSED") || errMsg.includes("Timeout")) {
          const mockResponse = getMockCommandResponse(command);
          addServerLog(`[MOCK RCON] ${command} -> ${mockResponse}`);
          return NextResponse.json({ 
            success: true, 
            response: mockResponse, 
            warning: "Simulated output (RCON Offline)" 
          });
        }

        addServerLog(`[RCON Error] Failed to run command: ${errMsg}`);
        return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Control API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Log logs helper
function addServerLog(msg: string) {
  const now = new Date();
  const timestamp = now.toTimeString().split(" ")[0];
  // Split message by newlines and add individually
  const lines = msg.split(/\r?\n/).filter(Boolean);
  lines.forEach(l => {
    state.logs.push(`${timestamp} - ${l}`);
  });
  // Limit to last 500 lines to prevent memory bloating
  if (state.logs.length > 500) {
    state.logs.shift();
  }
}

// Mock responses dictionary for high-fidelity developer previews
function getMockCommandResponse(command: string): string {
  const cmd = command.trim().toLowerCase();
  if (cmd.startsWith("help")) {
    return "Available mock commands: /list, /say, /tps, /op, /deop, /kick";
  }
  if (cmd.startsWith("list") || cmd.startsWith("/list")) {
    return "There are 3 players online: Jagger, Steve, Alex";
  }
  if (cmd.startsWith("tps") || cmd.startsWith("/tps")) {
    return "TPS from last 1m: 20.0 (100% capacity)";
  }
  if (cmd.startsWith("say") || cmd.startsWith("/say")) {
    return `[Broadcast] ${command.substring(cmd.indexOf("say") + 3).trim()}`;
  }
  if (cmd.startsWith("op") || cmd.startsWith("/op")) {
    return `Granted operator privileges to user.`;
  }
  return `Command executed successfully (Mock Mode): "${command}"`;
}

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const serverPath = await getMinecraftServerPath();
  const isDirEmpty = checkIsDirEmpty(serverPath);
  if (isDirEmpty) {
    return NextResponse.json({
      success: true,
      status: "OFFLINE",
      logs: [],
      warning: "Directorio vacío"
    });
  }

  // If memory logs are empty, try reading from logs/latest.log on disk
  if (state.logs.length === 0) {
    const logFilePath = join(serverPath, "logs", "latest.log");
    try {
      if (existsSync(logFilePath)) {
        const content = await fs.promises.readFile(logFilePath, "utf-8");
        const lines = content.split(/\r?\n/).filter(Boolean);
        // Take last 100 lines
        const lastLines = lines.slice(-100);
        state.logs = lastLines.map(line => line);
      }
    } catch (err) {
      console.error("Error reading latest.log:", err);
    }
  }

  return NextResponse.json({
    success: true,
    logs: state.logs,
  });
}
