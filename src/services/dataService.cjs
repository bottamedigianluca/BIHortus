// CommonJS version for backend use
const products = [
  // Fruits
  { id: 1, code: 'MELA001', name: 'Mele Golden', category: 'Frutta', subcategory: 'Mele', unit: 'kg', price: 2.50, cost: 1.20, seasonal: true, perishable: true, shelfLife: 14, supplier: 'Consorzio Alto Adige', origin: 'Trentino', organic: false },
  { id: 2, code: 'MELA002', name: 'Mele Fuji Bio', category: 'Frutta', subcategory: 'Mele', unit: 'kg', price: 3.80, cost: 2.10, seasonal: true, perishable: true, shelfLife: 12, supplier: 'Bio Natura', origin: 'Piemonte', organic: true },
  { id: 3, code: 'ARAN001', name: 'Arance Tarocco', category: 'Frutta', subcategory: 'Agrumi', unit: 'kg', price: 3.20, cost: 1.80, seasonal: true, perishable: true, shelfLife: 10, supplier: 'Sicilia Fruit', origin: 'Sicilia', organic: false },
  { id: 4, code: 'ARAN002', name: 'Arance Navel Bio', category: 'Frutta', subcategory: 'Agrumi', unit: 'kg', price: 4.50, cost: 2.60, seasonal: true, perishable: true, shelfLife: 12, supplier: 'Bio Sicilia', origin: 'Sicilia', organic: true },
  { id: 5, code: 'BANA001', name: 'Banane Ecuador', category: 'Frutta', subcategory: 'Tropicali', unit: 'kg', price: 2.90, cost: 1.40, seasonal: false, perishable: true, shelfLife: 7, supplier: 'Tropical Import', origin: 'Ecuador', organic: false },
  { id: 6, code: 'BANA002', name: 'Banane Bio Fair Trade', category: 'Frutta', subcategory: 'Tropicali', unit: 'kg', price: 4.20, cost: 2.40, seasonal: false, perishable: true, shelfLife: 6, supplier: 'Fair Trade Bio', origin: 'Costa Rica', organic: true },
  { id: 7, code: 'FICO001', name: 'Fichi Dottato', category: 'Frutta', subcategory: 'Frutta Estate', unit: 'vaschetta', price: 5.50, cost: 3.20, seasonal: true, perishable: true, shelfLife: 3, supplier: 'Puglia Fresh', origin: 'Puglia', organic: false },
  { id: 8, code: 'UVA001', name: 'Uva Italia', category: 'Frutta', subcategory: 'Frutta Estate', unit: 'kg', price: 4.80, cost: 2.80, seasonal: true, perishable: true, shelfLife: 7, supplier: 'Vigneti del Sud', origin: 'Puglia', organic: false },
  { id: 9, code: 'PESC001', name: 'Pesche Percoche', category: 'Frutta', subcategory: 'Frutta Estate', unit: 'kg', price: 3.60, cost: 2.20, seasonal: true, perishable: true, shelfLife: 5, supplier: 'Campania Fruit', origin: 'Campania', organic: false },
  { id: 10, code: 'KIWI001', name: 'Kiwi Hayward', category: 'Frutta', subcategory: 'Kiwi', unit: 'kg', price: 4.20, cost: 2.50, seasonal: true, perishable: true, shelfLife: 14, supplier: 'Lazio Kiwi', origin: 'Lazio', organic: false },

  // Vegetables
  { id: 11, code: 'TOM001', name: 'Pomodori Ciliegino', category: 'Verdura', subcategory: 'Pomodori', unit: 'vaschetta', price: 3.50, cost: 2.10, seasonal: true, perishable: true, shelfLife: 7, supplier: 'Serra Campana', origin: 'Campania', organic: false },
  { id: 12, code: 'TOM002', name: 'Pomodori San Marzano Bio', category: 'Verdura', subcategory: 'Pomodori', unit: 'kg', price: 6.80, cost: 4.20, seasonal: true, perishable: true, shelfLife: 5, supplier: 'Bio Campania', origin: 'Campania', organic: true },
  { id: 13, code: 'CAR001', name: 'Carote', category: 'Verdura', subcategory: 'Radici', unit: 'kg', price: 1.80, cost: 0.90, seasonal: false, perishable: true, shelfLife: 21, supplier: 'Veneto Agricola', origin: 'Veneto', organic: false },
  { id: 14, code: 'CAR002', name: 'Carote Bio', category: 'Verdura', subcategory: 'Radici', unit: 'kg', price: 2.90, cost: 1.60, seasonal: false, perishable: true, shelfLife: 18, supplier: 'Bio Veneto', origin: 'Veneto', organic: true },
  { id: 15, code: 'ZUC001', name: 'Zucchine', category: 'Verdura', subcategory: 'Zucche', unit: 'kg', price: 2.60, cost: 1.40, seasonal: true, perishable: true, shelfLife: 10, supplier: 'Sicilia Verde', origin: 'Sicilia', organic: false },
  { id: 16, code: 'INS001', name: 'Insalata Iceberg', category: 'Verdura', subcategory: 'Insalate', unit: 'cespo', price: 1.20, cost: 0.60, seasonal: false, perishable: true, shelfLife: 7, supplier: 'Green Leaf', origin: 'Lazio', organic: false },
  { id: 17, code: 'INS002', name: 'Rucola Bio', category: 'Verdura', subcategory: 'Insalate', unit: 'busta', price: 2.80, cost: 1.70, seasonal: false, perishable: true, shelfLife: 5, supplier: 'Bio Verde', origin: 'Lazio', organic: true },
  { id: 18, code: 'MEL001', name: 'Melanzane', category: 'Verdura', subcategory: 'Melanzane', unit: 'kg', price: 3.20, cost: 1.90, seasonal: true, perishable: true, shelfLife: 8, supplier: 'Sicilia Verde', origin: 'Sicilia', organic: false },
  { id: 19, code: 'PEP001', name: 'Peperoni Rossi', category: 'Verdura', subcategory: 'Peperoni', unit: 'kg', price: 4.50, cost: 2.70, seasonal: true, perishable: true, shelfLife: 10, supplier: 'Puglia Fresh', origin: 'Puglia', organic: false },
  { id: 20, code: 'ZUC002', name: 'Zucca Butternut', category: 'Verdura', subcategory: 'Zucche', unit: 'kg', price: 2.20, cost: 1.20, seasonal: true, perishable: false, shelfLife: 60, supplier: 'Emilia Agricola', origin: 'Emilia-Romagna', organic: false }
];

