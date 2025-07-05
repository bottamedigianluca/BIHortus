#!/usr/bin/env node

require('dotenv').config();
const arcaService = require('../src/services/database/arca');
const { logger } = require('../src/utils/logger');

async function testArcaConnection() {
  console.log('🔍 Testing Arca Evolution Connection');
  console.log('=====================================\n');
  
  try {
    console.log('📋 Configuration:');
    console.log(`   Host: ${process.env.DB_ARCA_HOST}`);
    console.log(`   Port: ${process.env.DB_ARCA_PORT}`);
    console.log(`   Database: ${process.env.DB_ARCA_DATABASE}`);
    console.log(`   User: ${process.env.DB_ARCA_USER}`);
    console.log(`   Encrypt: ${process.env.DB_ARCA_ENCRYPT}`);
    console.log('');
    
    // Test connessione
    console.log('🔌 Testing connection...');
    const connected = await arcaService.testConnection();
    
    if (!connected) {
      throw new Error('Connection test failed');
    }
    
    console.log('✅ Connection successful!\n');
    
    // Test query scadenzario
    console.log('📊 Testing scadenzario query...');
    const scadenze = await arcaService.getScadenzeAperte({ limit: 5 });
    console.log(`✅ Found ${scadenze.length} open scadenze\n`);
    
    if (scadenze.length > 0) {
      console.log('📋 Sample data:');
      scadenze.slice(0, 3).forEach((scadenza, index) => {
        console.log(`   ${index + 1}. ${scadenza.Cliente} - €${scadenza.ImportoE?.toLocaleString()}`);
        console.log(`      Scadenza: ${scadenza.DataScadenza?.toLocaleDateString('it-IT')}`);
        console.log(`      Fattura: ${scadenza.NumFattura || 'N/A'}`);
        console.log('');
      });
    }
    
    // Test query clienti
    console.log('👥 Testing clienti query...');
    const clienti = await arcaService.getClienti({ limit: 3 });
    console.log(`✅ Found ${clienti.length} clients\n`);
    
    if (clienti.length > 0) {
      console.log('📋 Sample clients:');
      clienti.forEach((cliente, index) => {
        console.log(`   ${index + 1}. ${cliente.Cd_CF} - ${cliente.Descrizione}`);
        console.log(`      P.IVA: ${cliente.PartitaIva || 'N/A'}`);
        console.log(`      Agente: ${cliente.Agente || 'N/A'}`);
        console.log('');
      });
    }
    
    // Test KPI dashboard
    console.log('📈 Testing dashboard KPI...');
    const kpi = await arcaService.getDashboardKPI();
    console.log('✅ Dashboard KPI retrieved\n');
    
    console.log('📊 KPI Summary:');
    console.log(`   Fatturato Oggi: €${kpi.fatturato_oggi?.toLocaleString()}`);
    console.log(`   Fatturato Mese: €${kpi.fatturato_mese?.toLocaleString()}`);
    console.log(`   Scaduto Totale: €${kpi.scaduto_totale?.toLocaleString()}`);
    console.log(`   Scadenze 7gg: €${kpi.scadenze_7gg?.toLocaleString()}`);
    console.log(`   Ordini Aperti: ${kpi.ordini_aperti}`);
    console.log(`   Clienti Attivi: ${kpi.clienti_attivi}`);
    console.log('');
    
    console.log('🎉 All tests passed! Arca Evolution integration is working correctly.');
    
    // Chiudi connessione
    await arcaService.close();
    
  } catch (error) {
    console.error('❌ Arca connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.message.includes('config.server')) {
      console.error('\n💡 Hint: Check if DB_ARCA_HOST is correctly set in .env file');
    } else if (error.message.includes('Login failed')) {
      console.error('\n💡 Hint: Check username and password in .env file');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Hint: Check if the Arca server is reachable and SQL Server is running');
    }
    
    console.error('\n📝 Please verify:');
    console.error('   1. Arca server is running and accessible');
    console.error('   2. SQL Server instance is active');
    console.error('   3. Database credentials are correct');
    console.error('   4. Network connectivity to the server');
    console.error('   5. Firewall settings allow SQL Server connections');
    
    process.exit(1);
  }
}

if (require.main === module) {
  testArcaConnection();
}

module.exports = { testArcaConnection };