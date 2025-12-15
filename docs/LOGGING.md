# Logging and Elasticsearch Integration

This document explains how to configure logging with Elasticsearch integration for the Presenton application.

## Overview

The application includes a custom logger that:
- Logs to console (always enabled)
- Sends structured logs to Elasticsearch (optional, for production)
- Supports both Python (FastAPI) and TypeScript (Next.js)
- Automatically creates daily indices in Elasticsearch
- Includes structured logging for key events (API requests, PDF/PPTX exports, errors)
- **Includes user context (user_id, username) in all logs for traceability**

## Environment Variables

### Required for Elasticsearch Integration

```yaml
# Elasticsearch endpoint URL
ELASTICSEARCH_URL: "http://elasticsearch:9200"

# Elasticsearch index prefix (default: presenton-logs)
ELASTICSEARCH_INDEX_PREFIX: "presenton-logs"

# Optional: Elasticsearch authentication
ELASTICSEARCH_USER: "elastic"
ELASTICSEARCH_PASSWORD: "changeme"

# Optional: Log level (DEBUG, INFO, WARN, ERROR)
LOG_LEVEL: "INFO"

# Optional: Environment name (appears in logs)
ENVIRONMENT: "production"

# If using self-signed certificates
DISABLE_SSL_VERIFY: "true"
```

### Minimal Configuration (Console Only)

If you don't set `ELASTICSEARCH_URL`, logging will only go to console:

```yaml
LOG_LEVEL: "INFO"
ENVIRONMENT: "production"
```

## Usage

### Python (FastAPI)

```python
from utils.logger import logger, log_api_request, log_error
from api.middlewares import get_current_user
from fastapi import Depends

# In API endpoints - extract user context
@router.post("/some-endpoint")
async def my_endpoint(
    current_user: User | None = Depends(get_current_user),
):
    # Extract user context
    user_id = current_user.id if current_user else None
    username = current_user.username if current_user else None

    # Basic logging with user context
    logger.info("Processing request", extra={"extra_fields": {
        "user_id": user_id,
        "username": username,
        "event_type": "request_processing",
        "presentation_id": "abc123"
    }})

    # Structured logging for API requests
    log_api_request(
        method="POST",
        path="/api/v1/ppt/generate",
        status_code=200,
        duration_ms=1250.5,
        user_id=user_id,
        username=username
    )

    # Error logging with context
    try:
        # some code
        pass
    except Exception as e:
        logger.error(f"Failed to generate: {e}", exc_info=True, extra={"extra_fields": {
            "user_id": user_id,
            "username": username,
            "event_type": "generation_error",
            "presentation_id": "abc123"
        }})
```

**Important**: Always include `user_id` and `username` in the `extra_fields` dict for all logs. If authentication is disabled (`REQUIRE_AUTH=false`), both values will be `None`.

### TypeScript (Next.js)

```typescript
import { logger, logPdfExport, logError } from '@/utils/logger';

// Basic logging
logger.info("Export started");
logger.error("Export failed", { presentationId: "123" });

// Structured logging for PDF export
logPdfExport("presentation-123", "completed", 5000, {
  title: "My Presentation",
  filename: "presentation.pdf"
});

// Error logging
try {
  // some code
} catch (error) {
  logError(error as Error, "PDF Export", {
    presentation_id: "123"
  });
}
```

## Log Structure

All logs sent to Elasticsearch have this structure:

```json
{
  "@timestamp": "2025-12-11T10:30:00.000Z",
  "level": "INFO",
  "logger": "presenton",
  "message": "PDF Export completed",
  "environment": "production",
  "service": "presenton",
  "module": "route",
  "function": "export_pdf",
  "line": 42,
  "process_id": 1234,
  "thread_id": 5678,
  "event_type": "pdf_export",
  "user_id": 123,
  "username": "oded",
  "presentation_id": "abc123",
  "duration_ms": 5000,
  "filename": "presentation.pdf"
}
```

### Required User Context Fields

**Every log entry must include:**
- `user_id`: User identifier (integer or `null`)
- `username`: Username string (or `null`)

These fields enable:
- Tracking user activity across the application
- Debugging user-specific issues
- Usage analytics and auditing
- User session tracing

### Special Event Types

The logger includes helper functions for common events:

1. **API Requests** (`event_type: api_request`)
   ```json
   {
     "event_type": "api_request",
     "http_method": "POST",
     "http_path": "/api/v1/ppt/generate",
     "http_status": 200,
     "duration_ms": 1250.5
   }
   ```

2. **PDF Export** (`event_type: pdf_export`)
   ```json
   {
     "event_type": "pdf_export",
     "presentation_id": "abc123",
     "status": "completed",
     "duration_ms": 5000,
     "filename": "presentation.pdf"
   }
   ```

3. **PPTX Export** (`event_type: pptx_export`)
   ```json
   {
     "event_type": "pptx_export",
     "presentation_id": "abc123",
     "status": "completed",
     "duration_ms": 8000,
     "filename": "presentation.pptx"
   }
   ```

4. **Errors** (`event_type: error`)
   ```json
   {
     "event_type": "error",
     "error_type": "ValueError",
     "error_message": "Invalid input",
     "error_stack": "...",
     "context": "PDF Export",
     "presentation_id": "abc123"
   }
   ```

## Elasticsearch Index Pattern

Logs are stored in daily indices with the pattern:

```
{ELASTICSEARCH_INDEX_PREFIX}-YYYY.MM.DD
```

Default example:
- `presenton-logs-2025.12.11`
- `presenton-logs-2025.12.12`
- etc.

This allows for easy retention management and query performance.

## Docker Deployment

### docker-compose.yml

Add Elasticsearch service and configure environment variables:

