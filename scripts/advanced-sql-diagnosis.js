const sql = require('mssql');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 DIAGNOSI AVANZATA SQL SERVER - BiHortus ARCA Connection');
console.log('='.repeat(70));

// Credenziali fornite dall'utente
const userCredentials = {
  server: 'PCARCA-2023',
  database: 'ADB_BOTTAMEDI', 
  user: 'bihortus_reader',
  password: 'BiHortus2025!'
};

// Test configurations da provare
const testConfigs = [
  {
    name: 'Config Originale (PCARCA-2023)',
    config: {
      server: 'PCARCA-2023',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader', 
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 10000,
        requestTimeout: 10000
      }
    }
  },
  {
    name: 'Config Localhost',
    config: {
      server: 'localhost',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!', 
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 10000,
        requestTimeout: 10000
      }
    }
  },
  {
    name: 'Config 127.0.0.1',
    config: {
      server: '127.0.0.1',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 10000,
        requestTimeout: 10000
      }
    }
  },
  {
    name: 'Config con Istanza MSSQLSERVER',
    config: {
      server: 'localhost\\MSSQLSERVER',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 10000,
        requestTimeout: 10000,
        instanceName: 'MSSQLSERVER'
      }
    }
  },
  {
    name: 'Config Computer Name',
    config: {
      server: process.env.COMPUTERNAME || 'COMPUTER',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 10000,
        requestTimeout: 10000
      }
    }
  },
  {
    name: 'Config Windows Authentication',
    config: {
      server: 'localhost',
      database: 'ADB_BOTTAMEDI',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 10000,
        requestTimeout: 10000,
        trustedConnection: true
      }
    }
  },
  {
    name: 'Config PCARCA con Porta',
    config: {
      server: 'PCARCA-2023',
      port: 1433,
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 10000,
        requestTimeout: 10000
      }
    }
  }
];

async function runSystemChecks() {
  console.log('\n🖥️  CONTROLLI SISTEMA');
  console.log('-'.repeat(50));
  
  try {
    // Check computer name
    try {
      const { stdout } = await execAsync('hostname');
      console.log(`✅ Computer Name: ${stdout.trim()}`);
    } catch (e) {
      console.log(`❌ Impossibile ottenere hostname: ${e.message}`);
    }

    // Check if SQL Server services are running
    try {
      const { stdout } = await execAsync('sc query MSSQLSERVER');
      console.log('✅ Servizio MSSQLSERVER trovato:');
      console.log(stdout.trim());
    } catch (e) {
      console.log('❌ Servizio MSSQLSERVER non trovato o non accessibile');
    }

    // Check SQL Server Browser
    try {
      const { stdout } = await execAsync('sc query SQLBrowser');
      console.log('✅ Servizio SQLBrowser trovato:');
      console.log(stdout.trim());
    } catch (e) {
      console.log('❌ Servizio SQLBrowser non trovato');
    }

    // Check TCP port 1433
    try {
      const { stdout } = await execAsync('netstat -an | findstr :1433');
      if (stdout.trim()) {
        console.log('✅ Porta 1433 in ascolto:');
        console.log(stdout.trim());
      } else {
        console.log('❌ Porta 1433 non in ascolto');
      }
    } catch (e) {
      console.log('❌ Impossibile verificare porta 1433');
    }

    // Check if we can ping PCARCA-2023
    try {
      const { stdout } = await execAsync('ping -n 1 PCARCA-2023');
      console.log('✅ PCARCA-2023 raggiungibile via ping');
    } catch (e) {
      console.log('❌ PCARCA-2023 NON raggiungibile via ping');
    }

  } catch (error) {
    console.log(`❌ Errore nei controlli sistema: ${error.message}`);
  }
}

