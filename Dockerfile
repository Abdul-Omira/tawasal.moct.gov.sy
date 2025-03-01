# Multi-stage build for Syrian Ministry Communications Platform
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install system dependencies for building
RUN apk add --no-cache python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies including devDependencies for building
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    tzdata \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set timezone to Syria
RUN cp /usr/share/zoneinfo/Asia/Damascus /etc/localtime

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Create necessary directories
RUN mkdir -p uploads logs backups && \
    chown -R nextjs:nodejs /app

# Create secure uploads directory
RUN mkdir -p /var/secure-uploads && \
    chown -R nextjs:nodejs /var/secure-uploads && \
    chmod 700 /var/secure-uploads

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV SECURE_UPLOADS_DIR=/var/secure-uploads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
