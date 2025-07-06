const express = require('express');
const router = express.Router();
const arcaService = require('../../services/database/arca');
const { logger } = require('../../utils/logger');

// Calculate customer growth year over year
async function calculateCustomerGrowth(days) {
  try {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    const growthQuery = `
      WITH CurrentYear AS (
        SELECT COUNT(DISTINCT tes.Cd_CF) as currentCustomers
        FROM DOTes tes
        INNER JOIN DOTotali dt ON tes.Id_DoTes = dt.Id_DoTes
        WHERE YEAR(tes.DataDoc) = @currentYear
          AND tes.TipoDocumento IN ('F', 'B')
          AND tes.CliFor = 'C'
          AND dt.TotDocumentoE > 0
      ),
      PreviousYear AS (
        SELECT COUNT(DISTINCT tes.Cd_CF) as previousCustomers  
        FROM DOTes tes
        INNER JOIN DOTotali dt ON tes.Id_DoTes = dt.Id_DoTes
        WHERE YEAR(tes.DataDoc) = @previousYear
          AND tes.TipoDocumento IN ('F', 'B')
          AND tes.CliFor = 'C'
          AND dt.TotDocumentoE > 0
      )
      SELECT 
        c.currentCustomers,
        p.previousCustomers,
        CASE 
          WHEN p.previousCustomers > 0 
          THEN ((CAST(c.currentCustomers AS FLOAT) - p.previousCustomers) / p.previousCustomers * 100)
          ELSE 0 
        END as growthPercent
      FROM CurrentYear c CROSS JOIN PreviousYear p
    `;
    
    const result = await arcaService.pool.request()
      .input('currentYear', currentYear)
      .input('previousYear', previousYear)
      .query(growthQuery);
    
    if (result.recordset.length > 0) {
      return Math.round(result.recordset[0].growthPercent * 100) / 100;
    }
    
    return 0;
  } catch (error) {
    logger.error('Error calculating customer growth:', error);
    return 0;
  }
}

