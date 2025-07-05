#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🌟 BiHortus - Setup Iniziale');
console.log('===============================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('📋 Configurazione Ambiente\n');
  
  const config = {};
  
  // Database Arca
  console.log('🗄️  Configurazione Database Arca Evolution:');
  config.DB_ARCA_HOST = await question('Host Arca (default: localhost): ') || 'localhost';
  config.DB_ARCA_PORT = await question('Porta Arca (default: 1433): ') || '1433';
  config.DB_ARCA_DATABASE = await question('Nome Database (default: ADB_BOTTAMEDI): ') || 'ADB_BOTTAMEDI';
  config.DB_ARCA_USER = await question('Username Arca: ');
  config.DB_ARCA_PASSWORD = await question('Password Arca: ');
  
  // Cloud Sync
  console.log('\n☁️  Configurazione Cloud Sync:');
  const enableCloud = await question('Abilitare sincronizzazione cloud? (y/n): ');
  config.CLOUD_SYNC_ENABLED = enableCloud.toLowerCase() === 'y' ? 'true' : 'false';
  
  if (config.CLOUD_SYNC_ENABLED === 'true') {
    config.CLOUD_SYNC_PROVIDER = await question('Provider cloud (supabase/firebase): ') || 'supabase';
    if (config.CLOUD_SYNC_PROVIDER === 'supabase') {
      config.CLOUD_SYNC_URL = await question('Supabase URL: ');
      config.CLOUD_SYNC_KEY = await question('Supabase Key: ');
    }
  }
  
  // Security
  console.log('\n🔒 Configurazione Sicurezza:');
  config.JWT_SECRET = generateRandomString(64);
  config.ENCRYPTION_KEY = generateRandomString(32);
  config.API_KEY = generateRandomString(32);
  
  // Server
  console.log('\n🌐 Configurazione Server:');
  config.PORT = await question('Porta server (default: 5000): ') || '5000';
  config.CLIENT_PORT = await question('Porta client (default: 3000): ') || '3000';
  config.NODE_ENV = 'development';
  
  // Logging
  config.LOG_LEVEL = 'info';
  config.LOG_FILE = './logs/bihortus.log';
  
  // Backup
  config.BACKUP_ENABLED = 'true';
  config.BACKUP_INTERVAL = 'daily';
  config.BACKUP_RETENTION_DAYS = '30';
  config.BACKUP_PATH = './database/backups';
  
  // Notification
  config.NOTIFICATION_ENABLED = 'true';
  const adminEmail = await question('Email amministratore: ');
  config.NOTIFICATION_EMAIL = adminEmail;
  
  // Performance
  config.CACHE_ENABLED = 'true';
  config.CACHE_TTL = '3600';
  config.QUERY_TIMEOUT = '30000';
  
  // Salva configurazione
  await saveEnvironmentFile(config);
  
  console.log('\n✅ Configurazione salvata in .env');
}

function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

async function saveEnvironmentFile(config) {
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const envPath = path.join(__dirname, '../../.env');
  await fs.promises.writeFile(envPath, envContent);
}

async function createDirectories() {
  console.log('\n📁 Creazione directory...');
  
  const directories = [
    'logs',
    'database/sqlite',
    'database/backups',
    'uploads',
    'public/assets'
  ];
  
  for (const dir of directories) {
    const fullPath = path.join(__dirname, '../../', dir);
    try {
      await fs.promises.mkdir(fullPath, { recursive: true });
      console.log(`   ✓ ${dir}`);
    } catch (error) {
      console.log(`   ⚠️  ${dir} (già esistente)`);
    }
  }
}

async function initializeDatabase() {
  console.log('\n🗄️  Inizializzazione database SQLite...');
  
  try {
    const sqliteService = require('../../src/services/database/sqlite');
    await sqliteService.connect();
    console.log('   ✓ Database SQLite inizializzato');
    await sqliteService.close();
  } catch (error) {
    console.log(`   ❌ Errore database: ${error.message}`);
  }
}

async function testConnections() {
  console.log('\n🔍 Test connessioni...');
  
  // Test Arca
  try {
    const arcaService = require('../../src/services/database/arca');
    const connected = await arcaService.testConnection();
    if (connected) {
      console.log('   ✓ Connessione Arca Evolution OK');
    } else {
      console.log('   ⚠️  Connessione Arca Evolution non disponibile');
    }
    await arcaService.close();
  } catch (error) {
    console.log('   ⚠️  Arca Evolution non configurato o non disponibile');
  }
  
  // Test Cloud
  if (process.env.CLOUD_SYNC_ENABLED === 'true') {
    try {
      const cloudSyncService = require('../../src/services/sync/cloud-sync');
      await cloudSyncService.initialize();
      console.log('   ✓ Connessione Cloud OK');
    } catch (error) {
      console.log('   ⚠️  Connessione Cloud non disponibile');
    }
  }
}

async function showSummary() {
  console.log('\n🎉 Setup Completato!');
  console.log('==================');
  console.log('');
  console.log('📋 Prossimi passi:');
  console.log('');
  console.log('1. Avvia il server di sviluppo:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Apri il browser su:');
  console.log(`   http://localhost:${process.env.CLIENT_PORT || 3000}`);
  console.log('');
  console.log('3. Per la produzione:');
  console.log('   npm run build');
  console.log('   npm start');
  console.log('');
  console.log('📖 Documentazione: README.md');
  console.log('🆘 Supporto: support@bottamedi.com');
  console.log('');
}

async function main() {
  try {
    await setupEnvironment();
    await createDirectories();
    
    // Carica la configurazione
    require('dotenv').config();
    
    await initializeDatabase();
    await testConnections();
    await showSummary();
    
  } catch (error) {
    console.error('\n❌ Errore durante il setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };