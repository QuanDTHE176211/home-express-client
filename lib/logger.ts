/**
 * Structured Logging Utility
 * 
 * Provides consistent logging across the application with support for
 * external monitoring services (Sentry, LogRocket, etc.)
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   
 *   logger.error('API call failed', { url, error })
 *   logger.warn('Slow response', { duration })
 *   logger.info('User action', { action: 'click', target: 'button' })
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  url?: string
  userAgent?: string
  userId?: string
}

class Logger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development"
    this.isProduction = process.env.NODE_ENV === "production"
  }

  /**
   * Format log entry for console output
   */
  private formatConsoleLog(entry: LogEntry): string {
    const { level, message, context, timestamp } = entry
    const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  /**
   * Get current user ID from localStorage (if available)
   */
  private getUserId(): string | undefined {
    if (typeof window === "undefined") return undefined
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.user_id?.toString()
      }
    } catch {
      return undefined
    }
  }

  /**
   * Create log entry with metadata
   */
  private createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    }

    // Add browser context if available
    if (typeof window !== "undefined") {
      entry.url = window.location.href
      entry.userAgent = navigator.userAgent
      entry.userId = this.getUserId()
    }

    return entry
  }

  /**
   * Send log to external monitoring service
   */
  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with monitoring service
    // Examples:
    
    // Sentry
    // if (window.Sentry && entry.level === 'error') {
    //   window.Sentry.captureException(new Error(entry.message), {
    //     extra: entry.context,
    //     tags: { userId: entry.userId }
    //   })
    // }

    // LogRocket
    // if (window.LogRocket) {
    //   window.LogRocket.log(entry.level, entry.message, entry.context)
    // }

    // Custom API endpoint
    // if (this.isProduction) {
    //   fetch('/api/logs', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(entry)
    //   }).catch(() => {}) // Fail silently
    // }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return

    const entry = this.createLogEntry("debug", message, context)
    console.debug(this.formatConsoleLog(entry))
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry("info", message, context)
    console.log(this.formatConsoleLog(entry))

    if (this.isProduction) {
      this.sendToMonitoring(entry)
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry("warn", message, context)
    console.warn(this.formatConsoleLog(entry))

    if (this.isProduction) {
      this.sendToMonitoring(entry)
    }
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    const entry = this.createLogEntry("error", message, context)
    console.error(this.formatConsoleLog(entry))

    // Always send errors to monitoring
    this.sendToMonitoring(entry)
  }

  /**
   * Measure and log API call performance
   */
  async measureAPICall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const startTime = new Date().toISOString()

    try {
      const result = await fn()
      const duration = performance.now() - start

      this.info(`API Call: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        startTime,
        success: true,
      })

      // Warn if slow
      if (duration > 3000) {
        this.warn(`Slow API Call: ${name}`, {
          duration: `${duration.toFixed(2)}ms`,
          threshold: "3000ms",
        })
      }

      return result
    } catch (error: any) {
      const duration = performance.now() - start

      this.error(`API Call Failed: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        startTime,
        error: error.message,
        stack: error.stack,
      })

      throw error
    }
  }

  /**
   * Log user action for analytics
   */
  logUserAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      category: "user_action",
    })
  }

  /**
   * Log page view
   */
  logPageView(path: string, context?: LogContext): void {
    this.info(`Page View: ${path}`, {
      ...context,
      category: "page_view",
    })
  }

  /**
   * Log form submission
   */
  logFormSubmit(formName: string, success: boolean, context?: LogContext): void {
    const level = success ? "info" : "warn"
    const message = `Form ${success ? "Submitted" : "Failed"}: ${formName}`

    if (level === "info") {
      this.info(message, { ...context, category: "form_submit" })
    } else {
      this.warn(message, { ...context, category: "form_submit" })
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for external use
export type { LogLevel, LogContext, LogEntry }

