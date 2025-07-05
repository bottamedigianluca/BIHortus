const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../../../config/database');

class SQLiteService {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Assicurati che la directory esista
      const dbDir = path.dirname(config.sqlite.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Connessione al database
      this.db = new Database(config.sqlite.path, config.sqlite.options);
      
      // Inizializza schema se necessario
      await this.initializeSchema();
      
      this.isConnected = true;
      console.log('✅ SQLite database connected successfully');
      
      return this.db;
    } catch (error) {
      console.error('❌ SQLite connection failed:', error);
      throw error;
    }
  }

  async initializeSchema() {
    const schema = `
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Reconciliation Records
      CREATE TABLE IF NOT EXISTS reconciliation_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_movement_id TEXT NOT NULL,
        bank_date DATE NOT NULL,
        bank_amount DECIMAL(15,2) NOT NULL,
        bank_description TEXT NOT NULL,
        bank_reference TEXT,
        arca_scadenza_id INTEGER,
        arca_cliente_code TEXT,
        arca_fattura_numero TEXT,
        arca_importo DECIMAL(15,2),
        match_score DECIMAL(5,2),
        match_type TEXT, -- 'auto', 'manual', 'fuzzy'
        status TEXT DEFAULT 'pending', -- 'pending', 'matched', 'approved', 'rejected'
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        approved_by INTEGER,
        approved_at DATETIME,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (approved_by) REFERENCES users (id)
      );

      -- Bank Movements
      CREATE TABLE IF NOT EXISTS bank_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT UNIQUE NOT NULL,
        account_number TEXT NOT NULL,
        date DATE NOT NULL,
        value_date DATE,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT NOT NULL,
        reference TEXT,
        transaction_type TEXT,
        counterpart TEXT,
        reconciled BOOLEAN DEFAULT FALSE,
        reconciliation_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reconciliation_id) REFERENCES reconciliation_records (id)
      );

      -- Analytics Cache
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL, -- JSON data
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sync Status
      CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        last_sync DATETIME,
        sync_hash TEXT,
        records_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'error'
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Settings
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Audit Log
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- 'create', 'update', 'delete'
        old_values TEXT, -- JSON
        new_values TEXT, -- JSON
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Indici per performance
      CREATE INDEX IF NOT EXISTS idx_reconciliation_status ON reconciliation_records(status);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_bank_date ON reconciliation_records(bank_date);
      CREATE INDEX IF NOT EXISTS idx_bank_movements_date ON bank_movements(date);
      CREATE INDEX IF NOT EXISTS idx_bank_movements_account ON bank_movements(account_number);
      CREATE INDEX IF NOT EXISTS idx_bank_movements_reconciled ON bank_movements(reconciled);
      CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sync_status_table ON sync_status(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);

      -- Triggers per audit
      CREATE TRIGGER IF NOT EXISTS tr_reconciliation_audit_update
        AFTER UPDATE ON reconciliation_records
        FOR EACH ROW
        BEGIN
          INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
          VALUES ('reconciliation_records', NEW.id, 'update', 
                  json_object('status', OLD.status, 'match_score', OLD.match_score),
                  json_object('status', NEW.status, 'match_score', NEW.match_score),
                  NEW.updated_by);
        END;
    `;

    this.db.exec(schema);
    console.log('✅ Database schema initialized');
  }

  // Reconciliation Methods
  async createReconciliationRecord(data) {
    const stmt = this.db.prepare(`
      INSERT INTO reconciliation_records (
        bank_movement_id, bank_date, bank_amount, bank_description, bank_reference,
        arca_scadenza_id, arca_cliente_code, arca_fattura_numero, arca_importo,
        match_score, match_type, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      data.bank_movement_id,
      data.bank_date,
      data.bank_amount,
      data.bank_description,
      data.bank_reference,
      data.arca_scadenza_id,
      data.arca_cliente_code,
      data.arca_fattura_numero,
      data.arca_importo,
      data.match_score,
      data.match_type,
      data.status || 'pending',
      data.notes,
      data.created_by
    );
  }

  async getReconciliationRecords(filters = {}) {
    let query = `
      SELECT 
        r.*,
        u1.username as created_by_name,
        u2.username as approved_by_name
      FROM reconciliation_records r
      LEFT JOIN users u1 ON r.created_by = u1.id
      LEFT JOIN users u2 ON r.approved_by = u2.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += ' AND r.bank_date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND r.bank_date <= ?';
      params.push(filters.date_to);
    }

    if (filters.min_amount) {
      query += ' AND r.bank_amount >= ?';
      params.push(filters.min_amount);
    }

    query += ' ORDER BY r.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  async updateReconciliationRecord(id, data) {
    const fields = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (fields.length === 0) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE reconciliation_records 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `;

    return this.db.prepare(query).run(...params);
  }

  // Bank Movements Methods
  async insertBankMovements(movements) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO bank_movements (
        external_id, account_number, date, value_date, amount, 
        description, reference, transaction_type, counterpart
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((movements) => {
      for (const movement of movements) {
        stmt.run(
          movement.external_id,
          movement.account_number,
          movement.date,
          movement.value_date,
          movement.amount,
          movement.description,
          movement.reference,
          movement.transaction_type,
          movement.counterpart
        );
      }
    });

    return transaction(movements);
  }

  async getBankMovements(filters = {}) {
    let query = `
      SELECT * FROM bank_movements 
      WHERE 1=1
    `;

    const params = [];

    if (filters.reconciled !== undefined) {
      query += ' AND reconciled = ?';
      params.push(filters.reconciled);
    }

    if (filters.date_from) {
      query += ' AND date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND date <= ?';
      params.push(filters.date_to);
    }

    if (filters.account_number) {
      query += ' AND account_number = ?';
      params.push(filters.account_number);
    }

    query += ' ORDER BY date DESC, id DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  // Analytics Cache Methods
  async getCachedAnalytics(key) {
    const stmt = this.db.prepare(`
      SELECT data FROM analytics_cache 
      WHERE cache_key = ? AND expires_at > datetime('now')
    `);

    const result = stmt.get(key);
    return result ? JSON.parse(result.data) : null;
  }

  async setCachedAnalytics(key, data, ttl = 3600) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO analytics_cache (cache_key, data, expires_at) 
      VALUES (?, ?, datetime('now', '+${ttl} seconds'))
    `);

    return stmt.run(key, JSON.stringify(data));
  }

  // Settings Methods
  async getSetting(key) {
    const stmt = this.db.prepare('SELECT value, type FROM settings WHERE key = ?');
    const result = stmt.get(key);
    
    if (!result) return null;
    
    const { value, type } = result;
    switch (type) {
      case 'number': return parseFloat(value);
      case 'boolean': return value === 'true';
      case 'json': return JSON.parse(value);
      default: return value;
    }
  }

  async setSetting(key, value, type = 'string', description = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, type, description, updated_at) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const stringValue = type === 'json' ? JSON.stringify(value) : String(value);
    return stmt.run(key, stringValue, type, description);
  }

  // Utility Methods
  async getStats() {
    const queries = {
      total_reconciliation_records: 'SELECT COUNT(*) as count FROM reconciliation_records',
      pending_reconciliations: 'SELECT COUNT(*) as count FROM reconciliation_records WHERE status = "pending"',
      total_bank_movements: 'SELECT COUNT(*) as count FROM bank_movements',
      unreconciled_movements: 'SELECT COUNT(*) as count FROM bank_movements WHERE reconciled = FALSE',
      last_sync: 'SELECT MAX(last_sync) as last_sync FROM sync_status'
    };

    const stats = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = this.db.prepare(query).get();
      stats[key] = result.count !== undefined ? result.count : result.last_sync;
    }

    return stats;
  }

  async backup() {
    if (!config.sqlite.backup.enabled) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(config.sqlite.backup.path, `bihortus_${timestamp}.db`);
    
    // Assicurati che la directory di backup esista
    if (!fs.existsSync(config.sqlite.backup.path)) {
      fs.mkdirSync(config.sqlite.backup.path, { recursive: true });
    }

    await this.db.backup(backupPath);
    console.log(`✅ Database backup created: ${backupPath}`);
    return backupPath;
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.isConnected = false;
      console.log('✅ SQLite database connection closed');
    }
  }
}

module.exports = new SQLiteService();