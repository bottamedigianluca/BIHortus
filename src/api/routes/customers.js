const express = require('express');
const router = express.Router();
const arcaService = require('../../services/database/arca');
const DataService = require('../../services/dataService.cjs');
const { logger } = require('../../utils/logger');

// Get all customers from ARCA
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, search, type, category } = req.query;
    
    logger.info('📋 Fetching customers from ARCA database');
    
    let customers;
    
    try {
      if (arcaService.isConnected) {
        // Use ARCA service method
        const filters = {};
        if (search) {
          filters.descrizione = search;
        }
        if (category) {
          filters.categoria = category;
        }
        if (limit) {
          filters.limit = parseInt(limit);
        }
        
        customers = await arcaService.getClienti(filters);
        
        // Enrich data with business logic
        const enrichedCustomers = customers.map(customer => ({
          id: customer.Cd_CF,
          code: customer.Cd_CF,
          name: customer.Descrizione,
          type: determineCustomerType(customer.Descrizione),
          category: customer.Categoria_cliente || 'B',
          email: customer.Email || generateEmail(customer.Descrizione),
          phone: customer.Telefono || generatePhone(),
          address: buildAddress(customer),
          vatNumber: customer.PartitaIva,
          creditLimit: customer.Fido || 0,
          scadenzeAperte: customer.ScadenzeAperte || 0,
          esposizioneTotale: customer.EsposizioneTotale || 0,
          scaduto: customer.Scaduto || 0,
          agente: customer.Agente,
          since: '2020-01-01',
          paymentTerms: 30
        }));
        
        logger.info(`✅ Retrieved ${enrichedCustomers.length} customers from ARCA`);
        
        res.json({
          success: true,
          data: enrichedCustomers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: enrichedCustomers.length,
            pages: Math.ceil(enrichedCustomers.length / limit)
          }
        });
      } else {
        throw new Error('ARCA not connected');
      }
    } catch (arcaError) {
      logger.warn('ARCA not available, using mock data', arcaError.message);
      
      // Use mock data from DataService
      const mockCustomers = DataService.getCustomers();
      
      res.json({
        success: true,
        data: mockCustomers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockCustomers.length,
          pages: Math.ceil(mockCustomers.length / limit)
        }
      });
    }
    
  } catch (error) {
    logger.error('❌ Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`📋 Fetching customer ${id} from ARCA`);
    
    const query = `
      SELECT 
        CF.*,
        COUNT(DOTes.Cd_CF) as total_orders,
        SUM(DOTes.Totale_documento) as total_revenue,
        MAX(DOTes.Data_documento) as last_order_date
      FROM CF 
      LEFT JOIN DOTes ON CF.Cd_CF = DOTes.Cd_CF
      WHERE CF.Cd_CF = ? AND CF.Cliente = 1
      GROUP BY CF.Cd_CF, CF.Descrizione, CF.Limite_di_credito, CF.Cliente, CF.Fornitore
    `;
    
    const result = await arcaService.query(query, [id]);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    const customer = result.recordset[0];
    
    // Get recent orders
    const ordersQuery = `
      SELECT TOP 10
        DOTes.Numero_documento,
        DOTes.Data_documento,
        DOTes.Totale_documento,
        DOTes.Stato_documento
      FROM DOTes
      WHERE DOTes.Cd_CF = ?
      ORDER BY DOTes.Data_documento DESC
    `;
    
    const ordersResult = await arcaService.query(ordersQuery, [id]);
    
    const enrichedCustomer = {
      ...customer,
      type: determineCustomerType(customer.Descrizione),
      recent_orders: ordersResult.recordset
    };
    
    logger.info(`✅ Retrieved customer ${id} details`);
    
    res.json({
      success: true,
      data: enrichedCustomer
    });
    
  } catch (error) {
    logger.error(`❌ Error fetching customer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
      details: error.message
    });
  }
});

// Get customer analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { months = 12 } = req.query;
    
    logger.info(`📊 Fetching analytics for customer ${id}`);
    
    // Monthly revenue trend
    const revenueQuery = `
      SELECT 
        YEAR(DOTes.Data_documento) as year,
        MONTH(DOTes.Data_documento) as month,
        SUM(DOTes.Totale_documento) as revenue,
        COUNT(*) as orders,
        AVG(DOTes.Totale_documento) as avg_order_value
      FROM DOTes
      WHERE DOTes.Cd_CF = ? 
        AND DOTes.Data_documento >= DATEADD(month, -?, GETDATE())
      GROUP BY YEAR(DOTes.Data_documento), MONTH(DOTes.Data_documento)
      ORDER BY year, month
    `;
    
    const revenueResult = await arcaService.query(revenueQuery, [id, months]);
    
    // Product preferences
    const productsQuery = `
      SELECT TOP 10
        DORig.Cd_AR as product_code,
        AR.Descrizione as product_name,
        SUM(DORig.Quantita) as total_quantity,
        SUM(DORig.Importo) as total_value,
        COUNT(DISTINCT DOTes.Numero_documento) as order_count
      FROM DORig
      INNER JOIN DOTes ON DORig.Numero_documento = DOTes.Numero_documento
      INNER JOIN AR ON DORig.Cd_AR = AR.Cd_AR
      WHERE DOTes.Cd_CF = ?
        AND DOTes.Data_documento >= DATEADD(month, -?, GETDATE())
      GROUP BY DORig.Cd_AR, AR.Descrizione
      ORDER BY total_value DESC
    `;
    
    const productsResult = await arcaService.query(productsQuery, [id, months]);
    
    // Payment behavior
    const paymentsQuery = `
      SELECT 
        AVG(DATEDIFF(day, DOTes.Data_documento, DOTes.Data_scadenza)) as avg_payment_terms,
        COUNT(CASE WHEN DOTes.Data_scadenza < GETDATE() THEN 1 END) as overdue_count,
        SUM(CASE WHEN DOTes.Data_scadenza < GETDATE() THEN DOTes.Totale_documento ELSE 0 END) as overdue_amount
      FROM DOTes
      WHERE DOTes.Cd_CF = ?
        AND DOTes.Data_documento >= DATEADD(month, -?, GETDATE())
    `;
    
    const paymentsResult = await arcaService.query(paymentsQuery, [id, months]);
    
    res.json({
      success: true,
      data: {
        revenue_trend: revenueResult.recordset,
        product_preferences: productsResult.recordset,
        payment_behavior: paymentsResult.recordset[0]
      }
    });
    
  } catch (error) {
    logger.error(`❌ Error fetching analytics for customer ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer analytics',
      details: error.message
    });
  }
});

