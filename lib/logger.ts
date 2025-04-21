/**
 * Logger service for client-side logging
 * Provides a centralized way to handle all logs with different log levels
 * In production, only warnings and errors are logged
 */

// Environment check to enable/disable logging
const isDevelopment = import.meta.env.DEV;
// In production, only log errors to minimize performance impact
const LOG_LEVEL = isDevelopment ? 'debug' : 'error';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
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
  return `[${module}] ${message}`;
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
    
    const startTime = performance.now();
    const formattedName = formatMessage(module, operationName);
    console.time(formattedName);
    
    return () => {
      console.timeEnd(formattedName);
      const duration = performance.now() - startTime;
      
      if (duration > thresholdMs) {
        logger.warn(module, `Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
    };
  }
};

export default logger;