async function testSQLConnection(name, config) {
  console.log(`\n🔍 Test: ${name}`);
  console.log('-'.repeat(30));
  console.log(`Server: ${config.server}${config.port ? ':' + config.port : ''}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user || 'Windows Auth'}`);
  
  let pool = null;
  try {
    pool = new sql.ConnectionPool(config);
    
    // Test connection
    console.log('⏳ Connessione in corso...');
    await pool.connect();
    console.log('✅ CONNESSIONE RIUSCITA!');
    
    // Test simple query
    console.log('⏳ Test query semplice...');
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database');
    console.log('✅ Query eseguita con successo!');
    console.log(`   Database: ${result.recordset[0].database}`);
    console.log(`   Version: ${result.recordset[0].version.substring(0, 100)}...`);
    
    // Test if ADB_BOTTAMEDI exists
    console.log('⏳ Verifica esistenza database ADB_BOTTAMEDI...');
    const dbCheck = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = 'ADB_BOTTAMEDI'
    `);
    
    if (dbCheck.recordset.length > 0) {
      console.log('✅ Database ADB_BOTTAMEDI TROVATO!');
      
      // Try to switch to ADB_BOTTAMEDI and get tables
      try {
        const tablesResult = await pool.request().query(`
          USE ADB_BOTTAMEDI;
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          AND TABLE_NAME IN ('CF', 'SC', 'DOTes', 'DORig', 'DOTotali', 'AR')
          ORDER BY TABLE_NAME
        `);
        
        console.log(`✅ Tabelle ARCA trovate: ${tablesResult.recordset.length}`);
        tablesResult.recordset.forEach(table => {
          console.log(`   📋 ${table.TABLE_NAME}`);
        });
        
        // Test a query on CF table (customers)
        try {
          const cfTest = await pool.request().query(`
            USE ADB_BOTTAMEDI;
            SELECT TOP 3 Cd_CF, Descrizione FROM CF WHERE Cliente = 1
          `);
          console.log(`✅ Test tabella CF riuscito - ${cfTest.recordset.length} clienti trovati`);
          cfTest.recordset.forEach(client => {
            console.log(`   👤 ${client.Cd_CF}: ${client.Descrizione}`);
          });
        } catch (cfError) {
          console.log(`⚠️  Tabella CF non accessibile: ${cfError.message}`);
        }
        
      } catch (tableError) {
        console.log(`⚠️  Errore accesso tabelle: ${tableError.message}`);
      }
      
    } else {
      console.log('❌ Database ADB_BOTTAMEDI NON TROVATO!');
      
      // List available databases
      const dbList = await pool.request().query(`
        SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
      `);
      console.log('📋 Database disponibili:');
      dbList.recordset.forEach(db => {
        console.log(`   💾 ${db.name}`);
      });
    }
    
    return { 
      success: true, 
      config: config,
      hasArcaDb: dbCheck.recordset.length > 0
    };
    
  } catch (error) {
    console.log(`❌ CONNESSIONE FALLITA: ${error.message}`);
    console.log(`   Codice errore: ${error.code}`);
    
    if (error.code === 'ELOGIN') {
      console.log('   💡 Problema di autenticazione - verificare username/password');
    } else if (error.code === 'ETIMEOUT' || error.code === 'ESOCKET') {
      console.log('   💡 Problema di rete - verificare server name e porta');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 Server non trovato - verificare nome server');
    }
    
    return { success: false, error: error.message, code: error.code };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

async function main() {
  console.log(`🚀 Inizio diagnosi: ${new Date().toISOString()}`);
  console.log(`💻 Ambiente: ${process.platform} - Node.js ${process.version}`);
  
  // Run system checks first
  await runSystemChecks();
  
  console.log('\n📡 TEST CONNESSIONI SQL SERVER');
  console.log('='.repeat(70));
  
  const results = [];
  
  for (const { name, config } of testConfigs) {
    const result = await testSQLConnection(name, config);
    results.push({ name, ...result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 RIEPILOGO RISULTATI');
  console.log('='.repeat(70));
  
  const successful = results.filter(r => r.success);
  const withArcaDb = results.filter(r => r.success && r.hasArcaDb);
  
  if (withArcaDb.length > 0) {
    console.log(`\n🎉 SUCCESSO! ${withArcaDb.length} configurazioni funzionanti con database ARCA:`);
    withArcaDb.forEach(result => {
      console.log(`   ✅ ${result.name}`);
    });
    
    console.log('\n🎯 CONFIGURAZIONE RACCOMANDATA:');
    const best = withArcaDb[0];
    console.log(JSON.stringify(best.config, null, 2));
    
  } else if (successful.length > 0) {
    console.log(`\n⚠️  ${successful.length} connessioni riuscite ma senza database ADB_BOTTAMEDI:`);
    successful.forEach(result => {
      console.log(`   🔶 ${result.name}`);
    });
    
  } else {
    console.log('\n❌ NESSUNA CONNESSIONE RIUSCITA');
    console.log('\n🔧 AZIONI SUGGERITE:');
    console.log('1. Verificare che SQL Server sia avviato');
    console.log('2. Verificare che il database ADB_BOTTAMEDI esista');
    console.log('3. Verificare che l\'utente bihortus_reader esista e abbia permessi');
    console.log('4. Verificare che TCP/IP sia abilitato in SQL Server Configuration Manager');
    console.log('5. Verificare che la porta 1433 sia aperta nel firewall');
  }
  
  console.log('\n🔍 ANALISI ERRORI:');
  const failed = results.filter(r => !r.success);
  const errorCounts = {};
  failed.forEach(result => {
    const code = result.code || 'UNKNOWN';
    errorCounts[code] = (errorCounts[code] || 0) + 1;
  });
  
  Object.entries(errorCounts).forEach(([code, count]) => {
    console.log(`   ${code}: ${count} occorrenze`);
  });
  
  process.exit(0);
}

main().catch(console.error);