const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");
const { Server } = require("socket.io");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3001", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

let handler;

if (dev) {
  // In development, load standard next
  const next = require("next");
  const app = next({ dev, hostname, port });
  handler = app.getRequestHandler();
  app.prepare().then(startServer);
} else {
  // In production (Next.js standalone), load NextServer
  const NextServer = require("next/dist/server/next-server").default;
  const targetDir = fs.existsSync(path.join(__dirname, "absolute-nexus"))
    ? path.join(__dirname, "absolute-nexus")
    : __dirname;
  const nextServer = new NextServer({
    hostname,
    port,
    dir: targetDir,
    dev: false,
    customServer: true,
  });
  handler = nextServer.getRequestHandler();
  startServer();
}

function startServer() {
  const server = http.createServer((req, res) => {
    return handler(req, res).catch((err) => {
      console.error("Handler error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  });

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Telemetry stream interval
  const activeSockets = new Set();
  let telemetryInterval = null;

  function startTelemetry() {
    if (telemetryInterval) return;
    telemetryInterval = setInterval(async () => {
      try {
        // CPU Usage calculation
        const cpus = os.cpus();
        const load = cpus.reduce((acc, cpu) => {
          const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
          const idle = cpu.times.idle;
          return acc + ((total - idle) / total);
        }, 0) / cpus.length * 100;

        // Memory Usage calculation
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramPct = (usedMem / totalMem) * 100;

        // Check ports status (22, 25565, 25575)
        const portStatus = await checkPorts([22, 25565, 25575]);

        io.emit("telemetry-stream", {
          cpu: load.toFixed(1),
          ram: ramPct.toFixed(1),
          ramRaw: {
            used: (usedMem / (1024 ** 3)).toFixed(2),
            total: (totalMem / (1024 ** 3)).toFixed(2)
          },
          ports: portStatus
        });
      } catch (err) {
        console.error("Telemetry error:", err);
      }
    }, 2000);
  }

  function stopTelemetry() {
    if (telemetryInterval) {
      clearInterval(telemetryInterval);
      telemetryInterval = null;
    }
  }

  // Socket connections
  io.on("connection", async (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);
    activeSockets.add(socket);
    startTelemetry();

    // TAREA 1: CANAL CONSOLA (console-stream)
    const logPath = await getMinecraftLogPath();
    let logWatcher = null;
    let lastSize = 0;

    // Send initial log lines (last 100)
    if (fs.existsSync(logPath)) {
      try {
        const stats = fs.statSync(logPath);
        const size = stats.size;
        let content = "";
        const maxRead = 64 * 1024; // 64 KB
        if (size > maxRead) {
          const fd = fs.openSync(logPath, "r");
          const buffer = Buffer.alloc(maxRead);
          fs.readSync(fd, buffer, 0, maxRead, size - maxRead);
          fs.closeSync(fd);
          content = buffer.toString("utf-8");
        } else {
          content = fs.readFileSync(logPath, "utf-8");
        }
        const lines = content.split(/\r?\n/).slice(-100);
        socket.emit("console-init", lines);
        lastSize = size;
      } catch (err) {
        console.error("Error reading initial logs:", err);
      }

      // Tail log file on changes
      try {
        logWatcher = fs.watch(logPath, (event) => {
          if (event === "change") {
            try {
              const stats = fs.statSync(logPath);
              const newSize = stats.size;
              if (newSize > lastSize) {
                const fd = fs.openSync(logPath, "r");
                const buffer = Buffer.alloc(newSize - lastSize);
                fs.readSync(fd, buffer, 0, newSize - lastSize, lastSize);
                fs.closeSync(fd);
                
                const newLines = buffer.toString("utf-8").split(/\r?\n/);
                newLines.forEach((line) => {
                  if (line) socket.emit("console-stream", line);
                });
                lastSize = newSize;
              } else if (newSize < lastSize) {
                lastSize = newSize;
              }
            } catch (err) {
              console.error("Error reading log change:", err.message);
            }
          }
        });
      } catch (err) {
        console.error("Error setting up log watcher:", err.message);
      }
    } else {
      socket.emit("console-stream", "[Sistema] El archivo de logs de Minecraft no existe en la ruta configurada.");
    }

    // TAREA 2: CLIENTE RCON DIRECTO
    socket.on("console-cmd", async (cmd) => {
      try {
        const serverPath = await getMinecraftServerPath();
        const rconHost = process.env.RCON_HOST || "localhost";
        const rconPort = parseInt(process.env.RCON_PORT || "25575", 10);
        const rconPassword = getRconPassword(serverPath);
        
        const response = await sendRconCommand(rconHost, rconPort, rconPassword, cmd);
        socket.emit("console-cmd-response", { command: cmd, response });
      } catch (err) {
        const errMsg = err.message || "";
        if (errMsg.includes("ECONNREFUSED") || errMsg.includes("Timeout")) {
          const mockResponse = getMockCommandResponse(cmd);
          socket.emit("console-cmd-response", { command: cmd, response: mockResponse, warning: "Simulated output (RCON Offline)" });
        } else {
          socket.emit("console-cmd-response", { command: cmd, error: errMsg });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
      activeSockets.delete(socket);
      if (activeSockets.size === 0) {
        stopTelemetry();
      }
      if (logWatcher) {
        logWatcher.close();
      }
    });
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Server listening on http://${hostname}:${port}`);
  });
}

async function getMinecraftServerPath() {
  let base = process.env.MINECRAFT_SERVER_PATH || "/var/minecraft/server";
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: "config" }
    });
    if (config) {
      base = config.minecraftServerPath || config.minecraftPath || base;
    }
  } catch (err) {
    console.error("[Prisma Sync] Error reading Minecraft path from DB in server.js:", err.message);
  }
  return path.resolve(base);
}

async function getMinecraftLogPath() {
  const base = await getMinecraftServerPath();
  return path.join(base, "logs", "latest.log");
}

function getRconPassword(serverPath) {
  try {
    const propertiesPath = path.join(serverPath, "server.properties");
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
    console.error("Error reading rcon password from server.properties in server.js:", err.message);
  }
  return process.env.RCON_PASSWORD || "tu_contraseña_segura";
}

function getMockCommandResponse(command) {
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

function checkPorts(ports) {
  return Promise.all(
    ports.map((port) => {
      return new Promise((resolve) => {
        const client = new net.Socket();
        client.setTimeout(200);
        client
          .connect({ port, host: "127.0.0.1" }, () => {
            client.destroy();
            resolve({ port, open: true });
          })
          .on("error", () => {
            client.destroy();
            resolve({ port, open: false });
          })
          .on("timeout", () => {
            client.destroy();
            resolve({ port, open: false });
          });
      });
    })
  ).then((results) => {
    const status = {};
    results.forEach((r) => {
      status[r.port] = r.open;
    });
    return status;
  });
}

function createRconPacket(id, type, payload) {
  const payloadBuf = Buffer.from(payload, "utf-8");
  const size = 4 + 4 + payloadBuf.length + 2;
  const buf = Buffer.alloc(4 + size);
  buf.writeInt32LE(size, 0);
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  payloadBuf.copy(buf, 12);
  buf.writeUInt8(0, 12 + payloadBuf.length);
  buf.writeUInt8(0, 12 + payloadBuf.length + 1);
  return buf;
}

function parseRconPacket(buf) {
  const size = buf.readInt32LE(0);
  const id = buf.readInt32LE(4);
  const type = buf.readInt32LE(8);
  const payload = buf.toString("utf-8", 12, buf.length - 2);
  return { id, type, payload };
}

function sendRconCommand(host, port, pass, command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      const authPacket = createRconPacket(1234, 3, pass);
      socket.write(authPacket);
    });

    let authenticated = false;

    socket.on("data", (data) => {
      const { id, type, payload } = parseRconPacket(data);
      if (!authenticated) {
        if (id === 1234) {
          authenticated = true;
          const cmdPacket = createRconPacket(5678, 2, command);
          socket.write(cmdPacket);
        } else if (id === -1) {
          socket.destroy();
          reject(new Error("RCON Authentication Failed"));
        }
      } else {
        socket.destroy();
        resolve(payload);
      }
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });

    socket.setTimeout(2000, () => {
      socket.destroy();
      reject(new Error("RCON Connection Timeout"));
    });
  });
}