const customers = [
  { id: 1, code: 'CLI001', name: 'Ristorante Da Mario', type: 'Ristorante', email: 'mario@damario.it', phone: '06-123456', address: 'Via Roma 15, Roma', vatNumber: 'IT12345678901', creditLimit: 5000, paymentTerms: 30, category: 'A', since: '2020-01-15' },
  { id: 2, code: 'CLI002', name: 'Pizzeria Bella Napoli', type: 'Pizzeria', email: 'info@bellanapoli.it', phone: '06-234567', address: 'Via Napoli 22, Roma', vatNumber: 'IT23456789012', creditLimit: 3000, paymentTerms: 30, category: 'B', since: '2020-03-20' },
  { id: 3, code: 'CLI003', name: 'Hotel Roma Palace', type: 'Hotel', email: 'kitchen@romapalace.it', phone: '06-345678', address: 'Via dei Fori 8, Roma', vatNumber: 'IT34567890123', creditLimit: 8000, paymentTerms: 45, category: 'A', since: '2019-05-10' },
  { id: 4, code: 'CLI004', name: 'Supermarket Fresh', type: 'Supermercato', email: 'orders@fresh.it', phone: '06-456789', address: 'Via del Corso 101, Roma', vatNumber: 'IT45678901234', creditLimit: 12000, paymentTerms: 60, category: 'A', since: '2018-11-12' },
  { id: 5, code: 'CLI005', name: 'Mensa Scolastica Dante', type: 'Mensa', email: 'mensa@dante.edu', phone: '06-567890', address: 'Via Dante 45, Roma', vatNumber: 'IT56789012345', creditLimit: 4000, paymentTerms: 90, category: 'B', since: '2021-09-01' },
  { id: 6, code: 'CLI006', name: 'Catering Elite', type: 'Catering', email: 'info@elitecatering.it', phone: '06-678901', address: 'Via Milano 33, Roma', vatNumber: 'IT67890123456', creditLimit: 6000, paymentTerms: 30, category: 'A', since: '2020-07-18' },
  { id: 7, code: 'CLI007', name: 'Bar Centrale', type: 'Bar', email: 'bar@centrale.it', phone: '06-789012', address: 'Piazza Centrale 1, Roma', vatNumber: 'IT78901234567', creditLimit: 1500, paymentTerms: 15, category: 'C', since: '2022-01-10' },
  { id: 8, code: 'CLI008', name: 'Osteria del Borgo', type: 'Ristorante', email: 'osteria@borgo.it', phone: '06-890123', address: 'Via del Borgo 12, Roma', vatNumber: 'IT89012345678', creditLimit: 3500, paymentTerms: 30, category: 'B', since: '2021-04-25' },
  { id: 9, code: 'CLI009', name: 'Clinica San Giuseppe', type: 'Clinica', email: 'cucina@sangiuseppe.it', phone: '06-901234', address: 'Via della Salute 5, Roma', vatNumber: 'IT90123456789', creditLimit: 7000, paymentTerms: 60, category: 'A', since: '2019-12-03' },
  { id: 10, code: 'CLI010', name: 'Bio Market Verde', type: 'Negozio Bio', email: 'orders@biomercato.it', phone: '06-012345', address: 'Via Verde 88, Roma', vatNumber: 'IT01234567890', creditLimit: 4500, paymentTerms: 30, category: 'B', since: '2021-06-15' }
];

