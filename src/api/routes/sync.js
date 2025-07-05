const express = require('express');
const router = express.Router();
const cloudSyncService = require('../../services/sync/cloud-sync');
const { syncLogger } = require('../../utils/logger');

// GET /api/sync/status
router.get('/status', async (req, res) => {
  try {
    let status;
    try {
      status = await cloudSyncService.getSyncStatus();
    } catch (error) {
      // Fallback status when cloud sync is not available
      status = {
        connected: false,
        lastSync: null,
        syncInProgress: false,
        tables: [],
        message: 'Cloud sync disabled or not configured'
      };
    }
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    syncLogger.error('Error fetching sync status', error);
    // Return safe fallback instead of 500
    res.json({
      success: true,
      data: {
        connected: false,
        lastSync: null,
        syncInProgress: false,
        tables: [],
        error: 'Sync service unavailable'
      }
    });
  }
});

// POST /api/sync/trigger
router.post('/trigger', async (req, res) => {
  try {
    if (!cloudSyncService.isConnected) {
      return res.status(503).json({
        success: false,
        error: 'Cloud sync not available'
      });
    }
    
    const options = {
      force: req.body.force || false,
      tables: req.body.tables || undefined
    };
    
    const result = await cloudSyncService.performSync(options);
    
    // Notifica real-time
    if (global.io) {
      global.io.emit('sync-completed', {
        result,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: result,
      message: 'Sync completed successfully'
    });
    
  } catch (error) {
    syncLogger.error('Error triggering sync', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync'
    });
  }
});

module.exports = router;