```yaml
version: '3.8'

services:
  presenton:
    image: presenton:latest
    environment:
      ELASTICSEARCH_URL: "http://elasticsearch:9200"
      ELASTICSEARCH_USER: "elastic"
      ELASTICSEARCH_PASSWORD: "changeme"
      LOG_LEVEL: "INFO"
      ENVIRONMENT: "production"
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=changeme
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

volumes:
  elasticsearch-data:
```

### OpenShift Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: presenton
spec:
  template:
    spec:
      containers:
      - name: presenton
        image: presenton:latest
        env:
        - name: ELASTICSEARCH_URL
          value: "http://elasticsearch-service:9200"
        - name: ELASTICSEARCH_USER
          valueFrom:
            secretKeyRef:
              name: elasticsearch-credentials
              key: username
        - name: ELASTICSEARCH_PASSWORD
          valueFrom:
            secretKeyRef:
              name: elasticsearch-credentials
              key: password
        - name: LOG_LEVEL
          value: "INFO"
        - name: ENVIRONMENT
          value: "production"
        - name: DISABLE_SSL_VERIFY
          value: "true"
```

## Querying Logs in Elasticsearch

### Find all logs for a specific user

```bash
curl -X GET "http://localhost:9200/presenton-logs-*/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "user_id": 123
      }
    },
    "size": 100,
    "sort": [{"@timestamp": "desc"}]
  }'
```

### Find logs by username

```bash
curl -X GET "http://localhost:9200/presenton-logs-*/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "username.keyword": "oded"
      }
    }
  }'
```

### Find all errors in last 24 hours

```json
GET presenton-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "ERROR" } },
        { "range": { "@timestamp": { "gte": "now-24h" } } }
      ]
    }
  }
}
```

### Find errors for a specific user

```json
GET presenton-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "ERROR" } },
        { "term": { "user_id": 123 } }
      ]
    }
  }
}
```

### Find PDF export failures

```json
GET presenton-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "event_type": "pdf_export" } },
        { "match": { "status": "failed" } }
      ]
    }
  }
}
```

### Average PDF export duration

```json
GET presenton-logs-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "match": { "event_type": "pdf_export" } },
        { "match": { "status": "completed" } }
      ]
    }
  },
  "aggs": {
    "avg_duration": {
      "avg": { "field": "duration_ms" }
    }
  }
}
```

## Kibana Integration

If using Kibana for log visualization:

1. **Create Index Pattern**: `presenton-logs-*`
2. **Time Field**: `@timestamp`
3. **Create Visualizations**:
   - Error rate over time
   - PDF export success/failure pie chart
   - Average export duration line graph
   - Top 10 errors table

## Performance Considerations

- Logs are sent asynchronously and non-blocking
- Failed Elasticsearch writes are logged to console but don't crash the app
- Daily indices prevent single large indices
- Consider retention policies (e.g., delete indices older than 30 days)

## Disabling Elasticsearch

To disable Elasticsearch logging and use console only:

1. Remove or comment out `ELASTICSEARCH_URL` environment variable
2. Logs will only go to stdout/stderr
3. No network calls will be made

## Troubleshooting

### Logs not appearing in Elasticsearch

1. Check `ELASTICSEARCH_URL` is correct and reachable
2. Verify credentials if authentication is enabled
3. Check application logs for "Elasticsearch logging enabled" message
4. Test connection: `curl -u user:pass http://elasticsearch:9200`

### SSL Certificate errors

Set `DISABLE_SSL_VERIFY=true` if using self-signed certificates.

### Performance impact

If Elasticsearch is slow or unavailable, it shouldn't affect application performance because logging is async and errors are caught. However, you can increase timeout or disable ES logging if needed.

## Testing Elasticsearch Connection

### Via UI (Recommended)

1. Navigate to **Settings** page in the application
2. Scroll to **Elasticsearch Configuration** section
3. Enter your Elasticsearch URL (e.g., `http://localhost:9200`)
4. Optionally enter username and password if authentication is required
5. Click **"בדוק חיבור"** (Test Connection) button
6. Wait for result:
   - ✅ **Success**: Shows green checkmark with cluster name and version
   - ❌ **Error**: Shows bilingual error message explaining the issue

### Via CLI

```bash
# Test basic connection
curl http://localhost:9200

# Expected response
{
  "name": "...",
  "cluster_name": "docker-cluster",
  "version": {
    "number": "8.11.0",
    ...
  },
  "tagline": "You Know, for Search"
}
```

### Common Connection Errors

The test connection feature provides detailed bilingual (Hebrew/English) error messages:

1. **Authentication Failed (401)**
   - Hebrew: "שגיאת אימות: שם משתמש או סיסמה שגויים"
   - English: "Authentication failed: Invalid username or password"

2. **Forbidden (403)**
   - Hebrew: "גישה נדחתה: אין לך הרשאות מתאימות"
   - English: "Access forbidden: Insufficient permissions"

3. **Not Found (404)**
   - Hebrew: "לא נמצא: ה-URL אינו קיים"
   - English: "Not found: Invalid URL"

4. **Connection Refused**
   - Hebrew: "החיבור נדחה: השרת לא מקבל חיבורים"
   - English: "Connection refused: Server not accepting connections"

5. **SSL Certificate Error**
   - Hebrew: "שגיאת SSL: נסה להפעיל 'השבת אימות SSL'"
   - English: "SSL certificate error: Try enabling 'Disable SSL Verify'"

## Security Notes

- Never log sensitive data (passwords, API keys, PII)
- Use Elasticsearch authentication in production
- Rotate Elasticsearch credentials regularly
- Consider encrypting logs at rest
- Set up proper index access controls
