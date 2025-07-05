const path = require('path');
const os = require('os');

const config = {
  // SQLite Configuration (Primary Database)
  sqlite: {
    path: process.env.DB_SQLITE_PATH || path.join(__dirname, '../database/sqlite/bihortus.db'),
    backup: {
      enabled: process.env.BACKUP_ENABLED === 'true',
      interval: process.env.BACKUP_INTERVAL || 'daily',
      retention: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      path: process.env.BACKUP_PATH || path.join(__dirname, '../database/backups')
    },
    encryption: {
      enabled: process.env.DB_ENCRYPTION === 'true',
      key: process.env.ENCRYPTION_KEY
    },
    options: {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null,
      timeout: parseInt(process.env.QUERY_TIMEOUT || '30000'),
      fileMustExist: false
    }
  },

  // Arca Evolution Database (Read-Only)
  arca: {
    server: process.env.DB_ARCA_HOST || '172.29.0.1', // Windows host IP from WSL
    port: parseInt(process.env.DB_ARCA_PORT || '1433'),
    database: process.env.DB_ARCA_DATABASE || 'ADB_BOTTAMEDI',
    user: process.env.DB_ARCA_USER || 'bihortus_reader',
    password: process.env.DB_ARCA_PASSWORD || 'BiHortus2025!',
    options: {
      encrypt: process.env.DB_ARCA_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_ARCA_TRUST_SERVER_CERTIFICATE !== 'false',
      requestTimeout: parseInt(process.env.QUERY_TIMEOUT || '30000'),
      connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '15000'),
      enableArithAbort: true,
      appName: 'BiHortus-Enterprise'
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000
    }
  },

  // Cloud Sync Configuration
  cloud: {
    enabled: process.env.CLOUD_SYNC_ENABLED === 'true',
    provider: process.env.CLOUD_SYNC_PROVIDER || 'supabase',
    config: {
      supabase: {
        url: process.env.CLOUD_SYNC_URL,
        key: process.env.CLOUD_SYNC_KEY,
        schema: 'public',
        table_prefix: 'bihortus_'
      },
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
      }
    },
    sync: {
      interval: parseInt(process.env.CLOUD_SYNC_INTERVAL || '300000'), // 5 minuti
      tables: ['reconciliation', 'analytics', 'settings', 'users'],
      encryption: true,
      compression: true,
      batchSize: 100,
      maxRetries: 3
    }
  },

  // Performance Settings
  performance: {
    cache: {
      enabled: process.env.CACHE_ENABLED === 'true',
      ttl: parseInt(process.env.CACHE_TTL || '3600'),
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
    },
    connection: {
      poolMin: 2,
      poolMax: 10,
      acquireTimeout: 30000,
      timeout: 30000
    }
  },

  // Security Settings
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h'
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minuti
      max: 100 // requests per windowMs
    }
  }
};

module.exports = config;