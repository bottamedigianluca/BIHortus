const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Services
const sqliteService = require('../services/database/sqlite');
const arcaService = require('../services/database/arca');
const cloudSyncService = require('../services/sync/cloud-sync');
const reconciliationService = require('../services/banking/reconciliation');
const { logger, logUtils } = require('../utils/logger');
const { cacheMiddleware, addCacheRoutes, warmCache } = require('../middleware/cache');
const nightlyETL = require('../services/etl/nightly-etl');

// Routes
const dashboardRoutes = require('./routes/dashboard');
const reconciliationRoutes = require('./routes/reconciliation');
const analyticsRoutes = require('./routes/analytics');
const syncRoutes = require('./routes/sync');
const bankingRoutes = require('./routes/banking');
const notificationsRoutes = require('./routes/notifications');
const activitiesRoutes = require('./routes/activities');
const arcaRoutes = require('./routes/arca');
const customersRoutes = require('./routes/customers');
const invoicesRoutes = require('./routes/invoices');
const productsRoutes = require('./routes/products');
const settingsRoutes = require('./routes/settings');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        sqlite: sqliteService.isConnected,
        arca: arcaService.isConnected,
        cloudSync: cloudSyncService.isConnected
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API Routes
// Apply intelligent caching to all API routes
app.use('/api', cacheMiddleware());

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/arca', arcaRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/settings', settingsRoutes);

// Add cache management routes
addCacheRoutes(app);

// ETL management routes
app.get('/api/etl/status', (req, res) => {
  res.json({
    success: true,
    data: nightlyETL.getStatus()
  });
});

app.post('/api/etl/run', async (req, res) => {
  try {
    await nightlyETL.runETL();
    res.json({
      success: true,
      message: 'ETL process completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'ETL process failed',
      details: error.message
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body
  });
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info('Client connected to WebSocket', { socketId: socket.id });
  
  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(`Client joined room: ${room}`, { socketId: socket.id });
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected from WebSocket', { socketId: socket.id });
  });
});

// Make io available globally for other modules
global.io = io;

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close database connections
  try {
    await sqliteService.close();
    await arcaService.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', error);
  }
  
  process.exit(0);
}

// Initialize services and start server
async function startServer() {
  try {
    logger.info('🚀 Starting BiHortus server...');
    
    // Initialize SQLite
    await sqliteService.connect();
    
    // Initialize Arca connection (optional) - with timeout
    try {
      const arcaConnectPromise = arcaService.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      await Promise.race([arcaConnectPromise, timeoutPromise]);
      logger.info('✅ Arca Evolution connected successfully');
    } catch (error) {
      logger.warn('⚠️ Arca Evolution not available, running in offline mode', error.message);
      // Force disconnect to reset state
      arcaService.isConnected = false;
      if (arcaService.pool) {
        try {
          await arcaService.pool.close();
        } catch (closeError) {
          // Ignore close errors
        }
        arcaService.pool = null;
      }
    }
    
    // Initialize Cloud Sync (optional) - with timeout
    try {
      const cloudSyncPromise = cloudSyncService.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cloud sync timeout')), 3000)
      );
      
      await Promise.race([cloudSyncPromise, timeoutPromise]);
      cloudSyncService.scheduleSync();
      logger.info('✅ Cloud sync initialized successfully');
    } catch (error) {
      logger.warn('⚠️ Cloud sync not available, running in local mode', error.message);
    }
    
    // Start server
    server.listen(PORT, async () => {
      logger.info(`🌟 BiHortus server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
      
      // Initialize background services
      setTimeout(async () => {
        if (arcaService.isConnected) {
          // Start nightly ETL scheduler
          nightlyETL.start();
          
          // Warm cache for critical endpoints
          await warmCache();
        }
      }, 5000); // Wait 5 seconds for server to be fully ready
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io };