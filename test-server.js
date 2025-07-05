// Test server startup
require('dotenv').config();

async function startTestServer() {
  try {
    console.log('🚀 Starting BiHortus test server...');
    
    // Carica i servizi
    const sqliteService = require('./src/services/database/sqlite');
    
    // Inizializza SQLite
    await sqliteService.connect();
    console.log('✅ SQLite initialized');
    
    // Avvia server
    require('./src/api/server');
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error);
    process.exit(1);
  }
}

startTestServer();