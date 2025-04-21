/**
 * Enhanced server-side logging service
 * Provides a centralized way to handle all logs with different log levels
 * In development: logs to console
 * In production: logs errors to Firestore
 */

import * as admin from 'firebase-admin';

// Environment check to enable/disable logging
const isDevelopment = process.env.NODE_ENV === 'development';
// In production, only log errors to minimize performance impact and server load
const LOG_LEVEL = isDevelopment ? 'debug' : 'error';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// تكوين Firestore لتخزين السجلات
let logsCollection: admin.firestore.CollectionReference | null = null;
try {
  if (!isDevelopment) {
    const firestore = admin.firestore();
    logsCollection = firestore.collection('system_logs');
  }
} catch (error) {
  console.error('Failed to initialize Firestore logging collection', error);
}

/**
 * Get current timestamp formatted for logs
 * @returns Formatted timestamp string
 */
const getTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
};

/**
 * Determines if a log at the given level should be shown
 * @param level - Log level to check
 * @returns Whether the log should be displayed
 */
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
};

/**
 * Formats a log message with contextual information
 * @param module - Source module/component name
 * @param message - Log message
 * @returns Formatted log message
 */
const formatMessage = (module: string, message: string): string => {
  return `${getTimestamp()} [${module}] ${message}`;
};

/**
 * Logger object with methods for each log level
 */
export const logger = {
  /**
   * Debug level logging - only shown in development
   * @param module - Source module/component name
   * @param message - Message to log
   * @param data - Optional additional data
   */
  debug: (module: string, message: string, ...data: any[]): void => {
    if (shouldLog('debug')) {
      console.debug(formatMessage(module, message), ...data);
    }
  },

  /**
   * Information level logging - shown in development
   * @param module - Source module/component name
   * @param message - Message to log
   * @param data - Optional additional data
   */
  info: (module: string, message: string, ...data: any[]): void => {
    if (shouldLog('info')) {
      console.info(formatMessage(module, message), ...data);
    }
  },

  /**
   * Warning level logging - shown in development and production
   * @param module - Source module/component name
   * @param message - Message to log
   * @param data - Optional additional data
   */
  warn: (module: string, message: string, ...data: any[]): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage(module, message), ...data);
    }
  },

  /**
   * Error level logging - always shown
   * @param module - Source module/component name
   * @param message - Message to log
   * @param error - Error object or message
   * @param data - Optional additional data
   */
  error: (module: string, message: string, error?: any, ...data: any[]): void => {
    if (shouldLog('error')) {
      console.error(formatMessage(module, message), error, ...data);
      
      // في بيئة الإنتاج، نقوم بتسجيل الأخطاء في Firestore
      if (!isDevelopment && logsCollection) {
        try {
          const errorData = {
            level: 'error',
            module,
            message,
            timestamp: new Date(),
            error: error ? (error.message || error.toString()) : null,
            stack: error && error.stack ? error.stack : null,
            data: data.length > 0 ? JSON.stringify(data) : null
          };
          
          logsCollection.add(errorData).catch(firestoreError => {
            console.error('Failed to log error to Firestore:', firestoreError);
          });
        } catch (loggingError) {
          console.error('Error during Firestore logging:', loggingError);
        }
      }
    }
  },

  /**
   * Performance measurement for timing operations
   * @param module - Source module/component name
   * @param operationName - Name of the operation being timed
   * @param threshold - Time threshold in ms to trigger a warning (default: 500ms)
   */
  time: (module: string, operationName: string, thresholdMs = 500): () => void => {
    if (!shouldLog('debug')) return () => {};
    
    const startTime = process.hrtime();
    const label = formatMessage(module, operationName);
    console.time(label);
    
    return () => {
      console.timeEnd(label);
      const hrend = process.hrtime(startTime);
      const duration = hrend[0] * 1000 + hrend[1] / 1000000;
      
      if (duration > thresholdMs) {
        logger.warn(module, `Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
    };
  },

  /**
   * HTTP request logging
   * @param method - HTTP method
   * @param url - Request URL
   * @param statusCode - Response status code
   * @param duration - Request duration in ms
   */
  http: (method: string, url: string, statusCode: number, duration: number): void => {
    const color = statusCode >= 500 ? '\x1b[31m' : 
                   statusCode >= 400 ? '\x1b[33m' : 
                   statusCode >= 300 ? '\x1b[36m' : 
                   statusCode >= 200 ? '\x1b[32m' : '';
    const reset = '\x1b[0m';
    
    if (shouldLog('info')) {
      console.log(`${getTimestamp()} [express] ${method} ${url} ${color}${statusCode}${reset} in ${duration}ms`);
    }
  }
};

export default logger;