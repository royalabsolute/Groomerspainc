# Stage 1: Install dependencies
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files and prisma directory
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Clean install of all dependencies
RUN npm ci

# Stage 2: Rebuild the source code
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build phase
ENV NEXT_TELEMETRY_DISABLED 1

# Reemplazar el motor de SQLite a PostgreSQL en el esquema de Prisma antes del build
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma

# Generar el cliente Prisma optimizado para PostgreSQL
RUN npx prisma generate

# Compilar la aplicación Next.js en modo standalone
RUN npm run build

# Stage 3: Runner (Producción)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN apt-get update && apt-get install -y openssl unzip tar tmux ffmpeg python3 curl p7zip-full && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Install Java 21 (Eclipse Temurin JRE)
RUN mkdir -p /opt/java && \
    curl -L https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jre_x64_linux_hotspot_21.0.3_9.tar.gz -o /tmp/jre.tar.gz && \
    tar -xzf /tmp/jre.tar.gz -C /opt/java && \
    mv /opt/java/jdk* /opt/java/openjdk-21 && \
    rm /tmp/jre.tar.gz

ENV PATH="/opt/java/openjdk-21/bin:${PATH}"

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid 1001 nextjs

# Copiar archivos compilados standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Copiar node_modules del builder para disponer de la CLI de Prisma en runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# Copiar nuestro server.js customizado con Socket.io
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["sh", "-c", "npx prisma db push && node server.js"]
