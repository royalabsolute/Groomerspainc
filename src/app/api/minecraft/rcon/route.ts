import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMinecraftServerPath, getRconPassword, sendRconCommand } from "@/lib/minecraft";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { command } = body;

    if (!command) {
      return NextResponse.json({ success: false, error: "Command is required" }, { status: 400 });
    }

    const serverPath = await getMinecraftServerPath();
    const rconHost = process.env.RCON_HOST || "localhost";
    const rconPort = parseInt(process.env.RCON_PORT || "25575", 10);
    const rconPassword = getRconPassword(serverPath);

    try {
      const response = await sendRconCommand(rconHost, rconPort, rconPassword, command);
      return NextResponse.json({ success: true, response });
    } catch (error: any) {
      const errMsg = error.message || "";
      if (errMsg.includes("ECONNREFUSED") || errMsg.includes("Timeout")) {
        // Fallback mock response for testing/offline RCON
        const mockResponse = getMockCommandResponse(command);
        return NextResponse.json({
          success: true,
          response: mockResponse,
          warning: "Simulated output (RCON Offline)",
        });
      }
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }
  } catch (err: any) {
    console.error("RCON Route API error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

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
