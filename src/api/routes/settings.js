const express = require('express');
const router = express.Router();
const sqliteService = require('../../services/database/sqlite');
const arcaService = require('../../services/database/arca');
const cloudSyncService = require('../../services/sync/cloud-sync');
const config = require('../../../config/database');
const { logger } = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// GET /api/settings/database-status
router.get('/database-status', async (req, res) => {
  try {
    const status = {
      sqlite: {
        connected: sqliteService.isConnected,
        path: config.sqlite.path,
        size: null,
        lastBackup: null
      },
      arca: {
        connected: arcaService.isConnected,
        server: config.arca.server,
        database: config.arca.database,
        user: config.arca.user,
        lastConnection: null
      },
      cloudSync: {
        connected: cloudSyncService.isConnected,
        enabled: config.cloud.enabled,
        provider: config.cloud.provider,
        lastSync: cloudSyncService.lastSyncTime
      }
    };

    // Get SQLite file size
    try {
      const stats = await fs.stat(config.sqlite.path);
      status.sqlite.size = Math.round(stats.size / 1024 / 1024 * 100) / 100; // MB
    } catch (error) {
      status.sqlite.size = 0;
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Error fetching database status', error);
    // Return safe fallback instead of 500
    res.json({
      success: true,
      data: {
        sqlite: {
          connected: false,
          path: 'Unknown',
          size: 0,
          lastBackup: null
        },
        arca: {
          connected: false,
          server: 'Unknown',
          database: 'Unknown',
          user: 'Unknown',
          lastConnection: null
        },
        cloudSync: {
          connected: false,
          enabled: false,
          provider: 'Unknown',
          lastSync: null
        }
      }
    });
  }
});

// POST /api/settings/test-arca-connection
router.post('/test-arca-connection', async (req, res) => {
  try {
    const { server, database, user, password } = req.body;

    if (!server || !database || !user || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tutti i campi sono obbligatori'
      });
    }

    // Create temporary connection config
    const tempConfig = {
      server: server,
      port: config.arca.port,
      database: database,
      user: user,
      password: password,
      options: config.arca.options,
      pool: config.arca.pool
    };

    // Test connection
    const sql = require('mssql');
    const tempPool = new sql.ConnectionPool(tempConfig);
    
    try {
      await tempPool.connect();
      const result = await tempPool.request().query('SELECT 1 as test');
      await tempPool.close();

      res.json({
        success: true,
        message: 'Connessione al database ARCA riuscita!',
        data: {
          server: server,
          database: database,
          user: user,
          connected: true
        }
      });

    } catch (connectionError) {
      await tempPool.close().catch(() => {});
      
      res.json({
        success: false,
        error: 'Connessione fallita: ' + connectionError.message,
        details: {
          code: connectionError.code,
          server: server,
          database: database
        }
      });
    }

  } catch (error) {
    logger.error('Error testing ARCA connection', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il test di connessione'
    });
  }
});

// POST /api/settings/save-database-config
router.post('/save-database-config', async (req, res) => {
  try {
    const { arca, cloudSync } = req.body;

    // Save to environment variables or config file
    const configPath = path.join(__dirname, '../../../.env');
    let envContent = '';

    try {
      envContent = await fs.readFile(configPath, 'utf8');
    } catch (error) {
      // File doesn't exist, create new
      envContent = '';
    }

    // Update ARCA configuration
    if (arca) {
      envContent = updateEnvVariable(envContent, 'DB_ARCA_HOST', arca.server);
      envContent = updateEnvVariable(envContent, 'DB_ARCA_DATABASE', arca.database);
      envContent = updateEnvVariable(envContent, 'DB_ARCA_USER', arca.user);
      if (arca.password) {
        envContent = updateEnvVariable(envContent, 'DB_ARCA_PASSWORD', arca.password);
      }
    }

    // Update Cloud Sync configuration
    if (cloudSync) {
      envContent = updateEnvVariable(envContent, 'CLOUD_SYNC_ENABLED', cloudSync.enabled.toString());
      if (cloudSync.url) {
        envContent = updateEnvVariable(envContent, 'CLOUD_SYNC_URL', cloudSync.url);
      }
      if (cloudSync.key) {
        envContent = updateEnvVariable(envContent, 'CLOUD_SYNC_KEY', cloudSync.key);
      }
    }

    await fs.writeFile(configPath, envContent);

    res.json({
      success: true,
      message: 'Configurazione salvata. Riavvia il server per applicare le modifiche.'
    });

  } catch (error) {
    logger.error('Error saving database config', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il salvataggio della configurazione'
    });
  }
});

// GET /api/settings/database-tables
router.get('/database-tables', async (req, res) => {
  try {
    const { database_type } = req.query;

    if (database_type === 'arca') {
      if (!arcaService.isConnected) {
        return res.status(503).json({
          success: false,
          error: 'Database ARCA non connesso'
        });
      }

      // Get ARCA tables
      const query = `
        SELECT 
          TABLE_NAME as nome,
          TABLE_TYPE as tipo
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME IN ('CF', 'SC', 'DOTes', 'DORig', 'DOTotali', 'AR', 'ARCategoria')
        ORDER BY TABLE_NAME
      `;

      const result = await arcaService.pool.request().query(query);
      
      res.json({
        success: true,
        data: result.recordset
      });

    } else if (database_type === 'sqlite') {
      const tables = await sqliteService.db.prepare(`
        SELECT name as nome, type as tipo 
        FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `).all();

      res.json({
        success: true,
        data: tables
      });

    } else {
      res.status(400).json({
        success: false,
        error: 'Tipo database non valido'
      });
    }

  } catch (error) {
    logger.error('Error fetching database tables', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle tabelle'
    });
  }
});

// POST /api/settings/backup-database
router.post('/backup-database', async (req, res) => {
  try {
    const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    const backupPath = path.join(config.sqlite.backup.path, backupName);

    // Ensure backup directory exists
    await fs.mkdir(config.sqlite.backup.path, { recursive: true });

    // Copy SQLite database
    await fs.copyFile(config.sqlite.path, backupPath);

    res.json({
      success: true,
      message: 'Backup creato con successo',
      data: {
        filename: backupName,
        path: backupPath,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error creating database backup', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione del backup'
    });
  }
});

// Utility function to update environment variables
function updateEnvVariable(envContent, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}=${value}`;
  
  if (regex.test(envContent)) {
    return envContent.replace(regex, newLine);
  } else {
    return envContent + (envContent.endsWith('\n') ? '' : '\n') + newLine + '\n';
  }
}

module.exports = router;