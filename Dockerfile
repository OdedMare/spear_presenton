FROM python:3.11-slim-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
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
ENV APP_DATA_DIRECTORY=/app_data
ENV TEMP_DIRECTORY=/tmp/presenton
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip setuptools wheel
RUN pip install \
    aiohttp aiomysql aiosqlite asyncpg fastapi[standard] \
    pathvalidate pdfplumber chromadb sqlmodel \
    anthropic google-genai openai fastmcp dirtyjson \
    && pip install docling --extra-index-url https://download.pytorch.org/whl/cpu

# Install ollama (optional: may fail silently if not ARM)
RUN curl -fsSL https://ollama.com/install.sh | bash - || true

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

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start the servers
CMD ["node", "/app/start.js"]