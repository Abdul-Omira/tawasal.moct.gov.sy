/**
 * Production Logging System
 * Replaces console.log with structured, production-ready logging
 * 
 * @author Production Team
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

// Production environment check
const isProduction = process.env.NODE_ENV === 'production';

// Log configuration
const LOG_CONFIG = {
  // In production, only log errors and warnings
  level: isProduction ? LogLevel.WARN : LogLevel.DEBUG,
  // Enable file logging in production
  fileLogging: isProduction,
  // Log directory
  logDir: path.join(process.cwd(), 'logs'),
  // Max file size (10MB)
  maxFileSize: 10 * 1024 * 1024,
  // Keep last 5 log files
  maxFiles: 5
};

// Ensure log directory exists
if (LOG_CONFIG.fileLogging && !fs.existsSync(LOG_CONFIG.logDir)) {
  fs.mkdirSync(LOG_CONFIG.logDir, { recursive: true });
}

/**
 * Production logger class
 */
class ProductionLogger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(LOG_CONFIG.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(LOG_CONFIG.level);
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const formattedMeta = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedMeta}`;
  }

  private writeToFile(message: string): void {
    if (!LOG_CONFIG.fileLogging) return;

    try {
      fs.appendFileSync(this.logFile, message + '\n');
      
      // Check file size and rotate if needed
      const stats = fs.statSync(this.logFile);
      if (stats.size > LOG_CONFIG.maxFileSize) {
        this.rotateLogFile();
      }
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('Failed to write to log file:', error);
    }
  }

  private rotateLogFile(): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = path.join(LOG_CONFIG.logDir, `app-${timestamp}.log`);
      fs.renameSync(this.logFile, rotatedFile);
      
      // Clean up old files
      this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(LOG_CONFIG.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(LOG_CONFIG.logDir, file),
          mtime: fs.statSync(path.join(LOG_CONFIG.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the most recent files
      if (files.length > LOG_CONFIG.maxFiles) {
        files.slice(LOG_CONFIG.maxFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  error(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formatted = this.formatMessage(LogLevel.ERROR, message, meta);
    
    // Always log errors to console in development
    if (!isProduction) {
      console.error(formatted);
    }
    
    this.writeToFile(formatted);
  }

  warn(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formatted = this.formatMessage(LogLevel.WARN, message, meta);
    
    if (!isProduction) {
      console.warn(formatted);
    }
    
    this.writeToFile(formatted);
  }

  info(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formatted = this.formatMessage(LogLevel.INFO, message, meta);
    
    if (!isProduction) {
      console.log(formatted);
    }
    
    this.writeToFile(formatted);
  }

  debug(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formatted = this.formatMessage(LogLevel.DEBUG, message, meta);
    
    if (!isProduction) {
      console.log(formatted);
    }
    
    this.writeToFile(formatted);
  }

  // Security logging (always logged)
  security(message: string, meta?: any): void {
    const formatted = this.formatMessage(LogLevel.ERROR, `SECURITY: ${message}`, meta);
    
    // Always log security events to file
    this.writeToFile(formatted);
    
    // Also log to console in development
    if (!isProduction) {
      console.error(formatted);
    }
  }
}

// Create singleton logger instance
export const logger = new ProductionLogger();

// Convenience functions for common use cases
export const logError = (message: string, meta?: any) => logger.error(message, meta);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);
export const logSecurity = (message: string, meta?: any) => logger.security(message, meta);

// Silent logging (production-safe)
export const silentLog = {
  // Only logs in development, silent in production
  debug: (message: string, meta?: any) => {
    if (!isProduction) {
      console.log(`[DEBUG] ${message}`, meta || '');
    }
  },
  
  // Critical errors that should always be logged
  critical: (message: string, meta?: any) => {
    logger.error(`CRITICAL: ${message}`, meta);
  },
  
  // Security events that should always be logged
  security: (message: string, meta?: any) => {
    logSecurity(message, meta);
  }
}; 