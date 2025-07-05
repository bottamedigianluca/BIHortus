const express = require('express');
const router = express.Router();
const reconciliationService = require('../../services/banking/reconciliation');
const sqliteService = require('../../services/database/sqlite');
const { logger } = require('../../utils/logger');
const multer = require('multer');
const xlsx = require('xlsx');

// Configurazione multer per upload file
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato. Usa CSV o Excel.'));
    }
  }
});

// GET /api/reconciliation/records
router.get('/records', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      min_amount: req.query.min_amount ? parseFloat(req.query.min_amount) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const records = await sqliteService.getReconciliationRecords(filters);
    
    res.json({
      success: true,
      data: records,
      count: records.length
    });
    
  } catch (error) {
    logger.error('Error fetching reconciliation records', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reconciliation records'
    });
  }
});

// GET /api/reconciliation/status
router.get('/status', async (req, res) => {
  try {
    const statusQuery = await sqliteService.db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM reconciliation_records 
      GROUP BY status
    `).all();
    
    const status = {
      pending: 0,
      matched: 0,
      approved: 0,
      rejected: 0
    };
    
    statusQuery.forEach(row => {
      status[row.status] = row.count;
    });
    
    const total = Object.values(status).reduce((sum, count) => sum + count, 0);
    const matchRate = total > 0 ? ((status.matched + status.approved) / total * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        ...status,
        total,
        match_rate: matchRate
      }
    });
    
  } catch (error) {
    logger.error('Error fetching reconciliation status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reconciliation status'
    });
  }
});

// GET /api/reconciliation/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await reconciliationService.getReconciliationDashboard();
    
    res.json({
      success: true,
      data: dashboard
    });
    
  } catch (error) {
    logger.error('Error fetching reconciliation dashboard', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reconciliation dashboard'
    });
  }
});

// POST /api/reconciliation/import-bank-movements
router.post('/import-bank-movements', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file caricato'
      });
    }
    
    // Parse del file
    let movements = [];
    const filePath = req.file.path;
    
    if (req.file.mimetype.includes('csv')) {
      movements = await parseCsvFile(filePath);
    } else {
      movements = await parseExcelFile(filePath);
    }
    
    if (movements.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun movimento valido trovato nel file'
      });
    }
    
    // Processo di riconciliazione
    const options = {
      algorithms: req.body.algorithms ? req.body.algorithms.split(',') : ['combined'],
      minScore: req.body.minScore ? parseFloat(req.body.minScore) : 0.7,
      maxMatches: req.body.maxMatches ? parseInt(req.body.maxMatches) : 5,
      userId: req.body.userId || 1
    };
    
    const result = await reconciliationService.processReconciliation(movements, options);
    
    // Cleanup del file temporaneo
    require('fs').unlinkSync(filePath);
    
    // Notifica real-time
    if (global.io) {
      global.io.emit('reconciliation-completed', {
        stats: result.stats,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: result,
      message: `Processati ${movements.length} movimenti bancari`
    });
    
  } catch (error) {
    logger.error('Error importing bank movements', error);
    
    // Cleanup del file in caso di errore
    if (req.file) {
      try {
        require('fs').unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Failed to cleanup temp file', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to import bank movements'
    });
  }
});

// POST /api/reconciliation/approve/:id
router.post('/approve/:id', async (req, res) => {
  try {
    const reconciliationId = parseInt(req.params.id);
    const { notes, userId } = req.body;
    
    const result = await reconciliationService.approveReconciliation(
      reconciliationId, 
      userId || 1, 
      notes
    );
    
    // Notifica real-time
    if (global.io) {
      global.io.emit('reconciliation-approved', {
        reconciliationId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Error approving reconciliation', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve reconciliation'
    });
  }
});

// POST /api/reconciliation/reject/:id
router.post('/reject/:id', async (req, res) => {
  try {
    const reconciliationId = parseInt(req.params.id);
    const { reason, userId } = req.body;
    
    const result = await reconciliationService.rejectReconciliation(
      reconciliationId, 
      userId || 1, 
      reason
    );
    
    // Notifica real-time
    if (global.io) {
      global.io.emit('reconciliation-rejected', {
        reconciliationId,
        reason,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Error rejecting reconciliation', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject reconciliation'
    });
  }
});

// POST /api/reconciliation/manual
router.post('/manual', async (req, res) => {
  try {
    const { bankMovementId, scadenzaId, notes, userId } = req.body;
    
    if (!bankMovementId || !scadenzaId) {
      return res.status(400).json({
        success: false,
        error: 'bankMovementId e scadenzaId sono richiesti'
      });
    }
    
    const result = await reconciliationService.manualReconciliation(
      bankMovementId,
      scadenzaId,
      userId || 1,
      notes
    );
    
    // Notifica real-time
    if (global.io) {
      global.io.emit('manual-reconciliation-created', {
        bankMovementId,
        scadenzaId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Error creating manual reconciliation', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create manual reconciliation'
    });
  }
});

// GET /api/reconciliation/bank-movements
router.get('/bank-movements', async (req, res) => {
  try {
    const filters = {
      reconciled: req.query.reconciled !== undefined ? 
        req.query.reconciled === 'true' : undefined,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      account_number: req.query.account_number,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const movements = await sqliteService.getBankMovements(filters);
    
    res.json({
      success: true,
      data: movements,
      count: movements.length
    });
    
  } catch (error) {
    logger.error('Error fetching bank movements', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bank movements'
    });
  }
});

// GET /api/reconciliation/suggestions/:movementId
router.get('/suggestions/:movementId', async (req, res) => {
  try {
    const movementId = req.params.movementId;
    
    // Carica movimento bancario
    const movements = await sqliteService.getBankMovements({ 
      external_id: movementId 
    });
    
    if (movements.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Movimento bancario non trovato'
      });
    }
    
    const movement = movements[0];
    
    // Carica scadenze aperte
    const arcaService = require('../../services/database/arca');
    const scadenzeAperte = await arcaService.getScadenzeAperte({
      importo_min: movement.amount * 0.9, // ±10% tolleranza
      importo_max: movement.amount * 1.1
    });
    
    // Trova suggerimenti
    const suggestions = await reconciliationService.findMatches(
      movement, 
      scadenzeAperte,
      { minScore: 0.5, maxMatches: 10 }
    );
    
    res.json({
      success: true,
      data: {
        movement,
        suggestions
      }
    });
    
  } catch (error) {
    logger.error('Error fetching reconciliation suggestions', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
});

// Utility functions per parsing file
async function parseCsvFile(filePath) {
  const fs = require('fs');
  const csv = require('csv-parser');
  const movements = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Adatta alla struttura del tuo CSV bancario
        const movement = {
          external_id: row['ID'] || row['Riferimento'] || generateId(),
          account_number: row['Conto'] || 'UNKNOWN',
          date: parseDate(row['Data'] || row['Data Valuta']),
          value_date: parseDate(row['Data Valuta'] || row['Data']),
          amount: parseFloat(row['Importo'] || row['Amount'] || 0),
          description: row['Descrizione'] || row['Description'] || '',
          reference: row['Riferimento'] || row['Reference'] || '',
          transaction_type: row['Tipo'] || 'UNKNOWN',
          counterpart: row['Controparte'] || ''
        };
        
        if (movement.amount !== 0) {
          movements.push(movement);
        }
      })
      .on('end', () => resolve(movements))
      .on('error', reject);
  });
}

async function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  return data.map(row => ({
    external_id: row['ID'] || row['Riferimento'] || generateId(),
    account_number: row['Conto'] || 'UNKNOWN',
    date: parseDate(row['Data'] || row['Data Valuta']),
    value_date: parseDate(row['Data Valuta'] || row['Data']),
    amount: parseFloat(row['Importo'] || row['Amount'] || 0),
    description: row['Descrizione'] || row['Description'] || '',
    reference: row['Riferimento'] || row['Reference'] || '',
    transaction_type: row['Tipo'] || 'UNKNOWN',
    counterpart: row['Controparte'] || ''
  })).filter(movement => movement.amount !== 0);
}

function parseDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // Prova vari formati data
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  ];
  
  if (formats[0].test(dateString)) {
    return dateString;
  } else if (formats[1].test(dateString) || formats[2].test(dateString)) {
    const parts = dateString.split(/[\/\-]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  // Fallback: prova parsing diretto
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? 
    new Date().toISOString().split('T')[0] : 
    date.toISOString().split('T')[0];
}

function generateId() {
  return 'MOV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = router;