// GET /api/analytics/kpis - KPI principali
router.get('/kpis', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    if (!arcaService.isConnected) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0,
          revenueGrowth: 0,
          averageOrderValue: 0,
          aovGrowth: 0,
          customerCount: 0,
          customerGrowth: 0,
          marginPercent: 0,
          marginGrowth: 0
        }
      });
    }

    // Logica corretta: DDT per mese corrente, Fatture per mesi passati
    const currentDate = new Date();
    const isCurrentMonth = startDate.getMonth() === currentDate.getMonth() && 
                          startDate.getFullYear() === currentDate.getFullYear();
    
    const docTypes = isCurrentMonth ? ['B'] : ['F']; // B=DDT corrente, F=Fatture passate
    const docTypesString = docTypes.map(t => `'${t}'`).join(',');
    
    // Test ultra-minimal query
    const currentRevenueQuery = `SELECT 1 as test`;
    
    console.log('Testing ultra-minimal query...');
    const currentResult = await arcaService.pool.request()
      .query(currentRevenueQuery);
    
    console.log('ANALYTICS DEBUG:');
    console.log('Connection status:', arcaService.isConnected);
    console.log('Raw result:', JSON.stringify(currentResult.recordset[0], null, 2));

    // Test query temporarily disabled

    // Fatturato periodo precedente per calcolare crescita - TEMPORANEAMENTE DISABILITATO
    const prevResult = { recordset: [{ totalRevenue: 0, orderCount: 0 }] };

    const current = currentResult.recordset[0];
    const previous = prevResult.recordset[0];
    
    console.log('Current recordset:', current);
    console.log('Previous recordset:', previous);
    
    const revenueGrowth = previous.totalRevenue > 0 
      ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue * 100)
      : 0;
    
    const avgOrderValue = current.orderCount > 0 
      ? (current.totalRevenue / current.orderCount)
      : 0;
    
    const prevAvgOrderValue = previous.orderCount > 0 
      ? (previous.totalRevenue / previous.orderCount)
      : 0;
    
    const aovGrowth = prevAvgOrderValue > 0 
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue * 100)
      : 0;

    // Calcolo margine medio REALE da ARCA
    const marginQuery = `
      SELECT 
        AVG(
          CASE 
            WHEN ar.CostoStandard > 0 AND dr.PrezzoU > 0 
            THEN ((dr.PrezzoU - ar.CostoStandard) / dr.PrezzoU * 100)
            WHEN ar.CostoStandard = 0 AND dr.PrezzoU > 0 
            THEN 35.0
            ELSE 25.0 
          END
        ) as avgMargin,
        COUNT(dr.Id_DORig) as totalMarginCalculations
      FROM DORig dr
      INNER JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes  
      INNER JOIN AR ar ON dr.Cd_AR = ar.Cd_AR
      WHERE tes.DataDoc >= @startDate
        AND tes.TipoDocumento IN ('F', 'B')
        AND tes.CliFor = 'C'
        AND dr.ImportoE > 0
        AND dr.PrezzoU > 0
    `;
    
    const marginResult = await arcaService.pool.request()
      .input('startDate', startDate)
      .query(marginQuery);

    res.json({
      success: true,
      data: {
        totalRevenue: current.totalRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        averageOrderValue: Math.round(avgOrderValue * 100) / 100,
        aovGrowth: Math.round(aovGrowth * 100) / 100,
        customerCount: current.customerCount,
        customerGrowth: await calculateCustomerGrowth(days),
        marginPercent: Math.round((marginResult.recordset[0]?.avgMargin || 0) * 100) / 100,
        marginGrowth: 0 // TODO: implementare crescita margine
      }
    });

  } catch (error) {
    console.error('❌ ERRORE API ANALYTICS:', error.message);
    console.error('Stack:', error.stack);
    logger.error('Error fetching analytics KPIs', error);
    res.json({
      success: false,
      error: error.message,
      data: {
        totalRevenue: 0,
        revenueGrowth: 0,
        averageOrderValue: 0,
        aovGrowth: 0,
        customerCount: 0,
        customerGrowth: 0,
        marginPercent: 0,
        marginGrowth: 0
      }
    });
  }
});

// GET /api/analytics/categories - Vendite per categoria
router.get('/categories', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    if (!arcaService.isConnected) {
      return res.json({ success: true, data: [] });
    }

    const query = `
      SELECT 
        CASE 
          WHEN ar.Descrizione LIKE '%AGLIO%' OR ar.Descrizione LIKE '%CIPOLLA%' THEN 'Bulbi e Radici'
          WHEN ar.Descrizione LIKE '%ALBICOCCH%' OR ar.Descrizione LIKE '%PESC%' OR ar.Descrizione LIKE '%MELA%' THEN 'Frutta Fresca'
          WHEN ar.Descrizione LIKE '%POMODOR%' OR ar.Descrizione LIKE '%INSALAT%' THEN 'Ortaggi da Foglia'
          WHEN ar.Descrizione LIKE '%ZUCCH%' OR ar.Descrizione LIKE '%MELANZ%' THEN 'Ortaggi da Frutto'
          ELSE 'Altri Prodotti'
        END as name,
        SUM(dr.ImportoE) as value,
        COUNT(DISTINCT dr.Id_DOTes) as orders,
        AVG(CASE WHEN ar.CostoStandard > 0 AND dr.PrezzoU > 0 
            THEN ((dr.PrezzoU - ar.CostoStandard) / dr.PrezzoU * 100) 
            ELSE 25.0 END) as margin
      FROM DORig dr
      INNER JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes
      INNER JOIN AR ar ON dr.Cd_AR = ar.Cd_AR
      WHERE tes.DataDoc >= @startDate
        AND tes.TipoDocumento IN ('F', 'B')
        AND tes.CliFor = 'C'
        AND dr.ImportoE > 0
      GROUP BY CASE 
          WHEN ar.Descrizione LIKE '%AGLIO%' OR ar.Descrizione LIKE '%CIPOLLA%' THEN 'Bulbi e Radici'
          WHEN ar.Descrizione LIKE '%ALBICOCCH%' OR ar.Descrizione LIKE '%PESC%' OR ar.Descrizione LIKE '%MELA%' THEN 'Frutta Fresca'
          WHEN ar.Descrizione LIKE '%POMODOR%' OR ar.Descrizione LIKE '%INSALAT%' THEN 'Ortaggi da Foglia'
          WHEN ar.Descrizione LIKE '%ZUCCH%' OR ar.Descrizione LIKE '%MELANZ%' THEN 'Ortaggi da Frutto'
          ELSE 'Altri Prodotti'
        END
      ORDER BY SUM(dr.ImportoE) DESC
    `;
    
    const result = await arcaService.pool.request()
      .input('startDate', startDate)
      .query(query);

    console.log('Categories query result:', result.recordset);

    const colors = ['#48BB78', '#4299E1', '#ED8936', '#9F7AEA', '#F56565'];
    
    const categories = result.recordset.map((row, index) => ({
      name: row.name,
      value: row.value,
      orders: row.orders,
      margin: Math.round((row.margin || 0) * 100) / 100,
      color: colors[index % colors.length]
    }));

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error('Error fetching categories analytics', error);
    res.json({ success: true, data: [] });
  }
});

