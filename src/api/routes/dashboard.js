const express = require('express');
const router = express.Router();
const arcaService = require('../../services/database/arca');
const sqliteService = require('../../services/database/sqlite');
const DataService = require('../../services/dataService.cjs');
const { logger } = require('../../utils/logger');

// GET /api/dashboard/kpis
router.get('/kpis', async (req, res) => {
  try {
    const { date_from, date_to, days } = req.query;
    
    // Calculate date range from days parameter if provided
    let actualDateFrom = date_from;
    let actualDateTo = date_to;
    
    if (days && !date_from && !date_to) {
      const daysInt = parseInt(days) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysInt);
      
      actualDateFrom = startDate.toISOString().split('T')[0];
      actualDateTo = endDate.toISOString().split('T')[0];
    }
    
    // Try to get real data from ARCA first, fallback to mock data
    let kpiData;
    try {
      if (arcaService.isConnected) {
        kpiData = await arcaService.getDashboardKPI();
      } else {
        throw new Error('ARCA not connected');
      }
    } catch (arcaError) {
      logger.warn('ARCA not available, using mock data', arcaError.message);
      kpiData = await DataService.getDashboardKPIs(actualDateFrom, actualDateTo);
    }
    
    const response = {
      success: true,
      data: {
        ...kpiData,
        last_updated: new Date().toISOString()
      }
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching dashboard KPI', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard KPI'
    });
  }
});

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const summary = {
      reconciliation: {
        pending: 0,
        matched: 0,
        approved: 0,
        total: 0
      },
      banking: {
        unreconciled_movements: 0,
        total_movements: 0,
        last_import: null
      },
      sync: {
        last_sync: null,
        sync_status: 'unknown',
        tables_synced: 0
      }
    };
    
    // Statistiche riconciliazione
    const reconciliationStats = await sqliteService.db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM reconciliation_records 
      GROUP BY status
    `).all();
    
    reconciliationStats.forEach(stat => {
      summary.reconciliation[stat.status] = stat.count;
      summary.reconciliation.total += stat.count;
    });
    
    // Statistiche movimenti bancari
    const bankingStats = await sqliteService.db.prepare(`
      SELECT 
        COUNT(*) as total_movements,
        SUM(CASE WHEN reconciled = 0 THEN 1 ELSE 0 END) as unreconciled_movements,
        MAX(created_at) as last_import
      FROM bank_movements
    `).get();
    
    summary.banking = {
      ...summary.banking,
      ...bankingStats
    };
    
    // Statistiche sync
    const syncStats = await sqliteService.db.prepare(`
      SELECT 
        COUNT(*) as tables_synced,
        MAX(last_sync) as last_sync,
        status as sync_status
      FROM sync_status 
      WHERE status = 'completed'
    `).get();
    
    if (syncStats) {
      summary.sync = {
        ...summary.sync,
        ...syncStats
      };
    }
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    logger.error('Error fetching dashboard summary', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary'
    });
  }
});

// GET /api/dashboard/activities
router.get('/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Query per attività recenti da audit log
    const activities = await sqliteService.db.prepare(`
      SELECT 
        table_name,
        action,
        created_at,
        new_values
      FROM audit_log 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
    
    // Trasforma in formato leggibile
    const formattedActivities = activities.map(activity => {
      let title = '';
      let type = 'info';
      
      switch (activity.table_name) {
        case 'reconciliation_records':
          title = activity.action === 'create' ? 
            'Nuova riconciliazione creata' : 
            'Riconciliazione aggiornata';
          type = activity.action === 'create' ? 'success' : 'info';
          break;
        case 'bank_movements':
          title = 'Movimento bancario importato';
          type = 'info';
          break;
        default:
          title = `${activity.action} in ${activity.table_name}`;
      }
      
      return {
        title,
        time: formatTimeAgo(activity.created_at),
        type,
        status: getStatusFromAction(activity.action),
        details: activity.new_values
      };
    });
    
    res.json({
      success: true,
      data: formattedActivities
    });
    
  } catch (error) {
    logger.error('Error fetching dashboard activities', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
});

// GET /api/dashboard/charts/cash-flow
router.get('/charts/cash-flow', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    if (!arcaService.isConnected) {
      await arcaService.connect();
    }
    
    // Carica dati reali da Arca
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const arcaData = await arcaService.getFatturatoAnalytics({
      data_da: startDate,
      data_a: endDate
    });
    
    // Aggrega per giorno
    const dailyData = {};
    arcaData.forEach(record => {
      const date = record.DataDoc.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { inflow: 0, outflow: 0 };
      }
      if (record.Fatturato > 0) {
        dailyData[date].inflow += record.Fatturato;
      } else {
        dailyData[date].outflow += Math.abs(record.Fatturato);
      }
    });
    
    const cashFlowData = Object.entries(dailyData).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('it-IT', { 
        month: '2-digit', 
        day: '2-digit' 
      }),
      ...data
    }));
    
    res.json({
      success: true,
      data: cashFlowData
    });
    
  } catch (error) {
    logger.error('Error fetching cash flow data', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cash flow data'
    });
  }
});

