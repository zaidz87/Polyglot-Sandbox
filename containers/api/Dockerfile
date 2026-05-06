# Multi-stage build to keep the final image minimal
FROM node:20-alpine AS builder

WORKDIR /app

# better-sqlite3 is a native addon — needs python3 + make + g++ to compile on Alpine
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json .
COPY src ./src
RUN npm run build

# ── Stage 2: Production Image ─────────────────────────────────────────────────
FROM node:20-alpine

# Docker CLI to spawn execution containers via the mounted docker.sock
RUN apk add --no-cache docker-cli

# Build tools needed only for installing better-sqlite3 native bindings
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json* ./

# Install production dependencies (compiles native better-sqlite3 here)
RUN npm install --omit=dev

# Expose API port
EXPOSE 3000

CMD ["node", "dist/index.js"]
