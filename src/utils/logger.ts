/**
 * Simple Logger Implementation
 *
 * Provides structured logging for the MCP server with different log levels
 * and contextual information.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: unknown;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private component: string;
  private logLevel: LogLevel;

  constructor(component: string, logLevel: LogLevel = 'info') {
    this.component = component;
    this.logLevel = logLevel;
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Format and output a log entry
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      data,
    };

    const formattedMessage = `[${entry.timestamp}] ${level.toUpperCase()} [${entry.component}] ${entry.message}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data ? data : '');
        break;
      case 'info':
        console.info(formattedMessage, data ? data : '');
        break;
      case 'warn':
        console.warn(formattedMessage, data ? data : '');
        break;
      case 'error':
        console.error(formattedMessage, data ? data : '');
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}
