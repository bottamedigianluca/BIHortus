const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const config = require('../../../config/database');
const sqliteService = require('../database/sqlite');
const { logger } = require('../../utils/logger');

class CloudSyncService {
  constructor() {
    this.supabase = null;
    this.isConnected = false;
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.conflictResolutionStrategy = 'server_wins'; // 'server_wins', 'client_wins', 'merge'
  }

  async initialize() {
    try {
      if (!config.cloud.enabled) {
        logger.info('☁️ Cloud sync disabled in configuration');
        return false;
      }

      const cloudConfig = config.cloud.config.supabase;
      if (!cloudConfig.url || !cloudConfig.key) {
        throw new Error('Missing Supabase configuration');
      }

      this.supabase = createClient(cloudConfig.url, cloudConfig.key);
      
      // Test connessione
      const { error } = await this.supabase.from('sync_status').select('*').limit(1);
      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      this.isConnected = true;
      logger.info('✅ Cloud sync service initialized');
      
      // Inizializza schema su cloud se necessario
      await this.initializeCloudSchema();
      
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize cloud sync', error);
      return false;
    }
  }

  async initializeCloudSchema() {
    try {
      // Verifica se le tabelle esistono, se no le crea
      const tables = [
        'bihortus_reconciliation_records',
        'bihortus_bank_movements',
        'bihortus_settings',
        'bihortus_sync_status'
      ];

      for (const table of tables) {
        const { error } = await this.supabase.from(table).select('*').limit(1);
        if (error && error.message.includes('does not exist')) {
          await this.createCloudTable(table);
        }
      }

      logger.info('✅ Cloud schema initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize cloud schema', error);
      throw error;
    }
  }

  async createCloudTable(tableName) {
    // Nota: In un ambiente reale, dovresti usare migration SQL
    // Qui simulo la creazione tabelle
    logger.info(`🔧 Creating cloud table: ${tableName}`);
    
    const schemas = {
      'bihortus_reconciliation_records': {
        id: 'uuid',
        local_id: 'bigint',
        bank_movement_id: 'text',
        bank_date: 'date',
        bank_amount: 'decimal',
        bank_description: 'text',
        arca_scadenza_id: 'bigint',
        match_score: 'decimal',
        status: 'text',
        created_at: 'timestamp',
        updated_at: 'timestamp',
        sync_hash: 'text'
      },
      'bihortus_bank_movements': {
        id: 'uuid',
        local_id: 'bigint',
        external_id: 'text',
        account_number: 'text',
        date: 'date',
        amount: 'decimal',
        description: 'text',
        reconciled: 'boolean',
        created_at: 'timestamp',
        sync_hash: 'text'
      },
      'bihortus_settings': {
        id: 'uuid',
        local_id: 'bigint',
        key: 'text',
        value: 'text',
        type: 'text',
        updated_at: 'timestamp',
        sync_hash: 'text'
      },
      'bihortus_sync_status': {
        id: 'uuid',
        installation_id: 'text',
        table_name: 'text',
        last_sync: 'timestamp',
        records_count: 'bigint',
        sync_hash: 'text',
        status: 'text',
        created_at: 'timestamp',
        updated_at: 'timestamp'
      }
    };

    // In un ambiente reale, useresti SQL DDL qui
    logger.info(`✅ Table ${tableName} schema defined`);
  }