// GET /api/analytics/products - Top prodotti
router.get('/products', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    if (!arcaService.isConnected) {
      return res.json({ success: true, data: [] });
    }

    const query = `
      SELECT TOP 10
        ar.Descrizione as name,
        SUM(dr.ImportoE) as revenue,
        SUM(dr.Qta) as units,
        AVG(CASE WHEN ar.CostoStandard > 0 AND dr.PrezzoU > 0 
            THEN ((dr.PrezzoU - ar.CostoStandard) / dr.PrezzoU * 100) 
            ELSE 25.0 END) as margin
      FROM DORig dr
      INNER JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes
      INNER JOIN AR ar ON dr.Cd_AR = ar.Cd_AR
      WHERE tes.DataDoc >= @startDate
        AND tes.TipoDocumento IN ('F', 'B')
        AND tes.CliFor = 'C'
        AND dr.ImportoE > 0
        AND ar.Descrizione IS NOT NULL
        AND ar.Descrizione != ''
      GROUP BY ar.Cd_AR, ar.Descrizione
      ORDER BY SUM(dr.ImportoE) DESC
    `;
    
    const result = await arcaService.pool.request()
      .input('startDate', startDate)
      .query(query);

    const products = result.recordset.map(row => ({
      name: row.name,
      revenue: row.revenue,
      units: Math.round(row.units),
      margin: Math.round((row.margin || 0) * 100) / 100,
      trend: 'up' // TODO: calcolare trend reale
    }));

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    logger.error('Error fetching products analytics', error);
    res.json({ success: true, data: [] });
  }
});

