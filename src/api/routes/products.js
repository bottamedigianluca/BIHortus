const express = require('express');
const router = express.Router();
const arcaService = require('../../services/database/arca');
const { logger } = require('../../utils/logger');

// Smart product name normalization
function normalizeProductName(description) {
  if (!description) return '';
  
  return description
    .replace(/lotto\s+\d+/gi, '')                    // Remove "lotto 250011607"
    .replace(/\b\d{6,}\b/g, '')                      // Remove long numeric codes
    .replace(/\b\d{2,3}\/\d{2,3}\b/g, '')           // Remove size codes like "70/90"
    .replace(/\b(kg|gr|pz|conf|scat)\b/gi, '')       // Remove units
    .replace(/\s+/g, ' ')                            // Normalize spaces
    .trim()
    .toUpperCase();
}

// Intelligent product categorization based on ARCA codes and names
function categorizeProduct(productCode, description) {
  const code = productCode?.toUpperCase() || '';
  const desc = description?.toUpperCase() || '';
  
  // Mapping based on ARCA code patterns
  const categoryMapping = {
    // Bulbi e Radici
    'AGL': 'Bulbi e Radici',
    'CIP': 'Bulbi e Radici', 
    'CAR': 'Bulbi e Radici',
    'RAP': 'Bulbi e Radici',
    'RAD': 'Bulbi e Radici',
    
    // Frutta Estiva  
    'ALB': 'Frutta Estiva',
    'PES': 'Frutta Estiva',
    'MEL': 'Frutta Fresca',
    'UVA': 'Frutta Fresca',
    'ARA': 'Frutta Esotica',
    
    // Verdure a Foglia
    'AGR': 'Verdure a Foglia',
    'INS': 'Verdure a Foglia', 
    'LAT': 'Verdure a Foglia',
    'SPI': 'Verdure a Foglia',
    'RUC': 'Verdure a Foglia',
    
    // Ortaggi da Frutto
    'ZUC': 'Ortaggi da Frutto',
    'MEL': 'Ortaggi da Frutto', // MELANZANE
    'POM': 'Ortaggi da Frutto',
    'PEP': 'Ortaggi da Frutto',
    
    // Legumi
    'FAG': 'Legumi Freschi',
    'PIS': 'Legumi Freschi',
    
    // Erbe Aromatiche
    'BAS': 'Erbe Aromatiche',
    'PRE': 'Erbe Aromatiche',
    'ROS': 'Erbe Aromatiche'
  };
  
  // Try code-based categorization first
  for (const [prefix, category] of Object.entries(categoryMapping)) {
    if (code.startsWith(prefix)) {
      return category;
    }
  }
  
  // Fallback to description-based categorization
  if (desc.includes('AGLIO') || desc.includes('CIPOLLA') || desc.includes('CAROTA')) {
    return 'Bulbi e Radici';
  }
  if (desc.includes('ALBICOCCH') || desc.includes('PESC') || desc.includes('MELA')) {
    return 'Frutta Fresca';
  }
  if (desc.includes('INSALAT') || desc.includes('LATTUG') || desc.includes('SPINAC')) {
    return 'Verdure a Foglia';
  }
  if (desc.includes('ZUCCH') || desc.includes('MELANZ') || desc.includes('POMODOR')) {
    return 'Ortaggi da Frutto';
  }
  if (desc.includes('FAGIOL') || desc.includes('PISEL')) {
    return 'Legumi Freschi';
  }
  if (desc.includes('BASIL') || desc.includes('PREZZ') || desc.includes('ROSMAR')) {
    return 'Erbe Aromatiche';
  }
  
  return 'Altri Prodotti';
}