  // Sincronizzazione principale
  async performSync(options = {}) {
    if (this.syncInProgress) {
      logger.warn('⚠️ Sync already in progress, skipping');
      return { success: false, message: 'Sync in progress' };
    }

    if (!this.isConnected) {
      await this.initialize();
    }

    if (!this.isConnected) {
      throw new Error('Cloud sync not available');
    }
    
    try {
      this.syncInProgress = true;
      logger.info('🔄 Starting cloud synchronization');

      const result = {
        success: true,
        synced_tables: [],
        conflicts: [],
        errors: [],
        stats: {
          uploaded: 0,
          downloaded: 0,
          conflicts: 0,
          duration: 0
        }
      };

      const startTime = Date.now();

      // Sincronizza ogni tabella configurata
      for (const tableName of config.cloud.sync.tables) {
        try {
          const tableResult = await this.syncTable(tableName, options);
          result.synced_tables.push(tableResult);
          result.stats.uploaded += tableResult.uploaded;
          result.stats.downloaded += tableResult.downloaded;
          result.stats.conflicts += tableResult.conflicts;
          
          if (tableResult.conflicts > 0) {
            result.conflicts.push(...tableResult.conflict_details);
          }
        } catch (error) {
          const errorInfo = {
            table: tableName,
            error: error.message
          };
          result.errors.push(errorInfo);
          logger.error(`❌ Error syncing table ${tableName}`, error);
        }
      }

      // Aggiorna timestamp ultimo sync
      this.lastSyncTime = new Date();
      await this.updateSyncStatus(result);

      result.stats.duration = Date.now() - startTime;
      logger.info('✅ Cloud synchronization completed', result.stats);

      return result;
    } catch (error) {
      logger.error('❌ Cloud synchronization failed', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sincronizza una singola tabella
  async syncTable(tableName, options = {}) {
    const result = {
      table: tableName,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      conflict_details: []
    };

    try {
      // 1. Carica modifiche locali
      const localChanges = await this.getLocalChanges(tableName);
      
      // 2. Carica modifiche remote
      const remoteChanges = await this.getRemoteChanges(tableName);
      
      // 3. Rileva conflitti
      const conflicts = await this.detectConflicts(localChanges, remoteChanges);
      result.conflicts = conflicts.length;
      
      // 4. Risolvi conflitti
      const resolvedChanges = await this.resolveConflicts(conflicts);
      result.conflict_details = resolvedChanges.filter(c => c.hadConflict);
      
      // 5. Applica modifiche locali al cloud
      if (localChanges.length > 0) {
        await this.uploadToCloud(tableName, localChanges);
        result.uploaded = localChanges.length;
      }
      
      // 6. Applica modifiche remote al local
      if (remoteChanges.length > 0) {
        await this.downloadFromCloud(tableName, remoteChanges);
        result.downloaded = remoteChanges.length;
      }
      
      logger.info(`📊 Table ${tableName} sync completed`, result);
      return result;
    } catch (error) {
      logger.error(`❌ Error syncing table ${tableName}`, error);
      throw error;
    }
  }

  // Carica modifiche locali dalla data ultima sincronizzazione
  async getLocalChanges(tableName) {
    try {
      const lastSync = await this.getLastSyncTime(tableName);
      let query = '';
      
      switch (tableName) {
        case 'reconciliation':
          query = `SELECT * FROM reconciliation_records WHERE updated_at > ?`;
          break;
        case 'analytics':
          query = `SELECT * FROM analytics_cache WHERE created_at > ?`;
          break;
        case 'settings':
          query = `SELECT * FROM settings WHERE updated_at > ?`;
          break;
        default:
          return [];
      }
      
      const params = lastSync ? [lastSync.toISOString()] : ['1970-01-01'];
      const localData = await sqliteService.db.prepare(query).all(...params);
      
      // Aggiungi hash per rilevamento modifiche
      return localData.map(row => ({
        ...row,
        sync_hash: this.generateSyncHash(row),
        source: 'local'
      }));
    } catch (error) {
      logger.error(`❌ Error getting local changes for ${tableName}`, error);
      return [];
    }
  }

  // Carica modifiche remote dalla data ultima sincronizzazione
  async getRemoteChanges(tableName) {
    try {
      const lastSync = await this.getLastSyncTime(tableName);
      const cloudTableName = `bihortus_${tableName}`;
      
      let query = this.supabase.from(cloudTableName).select('*');
      
      if (lastSync) {
        query = query.gt('updated_at', lastSync.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(row => ({
        ...row,
        source: 'remote'
      }));
    } catch (error) {
      logger.error(`❌ Error getting remote changes for ${tableName}`, error);
      return [];
    }
  }

  // Rileva conflitti tra modifiche locali e remote
  async detectConflicts(localChanges, remoteChanges) {
    const conflicts = [];
    
    for (const localChange of localChanges) {
      const remoteConflict = remoteChanges.find(remote => 
        this.areRecordsConflicting(localChange, remote)
      );
      
      if (remoteConflict) {
        conflicts.push({
          local: localChange,
          remote: remoteConflict,
          conflictType: this.getConflictType(localChange, remoteConflict)
        });
      }
    }
    
    return conflicts;
  }

  // Verifica se due record sono in conflitto
  areRecordsConflicting(local, remote) {
    // Stesso record con hash diversi = conflitto
    return local.id === remote.local_id && 
           local.sync_hash !== remote.sync_hash;
  }

  // Determina il tipo di conflitto
  getConflictType(local, remote) {
    const localTime = new Date(local.updated_at);
    const remoteTime = new Date(remote.updated_at);
    
    if (localTime > remoteTime) {
      return 'local_newer';
    } else if (remoteTime > localTime) {
      return 'remote_newer';
    } else {
      return 'same_time';
    }
  }

  // Risolve conflitti basandosi sulla strategia configurata
  async resolveConflicts(conflicts) {
    const resolved = [];
    
    for (const conflict of conflicts) {
      let resolution;
      
      switch (this.conflictResolutionStrategy) {
        case 'server_wins':
          resolution = {
            action: 'use_remote',
            record: conflict.remote,
            hadConflict: true
          };
          break;
          
        case 'client_wins':
          resolution = {
            action: 'use_local',
            record: conflict.local,
            hadConflict: true
          };
          break;
          
        case 'merge':
          resolution = {
            action: 'merge',
            record: await this.mergeRecords(conflict.local, conflict.remote),
            hadConflict: true
          };
          break;
          
        default:
          resolution = {
            action: 'manual',
            record: conflict,
            hadConflict: true
          };
      }
      
      resolved.push(resolution);
      
      logger.info(`⚖️ Conflict resolved: ${conflict.conflictType} -> ${resolution.action}`);
    }
    
    return resolved;
  }

  // Upload modifiche al cloud
  async uploadToCloud(tableName, localChanges) {
    try {
      const cloudTableName = `bihortus_${tableName}`;
      const batchSize = config.cloud.sync.batchSize || 100;
      
      for (let i = 0; i < localChanges.length; i += batchSize) {
        const batch = localChanges.slice(i, i + batchSize);
        
        const cloudRecords = batch.map(record => ({
          local_id: record.id,
          ...this.transformRecordForCloud(record),
          sync_hash: record.sync_hash,
          updated_at: new Date().toISOString()
        }));
        
        const { error } = await this.supabase
          .from(cloudTableName)
          .upsert(cloudRecords, { onConflict: 'local_id' });
        
        if (error) throw error;
      }
      
      logger.info(`☁️ Uploaded ${localChanges.length} records to cloud for ${tableName}`);
    } catch (error) {
      logger.error(`❌ Error uploading to cloud for ${tableName}`, error);
      throw error;
    }
  }

  // Download modifiche dal cloud
  async downloadFromCloud(tableName, remoteChanges) {
    try {
      const batchSize = config.cloud.sync.batchSize || 100;
      
      for (let i = 0; i < remoteChanges.length; i += batchSize) {
        const batch = remoteChanges.slice(i, i + batchSize);
        
        for (const record of batch) {
          const localRecord = this.transformRecordForLocal(record);
          await this.upsertLocalRecord(tableName, localRecord);
        }
      }
      
      logger.info(`📥 Downloaded ${remoteChanges.length} records from cloud for ${tableName}`);
    } catch (error) {
      logger.error(`❌ Error downloading from cloud for ${tableName}`, error);
      throw error;
    }
  }

  // Trasforma record per cloud storage
  transformRecordForCloud(record) {
    const transformed = { ...record };
    
    // Rimuovi campi locali
    delete transformed.id;
    delete transformed.source;
    
    return transformed;
  }

  // Trasforma record per storage locale
  transformRecordForLocal(record) {
    const transformed = { ...record };
    
    // Rimuovi campi cloud
    delete transformed.sync_hash;
    delete transformed.source;
    
    return transformed;
  }

  // Upsert record locale
  async upsertLocalRecord(tableName, record) {
    const queries = {
      reconciliation: `
        INSERT OR REPLACE INTO reconciliation_records 
        (id, bank_movement_id, bank_date, bank_amount, bank_description, 
         arca_scadenza_id, match_score, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      analytics: `
        INSERT OR REPLACE INTO analytics_cache 
        (id, cache_key, data, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      settings: `
        INSERT OR REPLACE INTO settings 
        (id, key, value, type, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `
    };
    
    const query = queries[tableName];
    if (!query) {
      throw new Error(`No upsert query defined for table: ${tableName}`);
    }
    
    // Prepara parametri basandosi sulla tabella
    const params = this.prepareUpsertParams(tableName, record);
    
    await sqliteService.db.prepare(query).run(...params);
  }

  // Prepara parametri per upsert
  prepareUpsertParams(tableName, record) {
    switch (tableName) {
      case 'reconciliation':
        return [
          record.local_id,
          record.bank_movement_id,
          record.bank_date,
          record.bank_amount,
          record.bank_description,
          record.arca_scadenza_id,
          record.match_score,
          record.status,
          record.created_at,
          record.updated_at
        ];
        
      case 'analytics':
        return [
          record.local_id,
          record.cache_key,
          record.data,
          record.expires_at,
          record.created_at
        ];
        
      case 'settings':
        return [
          record.local_id,
          record.key,
          record.value,
          record.type,
          record.updated_at
        ];
        
      default:
        throw new Error(`No parameter mapping for table: ${tableName}`);
    }
  }

  // Utility methods
  generateSyncHash(record) {
    const dataString = JSON.stringify(record, Object.keys(record).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async getLastSyncTime(tableName) {
    try {
      const result = await sqliteService.db
        .prepare('SELECT last_sync FROM sync_status WHERE table_name = ?')
        .get(tableName);
      
      return result ? new Date(result.last_sync) : null;
    } catch (error) {
      return null;
    }
  }

  async updateSyncStatus(result) {
    try {
      for (const tableResult of result.synced_tables) {
        await sqliteService.db
          .prepare(`
            INSERT OR REPLACE INTO sync_status 
            (table_name, last_sync, records_count, status, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `)
          .run(
            tableResult.table,
            new Date().toISOString(),
            tableResult.uploaded + tableResult.downloaded,
            'completed',
            new Date().toISOString()
          );
      }
    } catch (error) {
      logger.error('❌ Error updating sync status', error);
    }
  }

  // Sync scheduling
  scheduleSync() {
    if (!config.cloud.enabled || !this.isConnected) return;
    
    const interval = config.cloud.sync.interval || 300000; // 5 minuti default
    
    setInterval(async () => {
      try {
        await this.performSync();
      } catch (error) {
        logger.error('❌ Scheduled sync failed', error);
      }
    }, interval);
    
    logger.info(`⏰ Sync scheduled every ${interval / 1000} seconds`);
  }

  // Status e monitoring
  async getSyncStatus() {
    try {
      const status = await sqliteService.db
        .prepare('SELECT * FROM sync_status ORDER BY updated_at DESC')
        .all();
      
      return {
        connected: this.isConnected,
        lastSync: this.lastSyncTime,
        syncInProgress: this.syncInProgress,
        tables: status
      };
    } catch (error) {
      logger.error('❌ Error getting sync status', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new CloudSyncService();