// Helper functions
function determineCustomerType(description) {
  const desc = description.toLowerCase();
  
  if (desc.includes('ristorante') || desc.includes('trattoria')) return 'Ristorante';
  if (desc.includes('hotel') || desc.includes('albergo')) return 'Hotel';
  if (desc.includes('pizzeria')) return 'Pizzeria';
  if (desc.includes('bar') || desc.includes('caffè')) return 'Bar';
  if (desc.includes('super') || desc.includes('market')) return 'Supermercato';
  if (desc.includes('catering')) return 'Catering';
  if (desc.includes('mensa')) return 'Mensa';
  if (desc.includes('clinica') || desc.includes('ospedale')) return 'Clinica';
  if (desc.includes('bio') || desc.includes('biologico')) return 'Negozio Bio';
  
  return 'Altro';
}

function generateEmail(description) {
  const name = description.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 10);
  return `${name}@example.com`;
}

function generatePhone() {
  return `06-${Math.floor(Math.random() * 900000) + 100000}`;
}

function buildAddress(customer) {
  const parts = [];
  if (customer.Indirizzo) parts.push(customer.Indirizzo);
  if (customer.CAP && customer.Citta) {
    parts.push(`${customer.CAP} ${customer.Citta}`);
  } else if (customer.Citta) {
    parts.push(customer.Citta);
  }
  if (customer.Provincia) parts.push(`(${customer.Provincia})`);
  
  return parts.join(', ') || 'Indirizzo non disponibile';
}

module.exports = router;