import { 
  products, 
  customers, 
  suppliers, 
  generateSalesData, 
  calculateCustomerScore, 
  calculateProductScore,
  getSeasonalTrends,
  wasteData 
} from '../data/fruitVegetableData.js';

class DataService {
  constructor() {
    this.salesData = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      console.log('🚀 Initializing BiHortus data service...');
      this.salesData = generateSalesData();
      this.initialized = true;
      console.log(`✅ Generated ${this.salesData.length} sales records`);
    }
  }

  // Dashboard KPIs
  async getDashboardKPIs(dateFrom, dateTo) {
    await this.initialize();
    
    const filteredSales = this.salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const from = dateFrom ? new Date(dateFrom) : new Date('2023-01-01');
      const to = dateTo ? new Date(dateTo) : new Date();
      return saleDate >= from && saleDate <= to;
    });

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalCost = filteredSales.reduce((sum, sale) => sum + sale.cost, 0);
    const totalMargin = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    // Today's data
    const today = new Date().toISOString().split('T')[0];
    const todaySales = this.salesData.filter(sale => sale.date === today);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // This month's data
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthSales = this.salesData.filter(sale => sale.date.startsWith(thisMonth));
    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Outstanding invoices (mock)
    const outstandingAmount = totalRevenue * 0.15; // 15% outstanding

    // Active customers
    const activeCustomers = new Set(filteredSales.map(sale => sale.customerId)).size;

    return {
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalMargin: Math.round(totalMargin * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
      outstandingAmount: Math.round(outstandingAmount * 100) / 100,
      activeCustomers,
      totalOrders: filteredSales.length,
      averageOrderValue: filteredSales.length > 0 ? Math.round((totalRevenue / filteredSales.length) * 100) / 100 : 0
    };
  }

  // Revenue trends for charts
  async getRevenueTrends(dateFrom, dateTo, groupBy = 'day') {
    await this.initialize();
    
    const filteredSales = this.salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const from = dateFrom ? new Date(dateFrom) : new Date('2023-01-01');
      const to = dateTo ? new Date(dateTo) : new Date();
      return saleDate >= from && saleDate <= to;
    });

    const grouped = {};
    
    filteredSales.forEach(sale => {
      let key;
      const date = new Date(sale.date);
      
      switch (groupBy) {
        case 'day':
          key = sale.date;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = sale.date.slice(0, 7);
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        default:
          key = sale.date;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          revenue: 0,
          margin: 0,
          orders: 0,
          quantity: 0
        };
      }

      grouped[key].revenue += sale.totalAmount;
      grouped[key].margin += sale.margin;
      grouped[key].orders += 1;
      grouped[key].quantity += sale.quantity;
    });

    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue * 100) / 100,
        margin: Math.round(item.margin * 100) / 100,
        marginPercent: item.revenue > 0 ? Math.round((item.margin / item.revenue * 100) * 100) / 100 : 0
      }));
  }

  // Category performance
  async getCategoryPerformance(dateFrom, dateTo) {
    await this.initialize();
    
    const filteredSales = this.salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const from = dateFrom ? new Date(dateFrom) : new Date('2023-01-01');
      const to = dateTo ? new Date(dateTo) : new Date();
      return saleDate >= from && saleDate <= to;
    });

    const categories = {};
    
    filteredSales.forEach(sale => {
      if (!categories[sale.category]) {
        categories[sale.category] = {
          category: sale.category,
          revenue: 0,
          margin: 0,
          quantity: 0,
          orders: 0
        };
      }

      categories[sale.category].revenue += sale.totalAmount;
      categories[sale.category].margin += sale.margin;
      categories[sale.category].quantity += sale.quantity;
      categories[sale.category].orders += 1;
    });

    return Object.values(categories).map(cat => ({
      ...cat,
      revenue: Math.round(cat.revenue * 100) / 100,
      margin: Math.round(cat.margin * 100) / 100,
      marginPercent: cat.revenue > 0 ? Math.round((cat.margin / cat.revenue * 100) * 100) / 100 : 0,
      averageOrderValue: cat.orders > 0 ? Math.round((cat.revenue / cat.orders) * 100) / 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }

  // Top customers with scores
  async getTopCustomers(limit = 10) {
    await this.initialize();
    
    const customerScores = customers.map(customer => {
      const score = calculateCustomerScore(customer.id, this.salesData);
      return {
        ...customer,
        ...score
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    return customerScores.slice(0, limit);
  }

  // Top products with scores
  async getTopProducts(limit = 10) {
    await this.initialize();
    
    const productScores = products.map(product => {
      const score = calculateProductScore(product.id, this.salesData);
      return {
        ...product,
        ...score
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    return productScores.slice(0, limit);
  }

  // Customer analysis
  async getCustomerAnalysis(customerId) {
    await this.initialize();
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;

    const customerSales = this.salesData.filter(sale => sale.customerId === customerId);
    const score = calculateCustomerScore(customerId, this.salesData);

    // Monthly trends
    const monthlyTrends = {};
    customerSales.forEach(sale => {
      const month = sale.date.slice(0, 7);
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { revenue: 0, orders: 0 };
      }
      monthlyTrends[month].revenue += sale.totalAmount;
      monthlyTrends[month].orders += 1;
    });

    // Favorite products
    const productStats = {};
    customerSales.forEach(sale => {
      if (!productStats[sale.productId]) {
        productStats[sale.productId] = {
          productName: sale.productName,
          quantity: 0,
          revenue: 0,
          orders: 0
        };
      }
      productStats[sale.productId].quantity += sale.quantity;
      productStats[sale.productId].revenue += sale.totalAmount;
      productStats[sale.productId].orders += 1;
    });

    const favoriteProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      customer,
      score,
      totalSales: customerSales.length,
      monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        ...data
      })).sort((a, b) => a.month.localeCompare(b.month)),
      favoriteProducts
    };
  }

  // Product analysis
  async getProductAnalysis(productId) {
    await this.initialize();
    
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const productSales = this.salesData.filter(sale => sale.productId === productId);
    const score = calculateProductScore(productId, this.salesData);

    // Monthly trends
    const monthlyTrends = {};
    productSales.forEach(sale => {
      const month = sale.date.slice(0, 7);
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { quantity: 0, revenue: 0, orders: 0 };
      }
      monthlyTrends[month].quantity += sale.quantity;
      monthlyTrends[month].revenue += sale.totalAmount;
      monthlyTrends[month].orders += 1;
    });

    // Top customers for this product
    const customerStats = {};
    productSales.forEach(sale => {
      if (!customerStats[sale.customerId]) {
        customerStats[sale.customerId] = {
          customerName: sale.customerName,
          quantity: 0,
          revenue: 0,
          orders: 0
        };
      }
      customerStats[sale.customerId].quantity += sale.quantity;
      customerStats[sale.customerId].revenue += sale.totalAmount;
      customerStats[sale.customerId].orders += 1;
    });

    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      product,
      score,
      totalSales: productSales.length,
      monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        ...data
      })).sort((a, b) => a.month.localeCompare(b.month)),
      topCustomers
    };
  }

  // Seasonal trends
  getSeasonalTrends() {
    return getSeasonalTrends();
  }

  // Waste analysis
  async getWasteAnalysis(dateFrom, dateTo) {
    const filteredWaste = wasteData.filter(waste => {
      const wasteDate = new Date(waste.date);
      const from = dateFrom ? new Date(dateFrom) : new Date('2024-01-01');
      const to = dateTo ? new Date(dateTo) : new Date();
      return wasteDate >= from && wasteDate <= to;
    });

    const total = filteredWaste.reduce((sum, waste) => ({
      amount: sum.amount + waste.amount,
      cost: sum.cost + waste.cost
    }), { amount: 0, cost: 0 });

    const byCategory = {};
    filteredWaste.forEach(waste => {
      if (!byCategory[waste.category]) {
        byCategory[waste.category] = { amount: 0, cost: 0 };
      }
      byCategory[waste.category].amount += waste.amount;
      byCategory[waste.category].cost += waste.cost;
    });

    const byReason = {};
    filteredWaste.forEach(waste => {
      if (!byReason[waste.reason]) {
        byReason[waste.reason] = { amount: 0, cost: 0 };
      }
      byReason[waste.reason].amount += waste.amount;
      byReason[waste.reason].cost += waste.cost;
    });

    return {
      total,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        ...data
      })),
      byReason: Object.entries(byReason).map(([reason, data]) => ({
        reason,
        ...data
      })),
      details: filteredWaste
    };
  }

  // Search functionality
  async searchProducts(query) {
    return products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.code.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  async searchCustomers(query) {
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.code.toLowerCase().includes(query.toLowerCase()) ||
      customer.type.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Get all data for specific entities
  getProducts() { return products; }
  getCustomers() { return customers; }
  getSuppliers() { return suppliers; }
}

export default new DataService();