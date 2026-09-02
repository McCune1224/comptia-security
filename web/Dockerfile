# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files from web/
COPY web/package.json web/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy web source
COPY web/ .

# Build the SvelteKit app
RUN npm run build

# Stage 2: Production
FROM node:22-slim AS production

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY web/package.json web/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/.svelte-kit ./build/.svelte-kit

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Run the production server
CMD ["node", "build"]