// Generate realistic sales data for the last 2 years
function generateSalesData() {
  const sales = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date();
  
  let saleId = 1;
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Skip some days randomly (business closed)
    if (Math.random() < 0.1) continue;
    
    // Generate 3-15 sales per day
    const dailySales = Math.floor(Math.random() * 12) + 3;
    
    for (let i = 0; i < dailySales; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      
      // Seasonal adjustments
      const month = date.getMonth();
      let seasonalMultiplier = 1;
      
      if (product.category === 'Frutta') {
        // More fruit sales in summer
        seasonalMultiplier = (month >= 5 && month <= 8) ? 1.5 : 0.8;
      }
      
      // Customer type adjustments
      let customerMultiplier = 1;
      if (customer.type === 'Hotel' || customer.type === 'Supermercato') {
        customerMultiplier = 2.5;
      } else if (customer.type === 'Ristorante') {
        customerMultiplier = 1.8;
      } else if (customer.type === 'Mensa') {
        customerMultiplier = 2.0;
      }
      
      // Calculate quantities
      let baseQuantity = Math.random() * 20 + 1;
      if (product.unit === 'vaschetta' || product.unit === 'cespo' || product.unit === 'busta') {
        baseQuantity = Math.floor(Math.random() * 50) + 1;
      }
      
      const quantity = Math.round(baseQuantity * seasonalMultiplier * customerMultiplier);
      const unitPrice = product.price * (0.9 + Math.random() * 0.2); // ±10% price variation
      const totalAmount = quantity * unitPrice;
      const cost = quantity * product.cost;
      const margin = totalAmount - cost;
      
      sales.push({
        id: saleId++,
        date: new Date(date).toISOString().split('T')[0],
        customerId: customer.id,
        customerName: customer.name,
        customerType: customer.type,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        category: product.category,
        subcategory: product.subcategory,
        quantity: quantity,
        unit: product.unit,
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        marginPercent: Math.round((margin / totalAmount) * 100 * 100) / 100,
        organic: product.organic,
        seasonal: product.seasonal
      });
    }
  }
  
  return sales;
}

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
      fatturato_oggi: Math.round(todayRevenue * 100) / 100,
      fatturato_mese: Math.round(monthRevenue * 100) / 100,
      scaduto_totale: Math.round(outstandingAmount * 100) / 100,
      scadenze_7gg: Math.round(outstandingAmount * 0.3 * 100) / 100,
      ordini_aperti: Math.floor(filteredSales.length * 0.1),
      clienti_attivi: activeCustomers
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

  getSeasonalTrends() {
    return {
      spring: {
        trends: ['Aumento verdure fresche', 'Calo agrumi', 'Crescita insalate'],
        products: ['Carote', 'Insalate', 'Zucchine'],
        growth: 15
      },
      summer: {
        trends: ['Picco frutta estiva', 'Massimo peperoni', 'Boom melanzane'],
        products: ['Pesche', 'Fichi', 'Pomodori', 'Melanzane'],
        growth: 35
      },
      autumn: {
        trends: ['Ritorno mele', 'Stagione zucche', 'Calo frutta estiva'],
        products: ['Mele', 'Zucca', 'Uva'],
        growth: -5
      },
      winter: {
        trends: ['Dominio agrumi', 'Calo verdure estive', 'Stagione kiwi'],
        products: ['Arance', 'Kiwi', 'Carote'],
        growth: -15
      }
    };
  }

  // Get all data for specific entities
  getProducts() { return products; }
  getCustomers() { return customers; }
}

module.exports = new DataService();