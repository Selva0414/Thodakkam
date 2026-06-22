# ==================================================
# Stage 1: Build TypeScript Application
# ==================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy project files
COPY . .

# Build TypeScript -> JavaScript
RUN npm run build

# ==================================================
# Stage 2: Production Runtime
# ==================================================
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# dumb-init forwards SIGTERM/SIGINT to node so graceful shutdown actually fires.
RUN apk add --no-cache dumb-init wget

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled build files
COPY --from=builder /app/dist ./dist

# Copy runtime-required folders
COPY --from=builder /app/templates ./templates

# Create uploads directory
RUN mkdir -p /app/uploads

# Persistent uploads storage
VOLUME ["/app/uploads"]

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Container-level health check (compose also defines one; this is for plain `docker run`).
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:5000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
