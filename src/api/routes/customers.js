const express = require('express');
const router = express.Router();
const arcaService = require('../../services/database/arca');
const { logger } = require('../../utils/logger');

// Get all customers from ARCA
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 1000, search, type, category } = req.query;
    
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
        
        // Enrich data with REAL business calculations from ARCA
        const enrichedCustomers = await Promise.all(customers.map(async (customer) => {
          // Calculate real total revenue for customer - LOGIC CORRECTED
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          
          const revenueQuery = `
            SELECT 
              ISNULL(SUM(
                CASE 
                  -- Current month: DDT + IVA (immediate cash flow)
                  WHEN MONTH(tes.DataDoc) = @currentMonth AND YEAR(tes.DataDoc) = @currentYear
                    AND tes.TipoDocumento = 'B' THEN dt.TotDocumentoE
                  -- Historical months: only Fatture (final invoices)  
                  WHEN NOT (MONTH(tes.DataDoc) = @currentMonth AND YEAR(tes.DataDoc) = @currentYear)
                    AND tes.TipoDocumento = 'F' THEN dt.TotDocumentoE
                  ELSE 0
                END
              ), 0) as totalRevenue,
              COUNT(DISTINCT 
                CASE 
                  WHEN tes.TipoDocumento IN ('F', 'B') THEN tes.Id_DoTes 
                END
              ) as totalOrders,
              MAX(tes.DataDoc) as lastOrderDate,
              MIN(tes.DataDoc) as firstOrderDate
            FROM DOTotali dt
            INNER JOIN DOTes tes ON dt.Id_DoTes = tes.Id_DoTes
            WHERE tes.Cd_CF = @customerCode
              AND tes.TipoDocumento IN ('F', 'B')
              AND tes.CliFor = 'C'
              AND dt.TotDocumentoE > 0
          `;

          const revenueResult = await arcaService.pool.request()
            .input('customerCode', customer.Cd_CF)
            .input('currentMonth', currentMonth)
            .input('currentYear', currentYear)
            .query(revenueQuery);

          // Calculate credit score based on payment history
          const creditQuery = `
            SELECT 
              COUNT(*) as totalInvoices,
              COUNT(CASE WHEN sc.Pagata = 1 THEN 1 END) as paidInvoices,
              COUNT(CASE WHEN sc.Pagata = 0 AND sc.DataScadenza < GETDATE() THEN 1 END) as overdueInvoices,
              AVG(CASE WHEN sc.Pagata = 1 AND sc.DataPagamento IS NOT NULL 
                  THEN DATEDIFF(day, sc.DataScadenza, sc.DataPagamento) 
                  ELSE NULL END) as avgPaymentDelay,
              SUM(CASE WHEN sc.Pagata = 0 THEN sc.ImportoE ELSE 0 END) as openAmount
            FROM SC sc
            WHERE sc.Cd_CF = @customerCode
              AND sc.ImportoE > 0
          `;

          const creditResult = await arcaService.pool.request()
            .input('customerCode', customer.Cd_CF)
            .query(creditQuery);

          const revenue = revenueResult.recordset[0];
          const credit = creditResult.recordset[0];

          // Calculate intelligent credit score (0-100)
          let creditScore = 50; // Base score
          if (credit.totalInvoices > 0) {
            const paymentRate = (credit.paidInvoices / credit.totalInvoices) * 100;
            creditScore += (paymentRate - 50) * 0.5; // +25 for 100% payment rate
            
            if (credit.avgPaymentDelay !== null) {
              creditScore -= Math.max(0, credit.avgPaymentDelay * 2); // -2 points per day delay
            }
            
            if (credit.overdueInvoices > 0) {
              creditScore -= credit.overdueInvoices * 5; // -5 points per overdue invoice
            }
          }
          creditScore = Math.max(0, Math.min(100, Math.round(creditScore)));

          return {
            id: customer.Cd_CF,
            code: customer.Cd_CF,
            name: customer.Descrizione,
            type: determineCustomerType(customer.Descrizione),
            category: customer.Categoria_cliente || 'Standard',
            email: customer.Email || null,
            phone: customer.Telefono || null,
            address: buildAddress(customer),
            vatNumber: customer.PartitaIva,
            creditLimit: customer.Fido || 0,
            totalRevenue: revenue.totalRevenue || 0,
            totalOrders: revenue.totalOrders || 0,
            lastOrderDate: revenue.lastOrderDate ? new Date(revenue.lastOrderDate).toISOString().split('T')[0] : null,
            firstOrderDate: revenue.firstOrderDate ? new Date(revenue.firstOrderDate).toISOString().split('T')[0] : null,
            creditScore: creditScore,
            openAmount: credit.openAmount || 0,
            overdueInvoices: credit.overdueInvoices || 0,
            paymentDelay: credit.avgPaymentDelay || 0,
            since: revenue.firstOrderDate ? new Date(revenue.firstOrderDate).getFullYear().toString() : '2020',
            status: credit.openAmount > 0 ? (credit.overdueInvoices > 0 ? 'Overdue' : 'Active') : 'Paid'
          };
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
      logger.error('ARCA not available, no fallback to mock data', arcaError.message);
      
      res.status(503).json({
        success: false,
        error: 'ARCA database not available',
        message: 'Cannot fetch customers - ARCA connection required',
        details: arcaError.message
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