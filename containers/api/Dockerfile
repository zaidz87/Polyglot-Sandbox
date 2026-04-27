# Multi-stage build to keep the final image minimal
# We use standard node 20 for our API layer
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors 
COPY package.json package-lock.json* ./

# Install all dependencies (including dev tools like typescript)
RUN npm install

# Copy source code and config
COPY tsconfig.json .
COPY src ./src

# Compile typescript to Javascript in /dist
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine

# In order to spawn docker containers, the API needs the docker CLI installed.
# We install docker CLI purely to pass commands through the mounted docker.sock
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy compiled code and package logic
COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm install --omit=dev

# We do not use a non-root user here because the API container strictly requires 
# permissions to access the mounted /var/run/docker.sock to orchestrate the runners.

# Expose standard API port
EXPOSE 3000

# Start compiled server
CMD ["node", "dist/index.js"]
