/**
 * Comprehensive Logging System
 * - Logs all frontend and backend activities
 * - Measures request performance
 * - Writes to timestamped log files
 * - Creates logs in own folder for easy location
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Get current date for filename
const getDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Get timestamp for log entries
const getTimestamp = () => {
    return new Date().toISOString();
};

// Log file paths
const getLogFilePath = (type) => {
    return path.join(logsDir, `${type}-${getDateString()}.log`);
};

// Main application log
const appLogFile = getLogFilePath('app');
const errorLogFile = getLogFilePath('error');
const accessLogFile = getLogFilePath('access');
const performanceLogFile = getLogFilePath('performance');
const frontendLogFile = getLogFilePath('frontend');
const databaseLogFile = getLogFilePath('database');

// Write to log file
const writeToLog = (filePath, level, message, data = null) => {
    const timestamp = getTimestamp();
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
        if (data instanceof Error) {
            logEntry += `\n  Error: ${data.message}\n  Stack: ${data.stack}`;
        } else if (typeof data === 'object') {
            try {
                logEntry += `\n  Data: ${JSON.stringify(data, null, 2)}`;
            } catch (e) {
                logEntry += `\n  Data: [Object cannot be stringified]`;
            }
        } else {
            logEntry += `\n  Data: ${data}`;
        }
    }

    logEntry += '\n';

    fs.appendFileSync(filePath, logEntry);

    // Also output to console with colors
    const colors = {
        INFO: '\x1b[36m',     // Cyan
        WARN: '\x1b[33m',     // Yellow
        ERROR: '\x1b[31m',    // Red
        DEBUG: '\x1b[35m',    // Magenta
        SUCCESS: '\x1b[32m',  // Green
        RESET: '\x1b[0m'      // Reset
    };

    const color = colors[level] || colors.INFO;
    console.log(`${color}[${level}]${colors.RESET} ${message}`);
};

// ============ Logger API ============

const logger = {
    // Info level logging
    info: (message, data) => {
        writeToLog(appLogFile, 'INFO', message, data);
    },

    // Warning level logging
    warn: (message, data) => {
        writeToLog(appLogFile, 'WARN', message, data);
    },

    // Error level logging
    error: (message, data) => {
        writeToLog(errorLogFile, 'ERROR', message, data);
        writeToLog(appLogFile, 'ERROR', message, data);
    },

    // Debug level logging
    debug: (message, data) => {
        writeToLog(appLogFile, 'DEBUG', message, data);
    },

    // Success logging
    success: (message, data) => {
        writeToLog(appLogFile, 'SUCCESS', message, data);
    },

    // Database operations logging
    database: (message, data) => {
        writeToLog(databaseLogFile, 'INFO', message, data);
    },

    // Access logging (API requests)
    access: (req, res, duration) => {
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
        };

        const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
        writeToLog(accessLogFile, level, `${req.method} ${req.url}`, logData);
    },

    // Performance logging
    performance: (label, duration, details = {}) => {
        const perfData = {
            operation: label,
            duration: `${duration}ms`,
            ...details
        };

        const level = duration > 1000 ? 'WARN' : 'INFO';
        writeToLog(performanceLogFile, level, `Performance: ${label}`, perfData);
    },

    // Frontend event logging
    frontend: (eventType, data) => {
        writeToLog(frontendLogFile, 'INFO', `Frontend: ${eventType}`, data);
    },

    // Request/Response logging middleware for Express
    middleware: () => {
        return (req, res, next) => {
            const startTime = Date.now();

            // Capture original end function
            const originalEnd = res.end;
            res.end = function (chunk, encoding) {
                res.end = originalEnd;
                res.end(chunk, encoding);

                const duration = Date.now() - startTime;
                logger.access(req, res, duration);

                // Log slow requests
                if (duration > 1000) {
                    logger.performance('SLOW_REQUEST', duration, {
                        method: req.method,
                        url: req.url
                    });
                }
            };

            next();
        };
    },

    // Log startup
    startup: (service, port) => {
        const message = `${service} started successfully`;
        const data = { service, port, timestamp: getTimestamp() };
        writeToLog(appLogFile, 'SUCCESS', message, data);
    },

    // Log shutdown
    shutdown: (service) => {
        const message = `${service} shutting down`;
        const data = { service, timestamp: getTimestamp() };
        writeToLog(appLogFile, 'INFO', message, data);
    },

    // Get log file paths for reference
    getLogPaths: () => ({
        app: appLogFile,
        error: errorLogFile,
        access: accessLogFile,
        performance: performanceLogFile,
        frontend: frontendLogFile,
        database: databaseLogFile
    }),

    // Log user action (clicks, navigation, etc.)
    userAction: (action, details) => {
        writeToLog(appLogFile, 'INFO', `User Action: ${action}`, {
            ...details,
            timestamp: getTimestamp()
        });
    },

    // Log authentication events
    auth: (event, userId, details) => {
        const logData = {
            event,
            userId,
            ...details,
            timestamp: getTimestamp()
        };

        const level = event.includes('FAILED') || event.includes('ERROR') ? 'ERROR' : 'INFO';
        writeToLog(accessLogFile, level, `Auth: ${event}`, logData);
    }
};

// Console startup message
console.log('\n========================================');
console.log('📝 Logging System Initialized');
console.log('========================================');
console.log('📁 Log files location:');
console.log(`   ${logsDir}`);
console.log('   - app-YYYY-MM-DD.log');
console.log('   - error-YYYY-MM-DD.log');
console.log('   - access-YYYY-MM-DD.log');
console.log('   - performance-YYYY-MM-DD.log');
console.log('   - frontend-YYYY-MM-DD.log');
console.log('   - database-YYYY-MM-DD.log');
console.log('========================================\n');

module.exports = logger;
