/**
 * Structured Logger for Production
 * 
 * Provides consistent logging format with:
 * - Log levels (debug, info, warn, error)
 * - Structured context (JSON-compatible)
 * - Timestamps
 * - Component tagging
 * - Environment-aware output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: string | number | boolean | null | undefined;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: LogContext;
}

// Log level priority (lower = more verbose)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_FORMAT = process.env.LOG_FORMAT || (IS_PRODUCTION ? 'json' : 'pretty');

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (LOG_FORMAT === 'json') {
    return JSON.stringify(entry);
  }
  
  // Pretty format for development
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';
  
  const color = levelColors[entry.level];
  const levelStr = entry.level.toUpperCase().padEnd(5);
  const contextStr = entry.context && Object.keys(entry.context).length > 0
    ? ` ${dim}${JSON.stringify(entry.context)}${reset}`
    : '';
  
  return `${dim}${entry.timestamp}${reset} ${color}${levelStr}${reset} [${entry.component}] ${entry.message}${contextStr}`;
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Create a logger instance for a specific component
 */
export function createLogger(component: string) {
  const log = (level: LogLevel, message: string, context?: LogContext) => {
    if (!shouldLog(level)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      ...(context && Object.keys(context).length > 0 ? { context } : {}),
    };
    
    const formatted = formatLogEntry(entry);
    
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  };
  
  return {
    debug: (message: string, context?: LogContext) => log('debug', message, context),
    info: (message: string, context?: LogContext) => log('info', message, context),
    warn: (message: string, context?: LogContext) => log('warn', message, context),
    error: (message: string, context?: LogContext) => log('error', message, context),
    
    /**
     * Log an error with stack trace
     */
    errorWithStack: (message: string, error: Error, context?: LogContext) => {
      log('error', message, {
        ...context,
        errorMessage: error.message,
        errorName: error.name,
        stack: IS_PRODUCTION ? undefined : error.stack?.split('\n').slice(0, 3).join(' | '),
      });
    },
    
    /**
     * Create a child logger with additional context
     */
    child: (subComponent: string) => createLogger(`${component}:${subComponent}`),
  };
}

/**
 * Pre-configured loggers for common components
 */
export const wsLogger = createLogger('WebSocket');
export const raceLogger = createLogger('Race');
export const cacheLogger = createLogger('Cache');
export const redisLogger = createLogger('Redis');
export const botLogger = createLogger('Bot');
export const antiCheatLogger = createLogger('AntiCheat');
export const rateLimitLogger = createLogger('RateLimit');
export const authLogger = createLogger('Auth');

/**
 * Default logger for general use
 */
export const logger = createLogger('App');
