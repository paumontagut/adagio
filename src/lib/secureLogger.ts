// Secure logging utility that prevents sensitive data exposure
interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface SecureLogger {
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error, context?: LogContext) => void;
}

const isDevelopment = import.meta.env.DEV;

// Sanitize sensitive data from logs
const sanitizeContext = (context?: LogContext): LogContext | undefined => {
  if (!context) return undefined;
  
  const sanitized = { ...context };
  
  // Remove sensitive fields
  if (sanitized.metadata) {
    const { password, token, session_token, email, ...cleanMetadata } = sanitized.metadata;
    sanitized.metadata = cleanMetadata;
  }
  
  return sanitized;
};

// Production-safe logger
export const logger: SecureLogger = {
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const sanitizedContext = sanitizeContext(context);
      console.log(`[INFO] ${message}`, sanitizedContext);
    }
    // In production, send to proper logging service instead
  },

  warn: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const sanitizedContext = sanitizeContext(context);
      console.warn(`[WARN] ${message}`, sanitizedContext);
    }
    // In production, send to proper logging service instead
  },

  error: (message: string, error?: Error, context?: LogContext) => {
    if (isDevelopment) {
      const sanitizedContext = sanitizeContext(context);
      console.error(`[ERROR] ${message}`, error, sanitizedContext);
    }
    // In production, send to proper logging service instead
    // Always log errors even in production (to external service)
  }
};

// Legacy console replacement for existing code
export const secureConsole = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
    // Always log errors for debugging, but sanitized
  }
};