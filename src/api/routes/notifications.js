const express = require('express');
const router = express.Router();
const sqliteService = require('../../services/database/sqlite');
const arcaService = require('../../services/database/arca');

// GET /api/notifications - Ottieni notifiche
router.get('/', async (req, res) => {
  try {
    const { limit = 10, unread_only = false } = req.query;
    
    // Carica notifiche dal sistema locale
    let query = `
      SELECT 
        id,
        title,
        message,
        type,
        read,
        created_at
      FROM notifications 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (unread_only === 'true') {
      query += ' AND read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    let notifications = [];
    
    try {
      notifications = await sqliteService.db.prepare(query).all(...params);
    } catch (error) {
      // Se la tabella notifications non esiste, creala
      await sqliteService.db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          read BOOLEAN DEFAULT 0,
          user_id INTEGER,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);
      
      // Genera notifiche dal sistema di auditing
      notifications = await generateSystemNotifications(limit);
    }

    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    // Return empty array instead of 500 error
    res.json([]);
  }
});

// POST /api/notifications - Crea notifica
router.post('/', async (req, res) => {
  try {
    const { title, message, type = 'info', user_id = null } = req.body;
    
    // Crea tabella se non esiste
    await sqliteService.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read BOOLEAN DEFAULT 0,
        user_id INTEGER,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    const result = await sqliteService.db.prepare(`
      INSERT INTO notifications (title, message, type, user_id)
      VALUES (?, ?, ?, ?)
    `).run(title, message, type, user_id);
    
    res.json({
      success: true,
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Errore nella creazione notifica' });
  }
});

// PUT /api/notifications/:id/read - Marca notifica come letta
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await sqliteService.db.prepare(`
      UPDATE notifications 
      SET read = 1 
      WHERE id = ?
    `).run(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento notifica' });
  }
});

// GET /api/notifications/system - Notifiche di sistema generate automaticamente
router.get('/system', async (req, res) => {
  try {
    const notifications = [];
    
    // Controlla scadenze imminenti
    if (arcaService.isConnected) {
      const scadenzeImminenti = await arcaService.getScadenzeAperte({
        solo_scadute: false,
        data_scadenza_a: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 giorni
        limit: 5
      });
      
      scadenzeImminenti.forEach(scadenza => {
        const giorni = Math.floor((new Date(scadenza.DataScadenza) - new Date()) / (24 * 60 * 60 * 1000));
        
        if (giorni <= 0) {
          notifications.push({
            id: `scadenza_${scadenza.Id_SC}`,
            title: 'Scadenza in ritardo',
            message: `${scadenza.Cliente}: €${scadenza.ImportoE.toLocaleString()} scaduta da ${Math.abs(giorni)} giorni`,
            type: 'error',
            read: false,
            created_at: new Date().toISOString()
          });
        } else if (giorni <= 3) {
          notifications.push({
            id: `scadenza_${scadenza.Id_SC}`,
            title: 'Scadenza imminente',
            message: `${scadenza.Cliente}: €${scadenza.ImportoE.toLocaleString()} scade tra ${giorni} giorni`,
            type: 'warning',
            read: false,
            created_at: new Date().toISOString()
          });
        }
      });
    }
    
    // Controlla stato riconciliazioni
    const pendingReconciliations = await sqliteService.db.prepare(`
      SELECT COUNT(*) as count 
      FROM reconciliation_records 
      WHERE status = 'pending'
    `).get();
    
    if (pendingReconciliations.count > 10) {
      notifications.push({
        id: 'pending_reconciliations',
        title: 'Riconciliazioni in sospeso',
        message: `${pendingReconciliations.count} riconciliazioni richiedono attenzione`,
        type: 'info',
        read: false,
        created_at: new Date().toISOString()
      });
    }
    
    // Controlla ultimo backup
    const lastBackup = await sqliteService.getSetting('last_backup');
    if (!lastBackup || (new Date() - new Date(lastBackup)) > 24 * 60 * 60 * 1000) {
      notifications.push({
        id: 'backup_needed',
        title: 'Backup necessario',
        message: 'L\'ultimo backup è stato eseguito più di 24 ore fa',
        type: 'warning',
        read: false,
        created_at: new Date().toISOString()
      });
    }
    
    res.json(notifications);
  } catch (error) {
    console.error('Error getting system notifications:', error);
    res.status(500).json({ error: 'Errore nel recupero notifiche sistema' });
  }
});

// Funzione helper per generare notifiche dal sistema
async function generateSystemNotifications(limit) {
  try {
    // Genera notifiche basate sull'audit log
    const recentActivities = await sqliteService.db.prepare(`
      SELECT 
        table_name,
        action,
        created_at,
        new_values
      FROM audit_log 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
    
    return recentActivities.map((activity, index) => ({
      id: index + 1,
      title: getActivityTitle(activity),
      message: getActivityMessage(activity),
      type: getActivityType(activity),
      read: false,
      created_at: activity.created_at
    }));
  } catch (error) {
    return [];
  }
}

function getActivityTitle(activity) {
  switch (activity.table_name) {
    case 'reconciliation_records':
      return activity.action === 'create' ? 'Nuova riconciliazione' : 'Riconciliazione aggiornata';
    case 'bank_movements':
      return 'Movimento bancario';
    case 'settings':
      return 'Impostazione modificata';
    default:
      return 'Attività sistema';
  }
}

function getActivityMessage(activity) {
  switch (activity.table_name) {
    case 'reconciliation_records':
      return activity.action === 'create' ? 
        'È stata creata una nuova riconciliazione' : 
        'Una riconciliazione è stata aggiornata';
    case 'bank_movements':
      return 'È stato importato un nuovo movimento bancario';
    case 'settings':
      return 'Una impostazione del sistema è stata modificata';
    default:
      return `Attività ${activity.action} su ${activity.table_name}`;
  }
}

function getActivityType(activity) {
  switch (activity.action) {
    case 'create':
      return 'success';
    case 'update':
      return 'info';
    case 'delete':
      return 'warning';
    default:
      return 'info';
  }
}

module.exports = router;