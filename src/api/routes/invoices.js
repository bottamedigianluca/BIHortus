const express = require('express');
const router = express.Router();
const arcaService = require('../../services/database/arca');
const { logger } = require('../../utils/logger');

// Get active invoices (outgoing)
router.get('/active', async (req, res) => {
  try {
    const { page = 1, limit = 100, status, customer, dateFrom, dateTo } = req.query;
    
    logger.info('📄 Fetching active invoices from ARCA database');
    
    try {
      if (arcaService.isConnected) {
        // Build filters object for arcaService
        const filters = {};
        if (customer) {
          filters.customer = customer;
        }
        if (dateFrom) {
          filters.date_from = dateFrom;
        }
        if (dateTo) {
          filters.date_to = dateTo;
        }
        if (status) {
          filters.status = status;
        }
        if (limit) {
          filters.limit = parseInt(limit);
        }
        
        // Use the arcaService method
        const invoices = await arcaService.getActiveInvoices(filters);
        
        logger.info(`✅ Retrieved ${invoices.length} active invoices from ARCA`);
        
        res.json({
          success: true,
          data: invoices,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: invoices.length,
            pages: Math.ceil(invoices.length / limit)
          }
        });
      } else {
        throw new Error('ARCA not connected');
      }
    } catch (arcaError) {
      logger.warn('ARCA not available, using mock data', arcaError.message);
      
      // Return mock active invoices data
      const mockInvoices = [
        {
          Id_DoTes: 1001,
          numeroDocumento: 'FAT-2024-001',
          dataDocumento: '2024-01-15',
          scadenza: '2024-02-14',
          tipoDocumento: 'FAT',
          codiceCliente: 'CLI001',
          customerName: 'Ristorante Da Mario',
          totaleDocumento: 1250.50,
          imponibile: 1025.41,
          importoIva: 225.09,
          statoDocumento: 'Da incassare',
          Note: 'Consegna settimanale verdure fresche'
        },
        {
          Id_DoTes: 1002,
          numeroDocumento: 'FAT-2024-002',
          dataDocumento: '2024-01-16',
          scadenza: '2024-01-30',
          tipoDocumento: 'FAT',
          codiceCliente: 'CLI002',
          customerName: 'Hotel Roma Palace',
          totaleDocumento: 3420.80,
          imponibile: 2803.93,
          importoIva: 616.87,
          statoDocumento: 'Scaduta',
          Note: 'Fornitura mensile frutta e verdura'
        }
      ];
      
      res.json({
        success: true,
        data: mockInvoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockInvoices.length,
          pages: Math.ceil(mockInvoices.length / limit)
        }
      });
    }
    
  } catch (error) {
    logger.error('❌ Error fetching active invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active invoices',
      details: error.message
    });
  }
});

// Get passive invoices (incoming) - CORRETTE CON DATI REALI
router.get('/passive', async (req, res) => {
  try {
    const { page = 1, limit = 100, status, supplier, dateFrom, dateTo } = req.query;
    
    logger.info('📋 Fetching passive invoices from ARCA database');
    
    if (!arcaService.isConnected) {
      return res.json({ success: true, data: [] });
    }

    // Uso lo scadenzario SC per trovare debiti verso fornitori (importi negativi)
    let query = `
      SELECT TOP ${limit}
        sc.Id_SC,
        sc.NumFattura as numeroDocumento,
        sc.DataFattura as dataDocumento,
        sc.DataScadenza as scadenza,
        'Fattura Passiva' as tipoDocumento,
        ABS(sc.ImportoE) as totaleDocumento,
        ABS(sc.ImportoV) as totaleValuta,
        sc.Cd_CF as codiceFornitore,
        cf.Descrizione as supplierName,
        sc.Descrizione as Note,
        CASE 
          WHEN sc.Pagata = 1 THEN 'Pagata'
          WHEN sc.DataScadenza < GETDATE() THEN 'Scaduta'
          WHEN sc.DataScadenza <= DATEADD(day, 7, GETDATE()) THEN 'In Scadenza'
          ELSE 'Da Pagare'
        END as statoDocumento,
        DATEDIFF(day, GETDATE(), sc.DataScadenza) as giorniScadenza
      FROM SC sc
      INNER JOIN CF cf ON sc.Cd_CF = cf.Cd_CF
      WHERE sc.ImportoE < 0
        AND cf.Descrizione IS NOT NULL
        AND cf.Descrizione != ''
    `;
    
    const params = [];
    
    // Add filters
    if (supplier) {
      query += ` AND (CF.Descrizione LIKE ? OR DOTes.Cd_CF = ?)`;
      params.push(`%${supplier}%`, supplier);
    }
    
    if (dateFrom) {
      query += ` AND DOTes.Data_documento >= ?`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND DOTes.Data_documento <= ?`;
      params.push(dateTo);
    }
    
    query += ` ORDER BY DOTes.Data_documento DESC`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    
    const result = await arcaService.query(query, params);
    
    // Enrich invoices
    const enrichedInvoices = result.recordset.map(invoice => ({
      ...invoice,
      dataDocumento: invoice.dataDocumento ? new Date(invoice.dataDocumento).toISOString().split('T')[0] : null,
      scadenza: invoice.scadenza ? new Date(invoice.scadenza).toISOString().split('T')[0] : null,
      isOverdue: invoice.scadenza ? new Date(invoice.scadenza) < new Date() : false,
      daysOverdue: invoice.scadenza ? Math.max(0, Math.ceil((new Date() - new Date(invoice.scadenza)) / (1000 * 60 * 60 * 24))) : 0
    }));
    
    logger.info(`✅ Retrieved ${enrichedInvoices.length} passive invoices from ARCA`);
    
    res.json({
      success: true,
      data: enrichedInvoices
    });
    
  } catch (error) {
    logger.error('❌ Error fetching passive invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passive invoices',
      details: error.message
    });
  }
});

// Get invoice details by number
router.get('/:number', async (req, res) => {
  try {
    const { number } = req.params;
    
    logger.info(`📄 Fetching invoice ${number} from ARCA`);
    
    // Get invoice header
    const headerQuery = `
      SELECT 
        DOTes.*,
        CF.Descrizione as customerName,
        CF.Indirizzo,
        CF.CAP,
        CF.Citta,
        CF.Provincia,
        CF.Partita_IVA
      FROM DOTes
      INNER JOIN CF ON DOTes.Cd_CF = CF.Cd_CF
      WHERE DOTes.Numero_documento = ?
    `;
    
    const headerResult = await arcaService.query(headerQuery, [number]);
    
    if (headerResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    // Get invoice lines
    const linesQuery = `
      SELECT 
        DORig.*,
        AR.Descrizione as productDescription,
        AR.Um as unitOfMeasure,
        AR.Categoria as productCategory
      FROM DORig
      INNER JOIN AR ON DORig.Cd_AR = AR.Cd_AR
      WHERE DORig.Numero_documento = ?
      ORDER BY DORig.Riga
    `;
    
    const linesResult = await arcaService.query(linesQuery, [number]);
    
    const invoice = {
      header: headerResult.recordset[0],
      lines: linesResult.recordset
    };
    
    logger.info(`✅ Retrieved invoice ${number} with ${invoice.lines.length} lines`);
    
    res.json({
      success: true,
      data: invoice
    });
    
  } catch (error) {
    logger.error(`❌ Error fetching invoice ${req.params.number}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice',
      details: error.message
    });
  }
});

