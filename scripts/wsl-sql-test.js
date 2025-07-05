const sql = require('mssql');

console.log('🔍 WSL SQL Server Connection Test');
console.log('='.repeat(50));
console.log(`Computer Name: PCARCA-2023`);
console.log(`Environment: WSL/Linux accessing Windows SQL Server`);

// Le credenziali ESATTE fornite dall'utente
const originalCredentials = {
  server: 'PCARCA-2023',
  database: 'ADB_BOTTAMEDI', 
  user: 'bihortus_reader',
  password: 'BiHortus2025!'
};

// Configurazioni da testare specifiche per WSL
const configs = [
  {
    name: 'WSL → Windows Host (via computer name)',
    config: {
      server: 'PCARCA-2023.local',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'WSL → Windows Host (via localhost)',
    config: {
      server: 'localhost',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'WSL → Windows SQL Server (named instance)',
    config: {
      server: 'PCARCA-2023\\SQLEXPRESS',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'Windows IP diretto (se configurato)',
    config: {
      server: '192.168.1.100', // IP esempio - potrebbe essere diverso
      port: 1433,
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'Via 127.0.0.1 con porta specifica',
    config: {
      server: '127.0.0.1',
      port: 1433,
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'PCARCA-2023 istanza default',
    config: {
      server: 'PCARCA-2023\\MSSQLSERVER',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'Test password alternativa',
    config: {
      server: 'PCARCA-2023',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'bihortus2025!', // Lowercase test
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'Test utente alternativo',
    config: {
      server: 'PCARCA-2023',
      database: 'ADB_BOTTAMEDI',
      user: 'sa', // SQL Server admin
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 15000,
        requestTimeout: 15000
      }
    }
  }
];

async function testConnection(name, config) {
  console.log(`\n🔍 ${name}`);
  console.log(`   Server: ${config.server}${config.port ? ':' + config.port : ''}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  
  let pool = null;
  try {
    pool = new sql.ConnectionPool(config);
    
    console.log('   ⏳ Connessione...');
    await pool.connect();
    console.log('   ✅ CONNESSO!');
    
    // Test query
    const result = await pool.request().query('SELECT @@SERVERNAME as server, DB_NAME() as currentDb');
    console.log(`   📡 Server: ${result.recordset[0].server}`);
    console.log(`   💾 Database corrente: ${result.recordset[0].currentDb}`);
    
    // Check if ADB_BOTTAMEDI exists
    const dbCheck = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = 'ADB_BOTTAMEDI'
    `);
    
    if (dbCheck.recordset.length > 0) {
      console.log('   ✅ Database ADB_BOTTAMEDI TROVATO!');
      
      // Try to access ADB_BOTTAMEDI tables
      try {
        const tableCheck = await pool.request().query(`
          SELECT COUNT(*) as tableCount
          FROM ADB_BOTTAMEDI.INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME IN ('CF', 'SC', 'DOTes')
        `);
        console.log(`   ✅ Tabelle ARCA trovate: ${tableCheck.recordset[0].tableCount}`);
        
        // Test access to CF table
        const cfTest = await pool.request().query(`
          SELECT TOP 1 Cd_CF, Descrizione FROM ADB_BOTTAMEDI.dbo.CF
        `);
        console.log(`   ✅ Accesso tabella CF riuscito!`);
        console.log(`   👤 Cliente esempio: ${cfTest.recordset[0]?.Cd_CF} - ${cfTest.recordset[0]?.Descrizione}`);
        
        return { success: true, hasArcaAccess: true, config };
        
      } catch (tableError) {
        console.log(`   ⚠️ Database trovato ma tabelle non accessibili: ${tableError.message}`);
        return { success: true, hasArcaAccess: false, config, error: tableError.message };
      }
      
    } else {
      console.log('   ❌ Database ADB_BOTTAMEDI non trovato');
      
      // List available databases
      const dbList = await pool.request().query(`
        SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
        ORDER BY name
      `);
      console.log('   📋 Database disponibili:');
      dbList.recordset.forEach(db => console.log(`      • ${db.name}`));
      
      return { success: true, hasArcaAccess: false, config, availableDbs: dbList.recordset };
    }
    
  } catch (error) {
    console.log(`   ❌ ERRORE: ${error.message}`);
    console.log(`   🔴 Codice: ${error.code || 'UNKNOWN'}`);
    
    // Detailed error analysis
    if (error.code === 'ELOGIN') {
      console.log('   💡 PROBLEMA AUTENTICAZIONE - username/password errati');
    } else if (error.code === 'ETIMEOUT') {
      console.log('   💡 TIMEOUT - server non raggiungibile o lento');
    } else if (error.code === 'ESOCKET') {
      console.log('   💡 PROBLEMA RETE - porta chiusa o firewall');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 SERVER NON TROVATO - nome server errato');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   💡 CONNESSIONE RIFIUTATA - servizio SQL non attivo');
    }
    
    return { success: false, error: error.message, code: error.code };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // Ignore
      }
    }
  }
}

async function main() {
  console.log('\n🚀 INIZIO TEST...\n');
  
  const results = [];
  
  for (const test of configs) {
    const result = await testConnection(test.name, test.config);
    results.push({ name: test.name, ...result });
    
    // Piccola pausa tra i test
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // RISULTATI FINALI
  console.log('\n' + '='.repeat(60));
  console.log('📊 RISULTATI FINALI');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const withArcaAccess = results.filter(r => r.success && r.hasArcaAccess);
  
  if (withArcaAccess.length > 0) {
    console.log('\n🎉 SUCCESSO COMPLETO!');
    console.log(`✅ ${withArcaAccess.length} configurazioni funzionanti con accesso ARCA:`);
    withArcaAccess.forEach(r => console.log(`   • ${r.name}`));
    
    console.log('\n🎯 CONFIGURAZIONE OTTIMALE:');
    const best = withArcaAccess[0];
    console.log(JSON.stringify(best.config, null, 2));
    
  } else if (successful.length > 0) {
    console.log('\n⚠️ CONNESSIONE PARZIALE');
    console.log(`✅ ${successful.length} connessioni SQL riuscite ma problemi con ADB_BOTTAMEDI:`);
    successful.forEach(r => {
      console.log(`   • ${r.name}`);
      if (r.availableDbs) {
        console.log(`     Database disponibili: ${r.availableDbs.map(db => db.name).join(', ')}`);
      }
    });
    
  } else {
    console.log('\n❌ NESSUNA CONNESSIONE RIUSCITA');
    
    const errorGroups = {};
    results.forEach(r => {
      if (!r.success) {
        const code = r.code || 'UNKNOWN';
        if (!errorGroups[code]) errorGroups[code] = [];
        errorGroups[code].push(r.name);
      }
    });
    
    console.log('\n🔍 ANALISI ERRORI:');
    Object.entries(errorGroups).forEach(([code, names]) => {
      console.log(`   ${code}: ${names.length} casi`);
      names.forEach(name => console.log(`      - ${name}`));
    });
    
    console.log('\n🛠️ PROSSIMI PASSI:');
    console.log('1. Verificare che SQL Server sia installato e avviato su Windows');
    console.log('2. Verificare che il database ADB_BOTTAMEDI esista');
    console.log('3. Creare l\'utente bihortus_reader se non esiste');
    console.log('4. Abilitare TCP/IP in SQL Server Configuration Manager');
    console.log('5. Aprire porta 1433 nel firewall Windows');
  }
  
  process.exit(0);
}

main().catch(console.error);