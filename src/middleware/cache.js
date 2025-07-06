const { logger } = require('../utils/logger');

// In-memory cache with TTL
class IntelligentCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Set cache with TTL in seconds
  set(key, value, ttl = 3600) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);
    
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
  }

  // Get value from cache
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.delete(key);
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    logger.debug(`Cache HIT: ${key}`);
    return item.value;
  }

  // Delete from cache
  delete(key) {
    this.cache.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    
    logger.debug(`Cache DELETE: ${key}`);
  }

  // Clear all cache
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
    
    logger.info('Cache CLEARED');
  }

  // Get cache statistics
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage (rough calculation)
  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(value.value).length * 2;
    }
    return `${Math.round(totalSize / 1024)} KB`;
  }
}

// Global cache instance
const cache = new IntelligentCache();

// Cache middleware with intelligent TTL rules
const cacheMiddleware = (customTTL = null) => {
  return (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Determine TTL based on endpoint
    let ttl = customTTL;
    if (!ttl) {
      ttl = getTTLForEndpoint(req.path);
    }

    // Skip cache if TTL is 0
    if (ttl === 0) {
      return next();
    }

    // Generate cache key
    const cacheKey = generateCacheKey(req);

    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Add no-cache headers for development
      if (process.env.NODE_ENV === 'development') {
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
      }
      
      // Only cache successful responses
      if (res.statusCode === 200 && data.success !== false) {
        cache.set(cacheKey, data, ttl);
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Intelligent TTL rules based on endpoint patterns
function getTTLForEndpoint(path) {
  const rules = {
    // High frequency, real-time data - shorter cache
    '/api/analytics/kpis': 1800,           // 30 minutes
    '/api/dashboard/kpis': 1800,           // 30 minutes
    '/api/invoices/active': 1800,          // 30 minutes
    '/api/invoices/passive': 1800,         // 30 minutes
    
    // Medium frequency data - moderate cache
    '/api/customers': 7200,                // 2 hours
    '/api/products': 7200,                 // 2 hours
    '/api/analytics/categories': 7200,     // 2 hours
    '/api/analytics/products': 7200,       // 2 hours
    
    // Low frequency data - longer cache
    '/api/analytics/seasonal-trends': 14400,   // 4 hours
    '/api/analytics/performance-metrics': 14400, // 4 hours
    '/api/products/categories': 21600,     // 6 hours
    
    // Static-like data - very long cache
    '/api/settings': 43200,                // 12 hours
    
    // Real-time data - no cache
    '/api/notifications': 0,
    '/api/activities': 0,
    '/api/banking': 0,
    '/api/reconciliation': 0
  };

  // Exact match first
  if (rules[path]) {
    return rules[path];
  }

  // Pattern matching
  for (const [pattern, ttl] of Object.entries(rules)) {
    if (path.startsWith(pattern.replace(/\/[^/]*$/, ''))) {
      return ttl;
    }
  }

  // Default TTL for unknown endpoints
  return 3600; // 1 hour
}

// Generate cache key from request
function generateCacheKey(req) {
  const baseKey = `${req.method}:${req.path}`;
  
  // Include query parameters in cache key
  const queryKeys = Object.keys(req.query).sort();
  if (queryKeys.length > 0) {
    const queryString = queryKeys
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    return `${baseKey}?${queryString}`;
  }
  
  return baseKey;
}

// Cache warming function for critical endpoints
async function warmCache() {
  const criticalEndpoints = [
    'http://localhost:5000/api/analytics/kpis?days=30',
    'http://localhost:5000/api/dashboard/kpis?days=1',
    'http://localhost:5000/api/customers?limit=50',
    'http://localhost:5000/api/products?limit=50'
  ];

  logger.info('🔥 Starting cache warming...');
  
  for (const endpoint of criticalEndpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        logger.debug(`✅ Warmed cache for: ${endpoint}`);
      }
    } catch (error) {
      logger.warn(`❌ Failed to warm cache for ${endpoint}:`, error.message);
    }
  }
  
  logger.info('🔥 Cache warming completed');
}

// Cache management API endpoints
function addCacheRoutes(app) {
  // Get cache stats
  app.get('/api/cache/stats', (req, res) => {
    res.json({
      success: true,
      data: cache.stats()
    });
  });

  // Clear cache
  app.post('/api/cache/clear', (req, res) => {
    cache.clear();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  });

  // Warm cache
  app.post('/api/cache/warm', async (req, res) => {
    try {
      await warmCache();
      res.json({
        success: true,
        message: 'Cache warming initiated'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to warm cache'
      });
    }
  });
}

module.exports = {
  cacheMiddleware,
  cache,
  warmCache,
  addCacheRoutes
};