// Calculate real profit margin for product
async function calculateRealMargin(productCode) {
  try {
    const marginQuery = `
      SELECT 
        ar.CostoStandard,
        AVG(dr.PrezzoU) as avgSellingPrice,
        COUNT(dr.Id_DORig) as totalSales,
        SUM(dr.Qta) as totalQuantity
      FROM AR ar
      LEFT JOIN DORig dr ON ar.Cd_AR = dr.Cd_AR
      LEFT JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes
      WHERE ar.Cd_AR = @productCode
        AND (dr.Id_DORig IS NULL OR (
          tes.DataDoc >= DATEADD(month, -6, GETDATE()) 
          AND dr.PrezzoU > 0
        ))
      GROUP BY ar.Cd_AR, ar.CostoStandard
    `;
    
    const result = await arcaService.pool.request()
      .input('productCode', productCode)
      .query(marginQuery);
    
    if (result.recordset.length > 0) {
      const data = result.recordset[0];
      const cost = data.CostoStandard || 0;
      const price = data.avgSellingPrice || 0;
      
      if (price > 0 && cost > 0) {
        return ((price - cost) / price * 100);
      } else if (price > 0) {
        return 35.0; // Conservative estimate if no cost data
      }
    }
    
    return 25.0; // Default fallback
  } catch (error) {
    logger.error(`Error calculating margin for ${productCode}:`, error);
    return 25.0;
  }
}

// GET /api/products - Get all products with intelligent processing
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, search, category } = req.query;
    
    logger.info('📦 Fetching products from ARCA database');
    
    if (!arcaService.isConnected) {
      return res.json({ success: true, data: [] });
    }
    
    let query = `
      SELECT 
        ar.Cd_AR as productCode,
        ar.Descrizione as description,
        ar.CostoStandard as standardCost,
        ar.Um as unitOfMeasure,
        ar.Categoria as category,
        ar.Giacenza as stockQuantity,
        ar.GiacenzaMin as minStock,
        ar.PrezzoVendita1 as listPrice,
        COUNT(dr.Id_DORig) as totalSales,
        SUM(dr.ImportoE) as totalRevenue,
        SUM(dr.Qta) as totalQuantitySold,
        MAX(tes.DataDoc) as lastSaleDate
      FROM AR ar
      LEFT JOIN DORig dr ON ar.Cd_AR = dr.Cd_AR
      LEFT JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes
      WHERE ar.Descrizione IS NOT NULL 
        AND ar.Descrizione != ''
    `;
    
    const request = arcaService.pool.request();
    
    if (search) {
      query += ` AND ar.Descrizione LIKE @search`;
      request.input('search', `%${search}%`);
    }
    
    query += `
      GROUP BY ar.Cd_AR, ar.Descrizione, ar.CostoStandard, ar.Um, 
               ar.Categoria, ar.Giacenza, ar.GiacenzaMin, ar.PrezzoVendita1
      ORDER BY totalRevenue DESC
    `;
    
    if (limit) {
      query = `SELECT TOP ${parseInt(limit)} * FROM (${query}) as subquery`;
    }
    
    const result = await request.query(query);
    
    // Process products with intelligent enhancements
    const enrichedProducts = await Promise.all(result.recordset.map(async (product) => {
      const normalizedName = normalizeProductName(product.description);
      const intelligentCategory = categorizeProduct(product.productCode, product.description);
      const realMargin = await calculateRealMargin(product.productCode);
      
      // Calculate performance metrics
      const avgOrderValue = product.totalSales > 0 ? (product.totalRevenue / product.totalSales) : 0;
      const velocity = product.totalQuantitySold || 0; // Units sold in period
      
      // Determine status
      let status = 'Active';
      if (!product.lastSaleDate || new Date(product.lastSaleDate) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
        status = 'Slow Moving';
      }
      if (product.stockQuantity !== null && product.minStock && product.stockQuantity < product.minStock) {
        status = 'Low Stock';
      }
      
      return {
        id: product.productCode,
        code: product.productCode,
        name: product.description,
        normalizedName: normalizedName,
        category: intelligentCategory,
        originalCategory: product.category,
        unitOfMeasure: product.unitOfMeasure,
        standardCost: product.standardCost || 0,
        listPrice: product.listPrice || 0,
        realMargin: Math.round(realMargin * 100) / 100,
        stockQuantity: product.stockQuantity || 0,
        minStock: product.minStock || 0,
        totalSales: product.totalSales || 0,
        totalRevenue: product.totalRevenue || 0,
        totalQuantitySold: product.totalQuantitySold || 0,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        velocity: velocity,
        lastSaleDate: product.lastSaleDate ? new Date(product.lastSaleDate).toISOString().split('T')[0] : null,
        status: status,
        trend: product.totalSales > 0 ? 'stable' : 'declining' // Simplified trend
      };
    }));
    
    // Apply category filter after processing
    let filteredProducts = enrichedProducts;
    if (category) {
      filteredProducts = enrichedProducts.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase()) ||
        p.originalCategory?.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    logger.info(`✅ Retrieved ${filteredProducts.length} products from ARCA`);
    
    res.json({
      success: true,
      data: filteredProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredProducts.length
      },
      summary: {
        totalProducts: filteredProducts.length,
        activeProducts: filteredProducts.filter(p => p.status === 'Active').length,
        lowStockProducts: filteredProducts.filter(p => p.status === 'Low Stock').length,
        slowMovingProducts: filteredProducts.filter(p => p.status === 'Slow Moving').length,
        avgMargin: Math.round(filteredProducts.reduce((sum, p) => sum + p.realMargin, 0) / filteredProducts.length * 100) / 100
      }
    });
    
  } catch (error) {
    logger.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});

