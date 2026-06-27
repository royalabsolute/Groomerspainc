const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");
const { Server } = require("socket.io");
const mcUtils = require("minecraft-server-util");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3001", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

let handler;

const next = require("next");
const targetDir = fs.existsSync(path.join(__dirname, "absolute-nexus"))
  ? path.join(__dirname, "absolute-nexus")
  : __dirname;

const app = next({ dev, hostname, port, dir: targetDir });
handler = app.getRequestHandler();
app.prepare().then(startServer);

function startServer() {
  const server = http.createServer((req, res) => {
    // Interceptar la petición de recursos estáticos en public/uploads de forma directa
    if (req.url.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "public", req.url);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".gif") contentType = "image/gif";
        else if (ext === ".svg") contentType = "image/svg+xml";
        else if (ext === ".webm") contentType = "video/webm";
        else if (ext === ".mp4") contentType = "video/mp4";
        
        res.writeHead(200, { "Content-Type": contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      } else {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
    }

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

  // Dedicated namespace for music module and WebRTC synchronization
  const musicIo = io.of("/music");
  musicIo.on("connection", (socket) => {
    console.log(`[Socket Music] Cliente conectado al namespace /music: ${socket.id}`);
    
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`[Socket Music] Cliente ${socket.id} se unió a la sala: ${roomId}`);
    });
    
    socket.on("disconnect", () => {
      console.log(`[Socket Music] Cliente desconectado del namespace /music: ${socket.id}`);
    });
  });

  // ── Chat Interno namespace ─────────────────────────────────────────────────
  const chatIo = io.of("/chat");
  chatIo.on("connection", (socket) => {
    console.log(`[Socket Chat] Cliente conectado: ${socket.id}`);

    // Cliente se une a un canal (room)
    socket.on("join-channel", (channelId) => {
      socket.join(channelId);
      console.log(`[Socket Chat] ${socket.id} se unió al canal: ${channelId}`);
    });

    // Canal creado
    socket.on("channel-created", (channel) => {
      chatIo.emit("channel-created", channel);
      console.log(`[Socket Chat] Canal creado notificado a todos: ${channel.name}`);
    });

    // Canal eliminado
    socket.on("channel-deleted", (channelId) => {
      chatIo.emit("channel-deleted", channelId);
      console.log(`[Socket Chat] Canal eliminado notificado a todos: ${channelId}`);
    });

    // Cliente envía un mensaje
    socket.on("send-message", async ({ channelId, content, userId, attachmentUrl, attachmentType, replyToId }) => {
      if (!channelId || !userId || (!content && !attachmentUrl)) return;
      try {
        // Asegurar que el usuario existe (por si la DB fue reiniciada y se mantiene la sesión JWT)
        let dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              id: userId,
              email: `${userId}@absolutenexus.net`,
              name: `Admin-${userId.substring(0, 4)}`,
              password: "dummy-password",
            }
          });
          console.log(`[Socket Chat] Usuario temporal creado automáticamente: ${userId}`);
        }

        const message = await prisma.message.create({
          data: {
            channelId,
            content: content ? content.trim() : "",
            userId,
            attachmentUrl,
            attachmentType,
            replyToId: replyToId || null,
          },
          include: {
            user: { select: { id: true, name: true, email: true, image: true, avatarUrl: true } },
            replyTo: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            },
            reactions: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            }
          },
        });
        // Emitir el mensaje a todos en el canal (incluido el remitente)
        chatIo.to(channelId).emit("new-message", message);
      } catch (err) {
        console.error("[Socket Chat] Error guardando mensaje:", err.message);
        socket.emit("chat-error", { error: "No se pudo enviar el mensaje." });
      }
    });

    // Cliente edita un mensaje
    socket.on("edit-message", async ({ messageId, content }) => {
      if (!messageId || !content) return;
      try {
        const message = await prisma.message.update({
          where: { id: messageId },
          data: {
            content: content.trim(),
            isEdited: true
          },
          include: {
            user: { select: { id: true, name: true, email: true, image: true, avatarUrl: true } },
            replyTo: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            },
            reactions: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            }
          }
        });
        chatIo.to(message.channelId).emit("message-edited", message);
      } catch (err) {
        console.error("[Socket Chat] Error editando mensaje:", err.message);
        socket.emit("chat-error", { error: "No se pudo editar el mensaje." });
      }
    });

    // Cliente elimina un mensaje
    socket.on("delete-message", async ({ messageId }) => {
      if (!messageId) return;
      try {
        await prisma.message.delete({ where: { id: messageId } });
        chatIo.emit("message-deleted", messageId);
        console.log(`[Socket Chat] Mensaje eliminado notificado a todos: ${messageId}`);
      } catch (err) {
        console.error("[Socket Chat] Error eliminando mensaje:", err.message);
        socket.emit("chat-error", { error: "No se pudo eliminar el mensaje." });
      }
    });

    // Eventos de escritura
    socket.on("typing-start", ({ channelId, userId, userName }) => {
      if (!channelId || !userId) return;
      socket.to(channelId).emit("user-typing-start", { channelId, userId, userName });
    });

    socket.on("typing-stop", ({ channelId, userId }) => {
      if (!channelId || !userId) return;
      socket.to(channelId).emit("user-typing-stop", { channelId, userId });
    });

    // Reacciones
    socket.on("toggle-reaction", async ({ messageId, userId, emoji }) => {
      if (!messageId || !userId || !emoji) return;
      try {
        const existing = await prisma.reaction.findFirst({
          where: {
            messageId,
            userId,
            emoji
          }
        });

        if (existing) {
          await prisma.reaction.delete({
            where: { id: existing.id }
          });
        } else {
          await prisma.reaction.create({
            data: {
              messageId,
              userId,
              emoji
            }
          });
        }

        const reactions = await prisma.reaction.findMany({
          where: { messageId },
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        });

        const msg = await prisma.message.findUnique({
          where: { id: messageId },
          select: { channelId: true }
        });

        if (msg) {
          chatIo.to(msg.channelId).emit("reaction-updated", { messageId, reactions });
        }
      } catch (err) {
        console.error("[Socket Chat] Error en toggle-reaction:", err.message);
        socket.emit("chat-error", { error: "No se pudo procesar la reacción." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket Chat] Cliente desconectado: ${socket.id}`);
    });
  });

  // Telemetry stream interval
  const activeSockets = new Set();
  let telemetryInterval = null;

  function startTelemetry() {
    if (telemetryInterval) return;
    telemetryInterval = setInterval(async () => {
      try {
        // CPU Usage calculation via os.loadavg()
        const cpusCount = os.cpus().length || 1;
        const load = (os.loadavg()[0] / cpusCount) * 100;

        // Memory Usage calculation
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramPct = (usedMem / totalMem) * 100;

        // Check ports status (22, 25565, 25575)
        const portStatus = await checkPorts([22, 25565, 25575]);

        let mcPlayers = 0;
        let mcMaxPlayers = 20;
        try {
          if (portStatus[25565]) {
            const mcStatus = await mcUtils.status("127.0.0.1", 25565, { timeout: 1000, enableSRV: false });
            mcPlayers = mcStatus.players.online;
            mcMaxPlayers = mcStatus.players.max;
          }
        } catch (mcErr) {
          // Fallback if status fails
        }

        io.emit("telemetry-stream", {
          cpu: load.toFixed(1),
          ram: ramPct.toFixed(1),
          ramRaw: {
            used: (usedMem / (1024 ** 3)).toFixed(2),
            total: (totalMem / (1024 ** 3)).toFixed(2)
          },
          ports: portStatus,
          minecraft: {
            online: mcPlayers,
            max: mcMaxPlayers
          }
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
    let currentLogPath = "";
    let lastSize = 0;
    let pathNotFoundSent = false;

    const logPollInterval = setInterval(async () => {
      try {
        const logPath = await getMinecraftLogPath();
        
        if (logPath !== currentLogPath) {
          currentLogPath = logPath;
          lastSize = 0;
          pathNotFoundSent = false;
        }

        if (!fs.existsSync(currentLogPath)) {
          if (!pathNotFoundSent) {
            socket.emit("console-stream", "[Sistema] El archivo de logs de Minecraft no existe en la ruta configurada.");
            pathNotFoundSent = true;
          }
          lastSize = 0;
          return;
        }

        pathNotFoundSent = false;
        const stats = fs.statSync(currentLogPath);
        const newSize = stats.size;

        if (lastSize === 0) {
          // Send initial log lines (last 100)
          let content = "";
          const maxRead = 64 * 1024; // 64 KB
          if (newSize > maxRead) {
            const fd = fs.openSync(currentLogPath, "r");
            const buffer = Buffer.alloc(maxRead);
            fs.readSync(fd, buffer, 0, maxRead, newSize - maxRead);
            fs.closeSync(fd);
            content = buffer.toString("utf-8");
          } else {
            content = fs.readFileSync(currentLogPath, "utf-8");
          }
          const lines = content.split(/\r?\n/).slice(-100);
          socket.emit("console-init", lines);
          lastSize = newSize;
        } else if (newSize > lastSize) {
          // Read new lines
          const fd = fs.openSync(currentLogPath, "r");
          const buffer = Buffer.alloc(newSize - lastSize);
          fs.readSync(fd, buffer, 0, newSize - lastSize, lastSize);
          fs.closeSync(fd);
          
          const newLines = buffer.toString("utf-8").split(/\r?\n/);
          newLines.forEach((line) => {
            if (line) socket.emit("console-stream", line);
          });
          lastSize = newSize;
        } else if (newSize < lastSize) {
          // File rolled over or truncated
          lastSize = 0;
        }
      } catch (err) {
        console.error("Error reading console logs in poll loop:", err.message);
      }
    }, 250);

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
      clearInterval(logPollInterval);
    });
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Server listening on http://${hostname}:${port}`);
  });
}

let cachedServerPath = null;
let lastPathQueryTime = 0;

async function getMinecraftServerPath() {
  const now = Date.now();
  if (cachedServerPath && (now - lastPathQueryTime < 2000)) {
    return cachedServerPath;
  }
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
  const resolved = path.resolve(base);
  cachedServerPath = resolved;
  lastPathQueryTime = now;
  console.log(`[Debug DB] getMinecraftServerPath base: "${base}" -> resolved: "${resolved}"`);
  return resolved;
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
