# Multi-stage build for API Spec Test Case Generator MCP Server
# Optimized for production deployment with minimal image size

# ============================================================================
# Stage 1: Builder - Install dependencies and compile TypeScript
# ============================================================================
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and tsconfig first
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code BEFORE npm install to avoid prepare script issues
COPY . .

# Install ALL dependencies (including devDependencies for build)
# Note: Using npm install since package-lock.json may not be present in monorepo setup
RUN npm install

# Build TypeScript to JavaScript
RUN npm run build

# Skip tests in Docker build (tests run in CI/CD separately)
# Tests require additional setup and test files may be excluded by .dockerignore
# RUN npm test

# ============================================================================
# Stage 2: Production - Minimal runtime image
# ============================================================================
FROM node:22-alpine

# Add labels for image metadata
LABEL maintainer="Model Context Protocol"
LABEL description="MCP Server for generating comprehensive test scenarios from OpenAPI specifications"
LABEL version="0.1.0"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -u 1001 -S mcp -G mcp

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./

# Install production dependencies only
# Use --ignore-scripts to skip prepare/build scripts since we already have the built dist
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create directories for specs and output with proper permissions
RUN mkdir -p /app/specs /app/output && \
    chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# Set environment variables
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check (for container orchestration)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Volume for OpenAPI specs
VOLUME ["/app/specs", "/app/output"]

# Expose MCP server on stdio (no network port needed for MCP)
# MCP servers communicate via stdio, not HTTP

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the MCP server
CMD ["node", "dist/index.js"]
