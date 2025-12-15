# Authentication and Logging Features

This document describes the authentication and Elasticsearch logging features added to Presenton.

## Table of Contents
- [Authentication](#authentication)
  - [Overview](#authentication-overview)
  - [Configuration](#authentication-configuration)
  - [API Endpoints](#api-endpoints)
  - [Frontend Implementation](#frontend-implementation)
- [Elasticsearch Logging](#elasticsearch-logging)
  - [Overview](#logging-overview)
  - [Configuration](#logging-configuration)
  - [Log Format](#log-format)
  - [Usage](#usage)

---

## Authentication

### Authentication Overview

Presenton now supports optional username-only authentication. When enabled, users must provide a username before accessing the application. No password is required - this is designed for internal use cases where simple user identification is needed without complex password management.

**Features:**
- Username-only login (2-100 characters)
- Automatic user creation on first login
- Session-based authentication with 30-day expiry
- Sessions stored in the database
- Optional - can be disabled entirely

### Authentication Configuration

Set the `REQUIRE_AUTH` environment variable to enable authentication:

```bash
# In .env file or docker-compose.yml
REQUIRE_AUTH=true   # Enable authentication
# or
REQUIRE_AUTH=false  # Disable authentication (default)
```

For the Next.js frontend, also set:
```bash
# In servers/nextjs/.env.local
NEXT_PUBLIC_REQUIRE_AUTH=true
```

### API Endpoints

#### POST /api/v1/auth/login
Login or create a user account.

**Request:**
```json
{
  "username": "john_doe"
}
```

**Response:**
```json
{
  "user_id": 1,
  "username": "john_doe",
  "session_token": "abc123...",
  "created_at": "2025-01-15T10:30:00Z",
  "last_login": "2025-01-15T10:30:00Z"
}
```

#### GET /api/v1/auth/validate
Validate a session token.

**Headers:**
```
Authorization: Bearer {session_token}
```

**Response:**
```json
{
  "valid": true,
  "user_id": 1,
  "username": "john_doe"
}
```

#### POST /api/v1/auth/logout
Invalidate a session token.

**Headers:**
```
Authorization: Bearer {session_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Frontend Implementation

The authentication system includes:

1. **Login Page** (`/login`) - Captures username and creates/validates user
2. **AuthProvider** - React context provider that:
   - Checks for existing sessions on app load
   - Validates session tokens
   - Redirects unauthenticated users to login
   - Redirects authenticated users away from login page
3. **Redux State** - Global authentication state management
4. **Route Protection** - Automatic redirect to login for protected routes

**Protected Routes:**
All routes except `/login` require authentication when `REQUIRE_AUTH=true`.

**Session Storage:**
Session tokens are stored in `localStorage` and automatically included in API requests.

---

## Elasticsearch Logging

### Logging Overview

Presenton includes built-in Elasticsearch logging for centralized log collection and analysis. The logging system is optional and can be configured via environment variables.

**Features:**
- Automatic log shipping to Elasticsearch
- Daily index rotation (`presenton-logs-YYYY.MM.DD`)
- Structured JSON logging with rich context
- Support for authentication (basic auth)
- SSL/TLS support with certificate verification
- Graceful fallback to console logging if Elasticsearch is unavailable
- User context tracking (when authentication is enabled)

### Logging Configuration

Configure Elasticsearch logging using environment variables:

```bash
# Elasticsearch URL (required to enable ES logging)
ELASTICSEARCH_URL=http://elasticsearch:9200

# Authentication (optional)
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=changeme

# Index configuration
ELASTICSEARCH_INDEX_PREFIX=presenton-logs  # Default

# Logging level
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# SSL verification
DISABLE_SSL_VERIFY=false  # Set to true for self-signed certs
```

**Note:** If `ELASTICSEARCH_URL` is not set, only console logging will be used (no error).

### Log Format

All logs are sent to Elasticsearch as structured JSON documents:

```json
{
  "@timestamp": "2025-01-15T10:30:00.123Z",
  "level": "INFO",
  "logger": "presenton",
  "message": "User logged in: john_doe",
  "module": "auth",
  "function": "login",
  "line": 42,
  "process_id": 12345,
  "thread_id": 67890,
  "environment": "production",
  "service": "presenton",
  "event_type": "user_login",
  "user_id": 1,
  "username": "john_doe"
}
```

### Usage

#### Python (FastAPI Backend)

```python
from utils.logger import logger, log_api_request, log_presentation_generation, log_error

# Basic logging
logger.info("Application started")
logger.error("An error occurred", extra={"extra_fields": {"user_id": 123}})

# Structured API request logging
log_api_request(
    method="POST",
    path="/api/v1/ppt/generate",
    status_code=200,
    duration_ms=1234.56,
    user_id=1,
    username="john_doe"
)

# Presentation generation logging
log_presentation_generation(
    presentation_id="abc123",
    status="completed",
    duration_s=45.2,
    user_id=1,
    slide_count=15
)

# Error logging with context
try:
    # ... code ...
except Exception as e:
    log_error(e, context="Presentation generation", user_id=1)
```

#### TypeScript (Next.js Frontend)

```typescript
import { logger, logApiRequest, logPdfExport, logError } from '@/utils/logger';

// Basic logging (server-side only)
logger.info("Application started");
logger.error("An error occurred", { userId: 123 });

// API request logging
logApiRequest("POST", "/api/generate", 200, 1234.56, {
  userId: 1,
  presentationId: "abc123"
});

// PDF export logging
logPdfExport("abc123", "completed", 5000, { userId: 1 });

// Error logging
try {
  // ... code ...
} catch (error) {
  logError(error as Error, "PDF Export", { userId: 1 });
}
```

### Event Types

The logging system includes predefined event types for common operations:

- `user_login` - User authentication events
- `user_logout` - User logout events
- `api_request` - HTTP API requests
- `presentation_generation` - Presentation creation events
- `pdf_export` - PDF export operations
- `pptx_export` - PPTX export operations
- `error` - Error events with stack traces

### Index Management

Logs are automatically organized into daily indices:
- Format: `{ELASTICSEARCH_INDEX_PREFIX}-YYYY.MM.DD`
- Example: `presenton-logs-2025.01.15`

This allows for easy:
- Index lifecycle management (ILM)
- Daily rotation and cleanup
- Time-based queries in Kibana/Elasticsearch

### Kibana Dashboards

Once logs are flowing to Elasticsearch, you can create Kibana dashboards to monitor:
- Application errors and warnings
- API response times and status codes
- User activity and authentication patterns
- Presentation generation metrics
- Export operation success rates

### Troubleshooting

**Logs not appearing in Elasticsearch:**
1. Check `ELASTICSEARCH_URL` is set correctly
2. Verify network connectivity to Elasticsearch
3. Check Elasticsearch authentication credentials
4. Review console logs for connection errors
5. Ensure Elasticsearch is accepting documents (check cluster health)

**SSL/TLS errors:**
- Set `DISABLE_SSL_VERIFY=true` for self-signed certificates
- Or configure proper SSL certificates

**Authentication errors:**
- Verify `ELASTICSEARCH_USER` and `ELASTICSEARCH_PASSWORD` are correct
- Check Elasticsearch user permissions (needs index creation and write permissions)

---

## Combined Usage Example

When both authentication and logging are enabled:

```python
# Backend: Log with user context
from api.middlewares import get_current_user
from utils.logger import logger

@router.post("/api/v1/ppt/generate")
async def generate_presentation(
    request: GenerateRequest,
    user: User = Depends(get_current_user)  # Get authenticated user
):
    logger.info(
        f"Generating presentation for user {user.username}",
        extra={
            "extra_fields": {
                "event_type": "presentation_generation_start",
                "user_id": user.id,
                "username": user.username,
                "prompt": request.prompt
            }
        }
    )
    # ... generation logic ...
```

This creates rich, searchable logs in Elasticsearch with full user context for auditing and analytics.
