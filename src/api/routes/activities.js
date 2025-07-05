const express = require('express');
const router = express.Router();
const sqliteService = require('../../services/database/sqlite');

// GET /api/activities/recent - Ottieni attività recenti
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Query per attività recenti da audit log
    const activities = await sqliteService.db.prepare(`
      SELECT 
        al.table_name,
        al.action,
        al.created_at,
        al.new_values,
        u.username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC 
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
        case 'settings':
          title = 'Impostazione aggiornata';
          type = 'warning';
          break;
        default:
          title = `${activity.action} in ${activity.table_name}`;
      }
      
      return {
        id: `${activity.table_name}_${activity.created_at}`,
        type: activity.action,
        message: title,
        timestamp: activity.created_at,
        user: activity.username || 'Sistema',
        details: activity.new_values
      };
    });

    res.json(formattedActivities);
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Errore nel recupero attività' });
  }
});

// GET /api/activities/stats - Statistiche attività
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const stats = await sqliteService.db.prepare(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT table_name) as affected_tables,
        COUNT(DISTINCT user_id) as active_users,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM audit_log 
      WHERE created_at >= datetime('now', '-${days} days')
    `).get();
    
    const byAction = await sqliteService.db.prepare(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_log 
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY action
      ORDER BY count DESC
    `).all();
    
    const byTable = await sqliteService.db.prepare(`
      SELECT 
        table_name,
        COUNT(*) as count
      FROM audit_log 
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY table_name
      ORDER BY count DESC
    `).all();

    res.json({
      success: true,
      data: {
        ...stats,
        by_action: byAction,
        by_table: byTable,
        period_days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({ error: 'Errore nel recupero statistiche attività' });
  }
});

// GET /api/activities/by-user/:userId - Attività per utente
router.get('/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const activities = await sqliteService.db.prepare(`
      SELECT 
        al.*,
        u.username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC 
      LIMIT ?
    `).all(userId, limit);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting user activities:', error);
    res.status(500).json({ error: 'Errore nel recupero attività utente' });
  }
});

module.exports = router;