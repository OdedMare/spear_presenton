FROM python:3.11-slim-bookworm

# Install system dependencies with retry logic for network resilience
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    -o Acquire::Retries=3 \
    -o Acquire::http::Timeout=30 \
    -o Acquire::https::Timeout=30 \
    curl \
    libreoffice \
    fontconfig \
    chromium \
    build-essential \
    libmagic1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 using NodeSource repository
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends \
    -o Acquire::Retries=3 \
    -o Acquire::http::Timeout=30 \
    nodejs && \
    npm install -g npm@latest

# Create working directory
WORKDIR /app

# Set environment variables
ENV APP_DATA_DIRECTORY=/tmp/app_data
ENV TEMP_DIRECTORY=/tmp/presenton
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NEXTJS_BASE_URL=http://127.0.0.1:3000
ENV HOME=/tmp
ENV XDG_CONFIG_HOME=/tmp/.config
ENV XDG_CACHE_HOME=/tmp/.cache
ENV HF_HOME=/tmp/.cache/huggingface
ENV TRANSFORMERS_CACHE=/tmp/.cache/huggingface
ENV HUGGINGFACE_HUB_CACHE=/tmp/.cache/huggingface

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install \
    aiohttp aiomysql aiosqlite asyncpg fastapi[standard] \
    pathvalidate pdfplumber chromadb sqlmodel \
    anthropic google-genai openai fastmcp dirtyjson \
    deep-translator langdetect json-repair "urllib3<2.0.0" \
    && pip install docling --extra-index-url https://download.pytorch.org/whl/cpu

# Copy models for offline deployment (optional)
# For offline deployment:
#   1. Run download_models.py on a machine with internet to create huggingface_models/ and chroma_models/
#   2. Build Docker image with: docker build -t presenton:offline .
# If models are not present, they will be downloaded at runtime (requires internet)
# For runtime download with self-signed certificates, set DISABLE_SSL_VERIFY=true

# Note: Docling models will be downloaded on first use at runtime
# ChromaDB ONNX models will be downloaded on first use at runtime


# Install dependencies for Next.js
WORKDIR /app/servers/nextjs
COPY servers/nextjs/package*.json ./
RUN npm ci

# Copy and build Next.js app
COPY servers/nextjs/ /app/servers/nextjs/
RUN npm run build

# Copy FastAPI
WORKDIR /app
COPY servers/fastapi/ ./servers/fastapi/

# Install root dependencies for start.js
COPY package.json package-lock.json ./
RUN npm ci

COPY start.js LICENSE NOTICE ./

# Copy nginx configuration (must be done before switching to non-root user)
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories and set permissions for OpenShift compatibility
# OpenShift runs containers with a random UID but as part of the root group (GID 0).
# Directories must be writable by group 0.
RUN mkdir -p /tmp/app_data /tmp/presenton /tmp/.chromium /tmp/.config /tmp/.cache /tmp/.cache/huggingface /tmp/.cache/chroma && \
    chown -R 1001:0 /tmp/app_data /tmp/presenton /tmp/.chromium /tmp/.config /tmp/.cache /app && \
    chmod -R g+rwx /tmp/app_data /tmp/presenton /tmp/.chromium /tmp/.config /tmp/.cache /app

# Switch to non-root user for OpenShift compatibility
USER 1001

# Expose ports for Next.js, FastAPI, and Nginx
EXPOSE 3000 8000 8080

# Start the servers
CMD ["node", "/app/start.js"]