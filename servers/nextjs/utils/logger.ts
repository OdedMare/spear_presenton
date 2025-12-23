/**
 * Logger utility for sending logs to Elasticsearch in production environments.
 *
 * Usage:
 *   import { logger, logApiRequest, logError } from '@/utils/logger';
 *
 *   logger.info("Application started");
 *   logger.error("An error occurred", { userId: 123 });
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogDocument {
  '@timestamp': string;
  level: LogLevel;
  logger: string;
  message: string;
  environment: string;
  service: string;
  [key: string]: any;
}

class Logger {
  private elasticsearchUrl: string | null = null;
  private indexPrefix: string = 'presenton-logs';
  private logLevel: LogLevel = LogLevel.INFO;
  private elasticsearchEnabled: boolean = false;

  constructor() {
    // Only initialize on server side
    if (typeof window === 'undefined') {
      this.elasticsearchUrl = process.env.ELASTICSEARCH_URL || null;
      this.indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'presenton-logs';
      this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
      this.elasticsearchEnabled = !!this.elasticsearchUrl;

      if (this.elasticsearchEnabled) {
        console.log(`Elasticsearch logging enabled: ${this.elasticsearchUrl}`);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private async sendToElasticsearch(logDoc: LogDocument): Promise<void> {
    if (!this.elasticsearchEnabled || !this.elasticsearchUrl) {
      return;
    }

    try {
      // Create index name with current date
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
      const indexName = `${this.indexPrefix}-${date}`;
      const url = `${this.elasticsearchUrl}/${indexName}/_doc`;

      // Prepare auth headers if needed
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const username = process.env.ELASTICSEARCH_USER;
      const password = process.env.ELASTICSEARCH_PASSWORD;
      if (username && password) {
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      // Send to Elasticsearch (non-blocking, don't await)
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(logDoc),
      }).catch((error) => {
        // Use a less verbose log for connection errors in development
        if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
          // Only log once or use debug to avoid spam
          if (process.env.NODE_ENV === 'development') {
            console.warn('Elasticsearch unreachable (ECONNREFUSED) - logging disabled for this session to avoid spam.');
            this.elasticsearchEnabled = false;
          } else {
            console.error('Failed to send log to Elasticsearch: Connection Refused');
          }
        } else {
          console.error('Failed to send log to Elasticsearch:', error);
        }
      });
    } catch (error) {
      console.error('Error in sendToElasticsearch:', error);
    }
  }

  private log(level: LogLevel, message: string, extra: Record<string, any> = {}): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Console logging (always enabled)
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${level} - ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, extra);
        break;
      case LogLevel.INFO:
        console.info(logMessage, extra);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, extra);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, extra);
        break;
    }

    // Elasticsearch logging (async, non-blocking)
    if (this.elasticsearchEnabled && typeof window === 'undefined') {
      const logDoc: LogDocument = {
        '@timestamp': timestamp,
        level,
        logger: 'presenton-nextjs',
        message,
        environment: process.env.ENVIRONMENT || 'production',
        service: 'presenton',
        ...extra,
      };

      this.sendToElasticsearch(logDoc);
    }
  }

  debug(message: string, extra: Record<string, any> = {}): void {
    this.log(LogLevel.DEBUG, message, extra);
  }

  info(message: string, extra: Record<string, any> = {}): void {
    this.log(LogLevel.INFO, message, extra);
  }

  warn(message: string, extra: Record<string, any> = {}): void {
    this.log(LogLevel.WARN, message, extra);
  }

  error(message: string, extra: Record<string, any> = {}): void {
    this.log(LogLevel.ERROR, message, extra);
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience functions for structured logging
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  extra: Record<string, any> = {}
): void {
  logger.info(`${method} ${path} - ${statusCode} (${durationMs.toFixed(2)}ms)`, {
    event_type: 'api_request',
    http_method: method,
    http_path: path,
    http_status: statusCode,
    duration_ms: durationMs,
    ...extra,
  });
}

export function logPdfExport(
  presentationId: string,
  status: 'started' | 'completed' | 'failed',
  durationMs?: number,
  extra: Record<string, any> = {}
): void {
  let message = `PDF Export ${presentationId} - ${status}`;
  if (durationMs) {
    message += ` (${durationMs.toFixed(2)}ms)`;
  }

  const logData = {
    event_type: 'pdf_export',
    presentation_id: presentationId,
    status,
    duration_ms: durationMs,
    ...extra,
  };

  if (status === 'failed') {
    logger.error(message, logData);
  } else {
    logger.info(message, logData);
  }
}

export function logPptxExport(
  presentationId: string,
  status: 'started' | 'completed' | 'failed',
  durationMs?: number,
  extra: Record<string, any> = {}
): void {
  let message = `PPTX Export ${presentationId} - ${status}`;
  if (durationMs) {
    message += ` (${durationMs.toFixed(2)}ms)`;
  }

  const logData = {
    event_type: 'pptx_export',
    presentation_id: presentationId,
    status,
    duration_ms: durationMs,
    ...extra,
  };

  if (status === 'failed') {
    logger.error(message, logData);
  } else {
    logger.info(message, logData);
  }
}

export function logError(
  error: Error | unknown,
  context: string,
  extra: Record<string, any> = {}
): void {
  // Handle cases where error might not be an Error object
  const errorObj = error instanceof Error
    ? error
    : new Error(
      typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error) || 'Unknown error'
    );

  logger.error(`${context}: ${errorObj.message}`, {
    event_type: 'error',
    error_type: errorObj.name,
    error_message: errorObj.message,
    error_stack: errorObj.stack,
    context,
    ...extra,
  });
}