// GET /api/dashboard/charts/clients-distribution
router.get('/charts/clients-distribution', async (req, res) => {
  try {
    if (!arcaService.isConnected) {
      await arcaService.connect();
    }
    
    // Calcola distribuzione clienti ABC da Arca
    const clientsData = await arcaService.getFatturatoAnalytics({
      data_da: new Date(new Date().getFullYear(), 0, 1),
      data_a: new Date()
    });
    
    // Classifica clienti ABC
    const totalFatturato = clientsData.reduce((sum, c) => sum + c.Fatturato, 0);
    let cumulativeFatturato = 0;
    
    const classified = clientsData
      .sort((a, b) => b.Fatturato - a.Fatturato)
      .map(client => {
        cumulativeFatturato += client.Fatturato;
        const cumulativePercent = (cumulativeFatturato / totalFatturato) * 100;
        
        let classe = 'C';
        if (cumulativePercent <= 80) classe = 'A';
        else if (cumulativePercent <= 95) classe = 'B';
        
        return { ...client, classe };
      });
    
    const classeA = classified.filter(c => c.classe === 'A').length;
    const classeB = classified.filter(c => c.classe === 'B').length;
    const classeC = classified.filter(c => c.classe === 'C').length;
    
    const distributionData = [
      { name: 'Classe A', value: classeA },
      { name: 'Classe B', value: classeB },
      { name: 'Classe C', value: classeC }
    ];
    
    res.json({
      success: true,
      data: distributionData
    });
    
  } catch (error) {
    logger.error('Error fetching clients distribution', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients distribution'
    });
  }
});

// Utility functions
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Ora';
  if (diffMins < 60) return `${diffMins} minuti fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  return `${diffDays} giorni fa`;
}

function getStatusFromAction(action) {
  const statusMap = {
    'create': 'Creato',
    'update': 'Aggiornato',
    'delete': 'Eliminato',
    'approve': 'Approvato',
    'reject': 'Rifiutato'
  };
  return statusMap[action] || 'Sconosciuto';
}

// NEW ROUTES FOR FRUIT & VEGETABLE BUSINESS

// GET /api/dashboard/revenue-trends
router.get('/revenue-trends', async (req, res) => {
  try {
    const { date_from, date_to, days, group_by = 'day', groupBy } = req.query;
    
    // Calculate date range from days parameter if provided
    let actualDateFrom = date_from;
    let actualDateTo = date_to;
    
    if (days && !date_from && !date_to) {
      const daysInt = parseInt(days) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysInt);
      
      actualDateFrom = startDate.toISOString().split('T')[0];
      actualDateTo = endDate.toISOString().split('T')[0];
    }
    
    // Support both group_by and groupBy parameters
    const grouping = groupBy || group_by || 'day';
    
    const trends = await DataService.getRevenueTrends(actualDateFrom, actualDateTo, grouping);
    
    res.json({
      success: true,
      data: trends
    });
    
  } catch (error) {
    logger.error('Error fetching revenue trends', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trends'
    });
  }
});

// GET /api/dashboard/category-performance
router.get('/category-performance', async (req, res) => {
  try {
    const { date_from, date_to, days } = req.query;
    
    // Calculate date range from days parameter if provided
    let actualDateFrom = date_from;
    let actualDateTo = date_to;
    
    if (days && !date_from && !date_to) {
      const daysInt = parseInt(days) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysInt);
      
      actualDateFrom = startDate.toISOString().split('T')[0];
      actualDateTo = endDate.toISOString().split('T')[0];
    }
    
    const performance = await DataService.getCategoryPerformance(actualDateFrom, actualDateTo);
    
    res.json({
      success: true,
      data: performance
    });
    
  } catch (error) {
    logger.error('Error fetching category performance', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category performance'
    });
  }
});

// GET /api/dashboard/seasonal-trends
router.get('/seasonal-trends', async (req, res) => {
  try {
    const trends = DataService.getSeasonalTrends();
    
    res.json({
      success: true,
      data: trends
    });
    
  } catch (error) {
    logger.error('Error fetching seasonal trends', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seasonal trends'
    });
  }
});

module.exports = router;