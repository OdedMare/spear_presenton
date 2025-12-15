# Logging and Elasticsearch Integration

This document explains how to configure logging with Elasticsearch integration for the Presenton application.

## Overview

The application includes a custom logger that:
- Logs to console (always enabled)
- Sends structured logs to Elasticsearch (optional, for production)
- Supports both Python (FastAPI) and TypeScript (Next.js)
- Automatically creates daily indices in Elasticsearch
- Includes structured logging for key events (API requests, PDF/PPTX exports, errors)

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

# Basic logging
logger.info("Application started")
logger.error("An error occurred")
logger.debug("Debug information", extra={"user_id": 123})

# Structured logging for API requests
log_api_request(
    method="POST",
    path="/api/v1/ppt/generate",
    status_code=200,
    duration_ms=1250.5,
    user_id="123"
)

# Error logging with context
try:
    # some code
    pass
except Exception as e:
    log_error(e, "Failed to generate presentation", presentation_id="abc123")
```

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
  "event_type": "pdf_export",
  "presentation_id": "abc123",
  "duration_ms": 5000,
  "filename": "presentation.pdf"
}
```

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

## Security Notes

- Never log sensitive data (passwords, API keys, PII)
- Use Elasticsearch authentication in production
- Rotate Elasticsearch credentials regularly
- Consider encrypting logs at rest
- Set up proper index access controls
