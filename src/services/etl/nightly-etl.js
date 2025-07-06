const cron = require('node-cron');
const { logger } = require('../../utils/logger');
const arcaService = require('../database/arca');
const sqliteService = require('../database/sqlite');
const { warmCache } = require('../../middleware/cache');

class NightlyETL {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
  }

  // Start the ETL scheduler
  start() {
    // Run every night at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.runETL();
    });
    
    logger.info('🌙 Nightly ETL scheduler started (2:00 AM daily)');
    this.updateNextRun();
  }

  // Manual ETL trigger
  async runETL() {
    if (this.isRunning) {
      logger.warn('⚠️ ETL already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    
    logger.info('🌙 Starting nightly ETL process...');

    try {
      // 1. Pre-calculate heavy analytics
      await this.precalculateAnalytics();
      
      // 2. Update customer credit scores
      await this.updateCreditScores();
      
      // 3. Cache popular product data
      await this.cacheProductData();
      
      // 4. Warm critical caches
      await this.warmCriticalCaches();
      
      // 5. Cleanup old cache entries
      await this.cleanupOldData();
      
      logger.info('✅ Nightly ETL completed successfully');
      
    } catch (error) {
      logger.error('❌ Nightly ETL failed:', error);
    } finally {
      this.isRunning = false;
      this.updateNextRun();
    }
  }

  // Pre-calculate heavy analytics queries
  async precalculateAnalytics() {
    if (!arcaService.isConnected) return;
    
    logger.info('📊 Pre-calculating analytics...');
    
    try {
      // Pre-calculate monthly KPIs
      const monthlyKPIs = await this.calculateMonthlyKPIs();
      
      // Store in SQLite cache
      await sqliteService.setCachedAnalytics('monthly_kpis', monthlyKPIs);
      
      // Pre-calculate yearly trends
      const yearlyTrends = await this.calculateYearlyTrends();
      await sqliteService.setCachedAnalytics('yearly_trends', yearlyTrends);
      
      // Pre-calculate product performance
      const productPerformance = await this.calculateProductPerformance();
      await sqliteService.setCachedAnalytics('product_performance', productPerformance);
      
      logger.info('✅ Analytics pre-calculation completed');
      
    } catch (error) {
      logger.error('❌ Analytics pre-calculation failed:', error);
    }
  }

  // Calculate monthly KPIs
  async calculateMonthlyKPIs() {
    const query = `
      SELECT 
        YEAR(tes.DataDoc) as year,
        MONTH(tes.DataDoc) as month,
        SUM(dt.TotDocumentoE) as totalRevenue,
        COUNT(DISTINCT tes.Id_DoTes) as totalOrders,
        COUNT(DISTINCT tes.Cd_CF) as uniqueCustomers,
        AVG(dt.TotDocumentoE) as avgOrderValue
      FROM DOTotali dt
      INNER JOIN DOTes tes ON dt.Id_DoTes = tes.Id_DoTes
      WHERE tes.DataDoc >= DATEADD(month, -12, GETDATE())
        AND tes.TipoDocumento IN ('F', 'B')
        AND tes.CliFor = 'C'
        AND dt.TotDocumentoE > 0
      GROUP BY YEAR(tes.DataDoc), MONTH(tes.DataDoc)
      ORDER BY year DESC, month DESC
    `;
    
    const result = await arcaService.pool.request().query(query);
    return result.recordset;
  }

  // Calculate yearly trends
  async calculateYearlyTrends() {
    const query = `
      SELECT 
        YEAR(tes.DataDoc) as year,
        SUM(dt.TotDocumentoE) as totalRevenue,
        COUNT(DISTINCT tes.Cd_CF) as uniqueCustomers,
        COUNT(DISTINCT tes.Id_DoTes) as totalOrders
      FROM DOTotali dt
      INNER JOIN DOTes tes ON dt.Id_DoTes = tes.Id_DoTes
      WHERE tes.DataDoc >= DATEADD(year, -3, GETDATE())
        AND tes.TipoDocumento IN ('F', 'B')
        AND tes.CliFor = 'C'
        AND dt.TotDocumentoE > 0
      GROUP BY YEAR(tes.DataDoc)
      ORDER BY year DESC
    `;
    
    const result = await arcaService.pool.request().query(query);
    return result.recordset;
  }

  // Calculate product performance metrics
  async calculateProductPerformance() {
    const query = `
      SELECT TOP 100
        ar.Cd_AR as productCode,
        ar.Descrizione as description,
        SUM(dr.ImportoE) as totalRevenue,
        SUM(dr.Qta) as totalQuantity,
        COUNT(DISTINCT dr.Id_DOTes) as totalOrders,
        AVG(dr.PrezzoU) as avgPrice,
        MAX(tes.DataDoc) as lastSaleDate
      FROM DORig dr
      INNER JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes
      INNER JOIN AR ar ON dr.Cd_AR = ar.Cd_AR
      WHERE tes.DataDoc >= DATEADD(month, -6, GETDATE())
        AND tes.TipoDocumento IN ('F', 'B')
        AND tes.CliFor = 'C'
        AND dr.ImportoE > 0
      GROUP BY ar.Cd_AR, ar.Descrizione
      ORDER BY totalRevenue DESC
    `;
    
    const result = await arcaService.pool.request().query(query);
    return result.recordset;
  }

  // Update credit scores for all customers
  async updateCreditScores() {
    if (!arcaService.isConnected) return;
    
    logger.info('💳 Updating customer credit scores...');
    
    try {
      // Get all active customers
      const customersQuery = `
        SELECT DISTINCT tes.Cd_CF
        FROM DOTes tes
        WHERE tes.DataDoc >= DATEADD(year, -1, GETDATE())
          AND tes.TipoDocumento IN ('F', 'B')
          AND tes.CliFor = 'C'
      `;
      
      const customers = await arcaService.pool.request().query(customersQuery);
      
      for (const customer of customers.recordset) {
        const creditScore = await this.calculateCreditScore(customer.Cd_CF);
        
        // Store in SQLite cache
        await sqliteService.setCachedAnalytics(
          `credit_score_${customer.Cd_CF}`, 
          { score: creditScore, updatedAt: new Date() }
        );
      }
      
      logger.info(`✅ Updated credit scores for ${customers.recordset.length} customers`);
      
    } catch (error) {
      logger.error('❌ Credit score update failed:', error);
    }
  }

  // Calculate credit score for a specific customer
  async calculateCreditScore(customerCode) {
    const query = `
      SELECT 
        COUNT(*) as totalInvoices,
        COUNT(CASE WHEN sc.Pagata = 1 THEN 1 END) as paidInvoices,
        COUNT(CASE WHEN sc.Pagata = 0 AND sc.DataScadenza < GETDATE() THEN 1 END) as overdueInvoices,
        AVG(CASE WHEN sc.Pagata = 1 AND sc.DataPagamento IS NOT NULL 
            THEN DATEDIFF(day, sc.DataScadenza, sc.DataPagamento) 
            ELSE NULL END) as avgPaymentDelay
      FROM SC sc
      WHERE sc.Cd_CF = @customerCode
        AND sc.ImportoE > 0
        AND sc.DataScadenza >= DATEADD(year, -2, GETDATE())
    `;
    
    const result = await arcaService.pool.request()
      .input('customerCode', customerCode)
      .query(query);
    
    const data = result.recordset[0];
    
    let score = 50; // Base score
    
    if (data.totalInvoices > 0) {
      const paymentRate = (data.paidInvoices / data.totalInvoices) * 100;
      score += (paymentRate - 50) * 0.5;
      
      if (data.avgPaymentDelay !== null) {
        score -= Math.max(0, data.avgPaymentDelay * 2);
      }
      
      score -= data.overdueInvoices * 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Cache popular product data
  async cacheProductData() {
    if (!arcaService.isConnected) return;
    
    logger.info('📦 Caching product data...');
    
    try {
      // Cache top 100 products by revenue
      const topProducts = await this.calculateProductPerformance();
      await sqliteService.setCachedAnalytics('top_products', topProducts);
      
      // Cache product categories
      const categoriesQuery = `
        SELECT 
          ar.Categoria as category,
          COUNT(*) as productCount,
          SUM(ISNULL(dr.ImportoE, 0)) as totalRevenue
        FROM AR ar
        LEFT JOIN DORig dr ON ar.Cd_AR = dr.Cd_AR
        LEFT JOIN DOTes tes ON dr.Id_DOTes = tes.Id_DOTes
        WHERE ar.Descrizione IS NOT NULL
          AND (tes.DataDoc IS NULL OR tes.DataDoc >= DATEADD(month, -6, GETDATE()))
        GROUP BY ar.Categoria
        ORDER BY totalRevenue DESC
      `;
      
      const categories = await arcaService.pool.request().query(categoriesQuery);
      await sqliteService.setCachedAnalytics('product_categories', categories.recordset);
      
      logger.info('✅ Product data caching completed');
      
    } catch (error) {
      logger.error('❌ Product data caching failed:', error);
    }
  }

  // Warm critical caches
  async warmCriticalCaches() {
    logger.info('🔥 Warming critical caches...');
    
    try {
      await warmCache();
      logger.info('✅ Cache warming completed');
    } catch (error) {
      logger.error('❌ Cache warming failed:', error);
    }
  }

  // Cleanup old data
  async cleanupOldData() {
    logger.info('🧹 Cleaning up old data...');
    
    try {
      // Clean old analytics cache (older than 7 days)
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await sqliteService.cleanupOldAnalytics(cutoffDate);
      
      logger.info('✅ Data cleanup completed');
    } catch (error) {
      logger.error('❌ Data cleanup failed:', error);
    }
  }

  // Update next run time
  updateNextRun() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    
    this.nextRun = tomorrow;
  }

  // Get ETL status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      uptime: this.lastRun ? Date.now() - this.lastRun.getTime() : null
    };
  }
}

// Export singleton instance
const nightlyETL = new NightlyETL();

module.exports = nightlyETL;