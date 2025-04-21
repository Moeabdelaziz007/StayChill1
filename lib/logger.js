/**
 * Simple logger for client side.
 * This file is kept for backward compatibility.
 * 
 * WARNING: Direct use of this file is deprecated.
 * Please import { logger } from '@/lib/logger.ts' instead.
 */

// Environment check to enable/disable logging
const isDevelopment = import.meta.env.DEV;

// Custom standalone logger implementation to avoid circular dependencies
export const logger = {
  debug: (module, message, ...data) => {
    if (isDevelopment) {
      console.debug(`[${module}] ${message}`, ...data);
    }
  },
  
  info: (module, message, ...data) => {
    if (isDevelopment) {
      console.info(`[${module}] ${message}`, ...data);
    }
  },
  
  warn: (module, message, ...data) => {
    console.warn(`[${module}] ${message}`, ...data);
  },
  
  error: (module, message, error, ...data) => {
    console.error(`[${module}] ${message}`, error, ...data);
  },
  
  time: (module, operationName, thresholdMs = 500) => {
    if (!isDevelopment) return () => {};
    
    const startTime = performance.now();
    const formattedName = `[${module}] ${operationName}`;
    console.time(formattedName);
    
    return () => {
      console.timeEnd(formattedName);
      const duration = performance.now() - startTime;
      
      if (duration > thresholdMs) {
        console.warn(`[${module}] Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
    };
  }
};

// Legacy methods for backward compatibility
export const log = (...args) => {
  logger.debug('LEGACY', args[0], ...args.slice(1));
};

export const warn = (...args) => {
  logger.warn('LEGACY', args[0], ...args.slice(1));
};

export const error = (...args) => {
  logger.error('LEGACY', args[0], ...args.slice(1));
};