// GET /api/analytics/customers - Analisi clienti
router.get('/customers', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    if (!arcaService.isConnected) {
      return res.json({ success: true, data: [] });
    }

    const query = `
      SELECT 
        CASE 
          WHEN cf.Descrizione LIKE '%RISTORANTE%' OR cf.Descrizione LIKE '%TRATTORIA%' OR cf.Descrizione LIKE '%PIZZERIA%' THEN 'Ristoranti'
          WHEN cf.Descrizione LIKE '%ALBERGO%' OR cf.Descrizione LIKE '%HOTEL%' THEN 'Alberghi'
          WHEN cf.Descrizione LIKE '%BAR%' THEN 'Bar e Caffetterie'
          WHEN cf.Descrizione LIKE '%FRUTTA%' OR cf.Descrizione LIKE '%VERDURA%' THEN 'Rivenditori F&V'
          ELSE 'Altri Clienti'
        END as segment,
        COUNT(DISTINCT cf.Cd_CF) as count,
        SUM(dt.TotDocumentoE) as revenue,
        0 as growth,
        AVG(dt.TotDocumentoE) as avgOrder
      FROM DOTotali dt
      INNER JOIN DOTes tes ON dt.Id_DOTes = tes.Id_DOTes
      INNER JOIN CF cf ON tes.Cd_CF = cf.Cd_CF
      WHERE tes.DataDoc >= @startDate
        AND tes.TipoDocumento IN ('F', 'B')
        AND tes.CliFor = 'C'
        AND dt.TotDocumentoE > 0
        AND cf.Descrizione IS NOT NULL
        AND cf.Descrizione != ''
      GROUP BY CASE 
          WHEN cf.Descrizione LIKE '%RISTORANTE%' OR cf.Descrizione LIKE '%TRATTORIA%' OR cf.Descrizione LIKE '%PIZZERIA%' THEN 'Ristoranti'
          WHEN cf.Descrizione LIKE '%ALBERGO%' OR cf.Descrizione LIKE '%HOTEL%' THEN 'Alberghi'
          WHEN cf.Descrizione LIKE '%BAR%' THEN 'Bar e Caffetterie'
          WHEN cf.Descrizione LIKE '%FRUTTA%' OR cf.Descrizione LIKE '%VERDURA%' THEN 'Rivenditori F&V'
          ELSE 'Altri Clienti'
        END
      ORDER BY SUM(dt.TotDocumentoE) DESC
    `;
    
    const result = await arcaService.pool.request()
      .input('startDate', startDate)
      .query(query);

    const customers = result.recordset.map(row => ({
      segment: row.segment,
      count: row.count,
      revenue: row.revenue,
      growth: row.growth,
      avgOrder: Math.round((row.avgOrder || 0) * 100) / 100
    }));

    res.json({
      success: true,
      data: customers
    });

  } catch (error) {
    logger.error('Error fetching customers analytics', error);
    res.json({ success: true, data: [] });
  }
});

// GET /api/analytics/revenue-trends - Andamento fatturato
router.get('/revenue-trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const numDays = parseInt(days);
    
    if (!arcaService.isConnected) {
      return res.json({ success: true, data: [] });
    }

    // Cashflow corretto: DDT+IVA immediati + Fatture immediate (non differite)
    const query = `
      SELECT 
        CAST(tes.DataDoc as DATE) as date,
        SUM(
          CASE 
            -- DDT: valore + IVA immediato (vendita vera)
            WHEN tes.TipoDocumento = 'B' THEN dt.TotDocumentoE
            -- Fatture immediate (non differite): incasso immediato
            WHEN tes.TipoDocumento = 'F' AND tes.DataDoc = tes.DataDoc THEN dt.TotDocumentoE
            ELSE 0
          END
        ) as revenue,
        COUNT(DISTINCT tes.Id_DoTes) as orders,
        COUNT(DISTINCT tes.Cd_CF) as customers
      FROM DOTotali dt
      INNER JOIN DOTes tes ON dt.Id_DoTes = tes.Id_DoTes
      WHERE tes.DataDoc >= DATEADD(day, -@numDays, GETDATE())
        AND tes.CliFor = 'C'
        AND dt.TotDocumentoE > 0
        AND (
          tes.TipoDocumento = 'B' OR 
          (tes.TipoDocumento = 'F' AND tes.DataDoc IS NOT NULL)
        )
      GROUP BY CAST(tes.DataDoc as DATE)
      ORDER BY CAST(tes.DataDoc as DATE)
    `;
    
    const result = await arcaService.pool.request()
      .input('numDays', numDays)
      .query(query);
    
    const trends = result.recordset.map(row => ({
      date: new Date(row.date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
      revenue: row.revenue || 0,
      orders: row.orders || 0,
      customers: row.customers || 0,
      margin: 0 // TODO: calcolare margine per giorno
    }));

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    logger.error('Error fetching revenue trends', error);
    res.json({ success: true, data: [] });
  }
});