// GET /api/products/categories - Get product categories
router.get('/categories', async (req, res) => {
  try {
    if (!arcaService.isConnected) {
      return res.json({ success: true, data: [] });
    }
    
    const query = `
      SELECT 
        ar.Categoria as originalCategory,
        COUNT(*) as productCount,
        SUM(CASE WHEN dr.ImportoE IS NOT NULL THEN dr.ImportoE ELSE 0 END) as totalRevenue
      FROM AR ar
      LEFT JOIN DORig dr ON ar.Cd_AR = dr.Cd_AR
      WHERE ar.Descrizione IS NOT NULL
      GROUP BY ar.Categoria
      ORDER BY totalRevenue DESC
    `;
    
    const result = await arcaService.pool.request().query(query);
    
    // Also generate intelligent categories summary
    const intelligentCategories = {
      'Bulbi e Radici': 0,
      'Frutta Fresca': 0,
      'Frutta Estiva': 0,
      'Verdure a Foglia': 0,
      'Ortaggi da Frutto': 0,
      'Legumi Freschi': 0,
      'Erbe Aromatiche': 0,
      'Altri Prodotti': 0
    };
    
    res.json({
      success: true,
      data: {
        originalCategories: result.recordset,
        intelligentCategories: Object.keys(intelligentCategories).map(cat => ({
          category: cat,
          productCount: 0, // Would need separate query
          description: `Prodotti classificati come ${cat}`
        }))
      }
    });
    
  } catch (error) {
    logger.error('❌ Error fetching product categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// GET /api/products/:code - Get specific product details
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!arcaService.isConnected) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const query = `
      SELECT 
        ar.*,
        COUNT(dr.Id_DORig) as totalSales,
        SUM(dr.ImportoE) as totalRevenue,
        SUM(dr.Qta) as totalQuantitySold,
        AVG(dr.PrezzoU) as avgSellingPrice,
        MAX(tes.DataDoc) as lastSaleDate,
        MIN(tes.DataDoc) as firstSaleDate
      FROM AR ar
      LEFT JOIN DORig dr ON ar.Cd_AR = dr.Cd_AR
      LEFT JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes
      WHERE ar.Cd_AR = @code
      GROUP BY ar.Cd_AR, ar.Descrizione, ar.CostoStandard, ar.Um, 
               ar.Categoria, ar.Giacenza, ar.GiacenzaMin, ar.PrezzoVendita1
    `;
    
    const result = await arcaService.pool.request()
      .input('code', code)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const product = result.recordset[0];
    const realMargin = await calculateRealMargin(code);
    
    const enrichedProduct = {
      ...product,
      normalizedName: normalizeProductName(product.Descrizione),
      intelligentCategory: categorizeProduct(product.Cd_AR, product.Descrizione),
      realMargin: Math.round(realMargin * 100) / 100,
      avgOrderValue: product.totalSales > 0 ? (product.totalRevenue / product.totalSales) : 0
    };
    
    res.json({
      success: true,
      data: enrichedProduct
    });
    
  } catch (error) {
    logger.error(`❌ Error fetching product ${req.params.code}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

module.exports = router;