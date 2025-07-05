const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Assicurati che la directory logs esista
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurazione del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bihortus' },
  transports: [
    // File di log per errori
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File di log combinato
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File di log per sync
    new winston.transports.File({
      filename: path.join(logsDir, 'sync.log'),
      level: 'info',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          // Solo log relativi al sync
          if (meta.component === 'sync' || message.includes('sync') || message.includes('Sync')) {
            return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          }
          return null;
        })
      )
    }),
    
    // File di log per riconciliazione
    new winston.transports.File({
      filename: path.join(logsDir, 'reconciliation.log'),
      level: 'info',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          // Solo log relativi alla riconciliazione
          if (meta.component === 'reconciliation' || message.includes('riconciliazione') || message.includes('Riconciliazione')) {
            return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          }
          return null;
        })
      )
    })
  ]
});

// Se non in produzione, logga anche su console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}] ${message} ${metaString}`;
      })
    )
  }));
}

// Logger specializzato per sync
const syncLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bihortus', component: 'sync' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'sync.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Logger specializzato per riconciliazione
const reconciliationLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bihortus', component: 'reconciliation' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'reconciliation.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Logger specializzato per database
const databaseLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bihortus', component: 'database' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'database.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Utility functions per logging strutturato
const logUtils = {
  // Log per operazioni di sync
  syncStart: (operation, metadata = {}) => {
    syncLogger.info(`🔄 Sync operation started: ${operation}`, metadata);
  },
  
  syncSuccess: (operation, metadata = {}) => {
    syncLogger.info(`✅ Sync operation completed: ${operation}`, metadata);
  },
  
  syncError: (operation, error, metadata = {}) => {
    syncLogger.error(`❌ Sync operation failed: ${operation}`, { 
      error: error.message, 
      stack: error.stack,
      ...metadata 
    });
  },
  
  // Log per riconciliazione
  reconciliationStart: (operation, metadata = {}) => {
    reconciliationLogger.info(`🔄 Reconciliation operation started: ${operation}`, metadata);
  },
  
  reconciliationSuccess: (operation, metadata = {}) => {
    reconciliationLogger.info(`✅ Reconciliation operation completed: ${operation}`, metadata);
  },
  
  reconciliationError: (operation, error, metadata = {}) => {
    reconciliationLogger.error(`❌ Reconciliation operation failed: ${operation}`, { 
      error: error.message, 
      stack: error.stack,
      ...metadata 
    });
  },
  
  // Log per database
  dbQuery: (query, params = {}, executionTime = null) => {
    databaseLogger.info('📊 Database query executed', { 
      query: query.substring(0, 100), 
      params, 
      executionTime 
    });
  },
  
  dbError: (operation, error, metadata = {}) => {
    databaseLogger.error(`❌ Database operation failed: ${operation}`, { 
      error: error.message, 
      stack: error.stack,
      ...metadata 
    });
  },
  
  // Log per performance
  performanceStart: (operation) => {
    const startTime = Date.now();
    return {
      operation,
      startTime,
      end: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        logger.info(`⏱️ Performance: ${operation} completed in ${duration}ms`);
        return duration;
      }
    };
  },
  
  // Log per sicurezza
  securityEvent: (event, metadata = {}) => {
    logger.warn(`🔒 Security event: ${event}`, metadata);
  },
  
  // Log per audit
  auditLog: (action, userId, resource, metadata = {}) => {
    logger.info(`📝 Audit: ${action}`, { 
      userId, 
      resource, 
      timestamp: new Date().toISOString(),
      ...metadata 
    });
  }
};

module.exports = {
  logger,
  syncLogger,
  reconciliationLogger,
  databaseLogger,
  logUtils
};