// Get invoice analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { months = 12, type = 'active' } = req.query;
    
    logger.info(`📊 Fetching invoice analytics (${type})`);
    
    const isActive = type === 'active';
    const customerType = isActive ? 'Cliente' : 'Fornitore';
    const docTypes = isActive ? "('FAT', 'FTD', 'FTC')" : "('FAC', 'FTC', 'DDT')";
    
    // Monthly trends
    const trendsQuery = `
      SELECT 
        YEAR(DOTes.Data_documento) as year,
        MONTH(DOTes.Data_documento) as month,
        COUNT(*) as invoice_count,
        SUM(DOTes.Totale_documento) as total_amount,
        AVG(DOTes.Totale_documento) as avg_amount,
        COUNT(CASE WHEN DOTes.Data_scadenza < GETDATE() THEN 1 END) as overdue_count,
        SUM(CASE WHEN DOTes.Data_scadenza < GETDATE() THEN DOTes.Totale_documento ELSE 0 END) as overdue_amount
      FROM DOTes
      INNER JOIN CF ON DOTes.Cd_CF = CF.Cd_CF
      WHERE DOTes.Tipo_documento IN ${docTypes}
        AND CF.${customerType} = 1
        AND DOTes.Data_documento >= DATEADD(month, -?, GETDATE())
      GROUP BY YEAR(DOTes.Data_documento), MONTH(DOTes.Data_documento)
      ORDER BY year, month
    `;
    
    const trendsResult = await arcaService.query(trendsQuery, [months]);
    
    // Top customers/suppliers
    const topQuery = `
      SELECT TOP 10
        CF.Cd_CF,
        CF.Descrizione,
        COUNT(*) as invoice_count,
        SUM(DOTes.Totale_documento) as total_amount,
        AVG(DOTes.Totale_documento) as avg_amount
      FROM DOTes
      INNER JOIN CF ON DOTes.Cd_CF = CF.Cd_CF
      WHERE DOTes.Tipo_documento IN ${docTypes}
        AND CF.${customerType} = 1
        AND DOTes.Data_documento >= DATEADD(month, -?, GETDATE())
      GROUP BY CF.Cd_CF, CF.Descrizione
      ORDER BY total_amount DESC
    `;
    
    const topResult = await arcaService.query(topQuery, [months]);
    
    // Status distribution
    const statusQuery = `
      SELECT 
        DOTes.Stato_documento,
        COUNT(*) as count,
        SUM(DOTes.Totale_documento) as amount
      FROM DOTes
      INNER JOIN CF ON DOTes.Cd_CF = CF.Cd_CF
      WHERE DOTes.Tipo_documento IN ${docTypes}
        AND CF.${customerType} = 1
        AND DOTes.Data_documento >= DATEADD(month, -?, GETDATE())
      GROUP BY DOTes.Stato_documento
    `;
    
    const statusResult = await arcaService.query(statusQuery, [months]);
    
    res.json({
      success: true,
      data: {
        trends: trendsResult.recordset,
        top_entities: topResult.recordset,
        status_distribution: statusResult.recordset
      }
    });
    
  } catch (error) {
    logger.error('❌ Error fetching invoice analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice analytics',
      details: error.message
    });
  }
});

module.exports = router;