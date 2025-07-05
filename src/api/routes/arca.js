const express = require('express');
const router = express.Router();
const arcaService = require('../../services/database/arca');
const DataService = require('../../services/dataService.cjs');
const { logger } = require('../../utils/logger');

// GET /api/arca/active-invoices
router.get('/active-invoices', async (req, res) => {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      customer: req.query.customer,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const activeInvoices = await arcaService.getActiveInvoices(filters);
    
    res.json({
      success: true,
      data: activeInvoices,
      count: activeInvoices.length
    });
    
  } catch (error) {
    logger.error('Error fetching active invoices', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active invoices'
    });
  }
});

// GET /api/arca/passive-invoices
router.get('/passive-invoices', async (req, res) => {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      supplier: req.query.supplier,
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const passiveInvoices = await arcaService.getPassiveInvoices(filters);
    
    res.json({
      success: true,
      data: passiveInvoices,
      count: passiveInvoices.length
    });
    
  } catch (error) {
    logger.error('Error fetching passive invoices', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch passive invoices'
    });
  }
});

// GET /api/arca/customers
router.get('/customers', async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      active_only: req.query.active_only === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const customers = await arcaService.getClienti(filters);
    
    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
    
  } catch (error) {
    logger.error('Error fetching clients', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
});

// GET /api/arca/scadenze
router.get('/scadenze', async (req, res) => {
  try {
    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      client_id: req.query.client_id,
      overdue_only: req.query.overdue_only === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    const scadenze = await arcaService.getScadenzeAperte(filters);
    
    res.json({
      success: true,
      data: scadenze,
      count: scadenze.length
    });
    
  } catch (error) {
    logger.error('Error fetching scadenze', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scadenze'
    });
  }
});

// GET /api/arca/products
router.get('/products', async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
      active_only: req.query.active_only === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    
    let products;
    try {
      if (arcaService.isConnected) {
        products = await arcaService.getProducts(filters);
      } else {
        throw new Error('ARCA not connected');
      }
    } catch (arcaError) {
      logger.warn('ARCA not available, using mock data', arcaError.message);
      products = DataService.getProducts();
      
      // Apply filters to mock data
      if (filters.search) {
        products = products.filter(p => 
          p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.code.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      if (filters.category) {
        products = products.filter(p => p.category === filters.category);
      }
      if (filters.limit) {
        products = products.slice(0, filters.limit);
      }
    }
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
    
  } catch (error) {
    logger.error('Error fetching products', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

module.exports = router;