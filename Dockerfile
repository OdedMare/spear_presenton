FROM python:3.11-slim-bookworm

# Install system dependencies
# Install system dependencies
RUN apt-get update && apt-get install -y \
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
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Create working directory
WORKDIR /app

# Set environment variables
ENV APP_DATA_DIRECTORY=/tmp/app_data
ENV TEMP_DIRECTORY=/tmp/presenton
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install \
    aiohttp aiomysql aiosqlite asyncpg fastapi[standard] \
    pathvalidate pdfplumber chromadb sqlmodel \
    anthropic google-genai openai fastmcp dirtyjson \
    deep-translator langdetect json-repair \
    && pip install docling --extra-index-url https://download.pytorch.org/whl/cpu


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
COPY start.js LICENSE NOTICE ./

# Create directories and set permissions for OpenShift compatibility
# OpenShift runs containers with a random UID but as part of the root group (GID 0).
# Directories must be writable by group 0.
RUN mkdir -p /tmp/app_data /tmp/presenton && \
    chown -R 1001:0 /tmp/app_data /tmp/presenton /app && \
    chmod -R g+rwx /tmp/app_data /tmp/presenton /app

# Switch to non-root user for OpenShift compatibility
USER 1001

# Expose ports for Next.js, FastAPI, and Nginx
EXPOSE 3000 8000 8080

# Start the servers
CMD ["node", "/app/start.js"]