# ==========================================
# Multi-Stage Production Dockerfile for DealsRadar EG
# Stage 1: Build Frontend Vite React PWA
# Stage 2: Serve with Python FastAPI ASGI Server
# ==========================================

# Stage 1: Build Frontend PWA
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python ASGI Runtime
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy Backend Source Code
COPY backend/ ./backend/

# Copy Compiled PWA from Frontend Stage
COPY --from=frontend-builder /app/frontend/dist ./backend/dist

# Set Working Directory and Environment Variables
WORKDIR /app/backend
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Health check probe
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start Server
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