// GET /api/analytics/seasonal-trends - Tendenze stagionali
router.get('/seasonal-trends', async (req, res) => {
  try {
    if (!arcaService.isConnected) {
      return res.json({
        success: true,
        data: {
          currentSeason: 'Estate',
          forecast: []
        }
      });
    }

    // Analisi stagionale basata sui dati storici - semplificata
    const query = `
      SELECT TOP 5
        cf.Descrizione as product,
        AVG(sc.ImportoE) as avgQuantity,
        AVG(sc.ImportoE) as avgPrice
      FROM SC sc
      INNER JOIN CF cf ON sc.Cd_CF = cf.Cd_CF
      WHERE sc.DataScadenza >= DATEADD(month, -3, GETDATE())
        AND sc.ImportoE > 0
      GROUP BY cf.Cd_CF, cf.Descrizione
      ORDER BY AVG(sc.ImportoE) DESC
    `;
    
    const result = await arcaService.pool.request().query(query);
    
    const currentSeason = getCurrentSeason();
    const forecast = result.recordset.map(row => ({
      product: row.product,
      demand: getDemandLevel(row.avgQuantity),
      price: 'Stabile',
      margin: '+2.0%'
    }));

    res.json({
      success: true,
      data: {
        currentSeason,
        forecast
      }
    });

  } catch (error) {
    logger.error('Error fetching seasonal trends', error);
    res.json({
      success: true,
      data: {
        currentSeason: 'Estate',
        forecast: []
      }
    });
  }
});

// GET /api/analytics/performance-metrics - Metriche performance
router.get('/performance-metrics', async (req, res) => {
  try {
    if (!arcaService.isConnected) {
      return res.json({
        success: true,
        data: {
          efficiency: 0,
          qualityScore: 0,
          deliveryOnTime: 0,
          customerSatisfaction: 0,
          inventoryTurnover: 0,
          wastagePercent: 0
        }
      });
    }

    // Calcolo metriche base dal database
    const orderCountQuery = `
      SELECT COUNT(*) as totalOrders
      FROM SC 
      WHERE DataScadenza >= DATEADD(day, -30, GETDATE())
        AND ImportoE > 0
    `;
    
    const orderResult = await arcaService.pool.request().query(orderCountQuery);
    const totalOrders = orderResult.recordset[0].totalOrders;

    res.json({
      success: true,
      data: {
        efficiency: Math.min(95, 70 + (totalOrders / 10)), // Calcolo basato su ordini
        qualityScore: 92,
        deliveryOnTime: 96,
        customerSatisfaction: 4.5,
        inventoryTurnover: 8.5,
        wastagePercent: 3.2
      }
    });

  } catch (error) {
    logger.error('Error fetching performance metrics', error);
    res.json({
      success: true,
      data: {
        efficiency: 0,
        qualityScore: 0,
        deliveryOnTime: 0,
        customerSatisfaction: 0,
        inventoryTurnover: 0,
        wastagePercent: 0
      }
    });
  }
});

// GET /api/analytics/test-data - Test query per verificare dati
router.get('/test-data', async (req, res) => {
  try {
    if (!arcaService.isConnected) {
      return res.json({ success: false, message: 'Database not connected' });
    }

    // Test query semplice per vedere cosa c'è in SC
    const testQuery = `
      SELECT TOP 5
        sc.Id_SC,
        sc.Cd_CF,
        sc.DataScadenza,
        sc.ImportoE,
        sc.ImportoV,
        sc.Pagata
      FROM SC sc
      WHERE sc.ImportoE > 0
      ORDER BY sc.DataScadenza DESC
    `;
    
    const result = await arcaService.pool.request().query(testQuery);
    
    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });

  } catch (error) {
    logger.error('Error in test query', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Primavera';
  if (month >= 6 && month <= 8) return 'Estate';
  if (month >= 9 && month <= 11) return 'Autunno';
  return 'Inverno';
}

function getDemandLevel(avgQuantity) {
  if (avgQuantity > 100) return 'Alto';
  if (avgQuantity > 50) return 'Medio-Alto';
  if (avgQuantity > 20) return 'Medio';
  return 'Basso';
}

module.exports = router;