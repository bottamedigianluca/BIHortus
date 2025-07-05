const sql = require('mssql');

// Multiple configuration tests
const configs = [
  {
    name: 'localhost default',
    config: {
      server: 'localhost',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  },
  {
    name: 'localhost with port',
    config: {
      server: 'localhost',
      port: 1433,
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  },
  {
    name: 'localhost with instance',
    config: {
      server: 'localhost\\MSSQLSERVER',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  },
  {
    name: 'Windows authentication',
    config: {
      server: 'localhost',
      database: 'ADB_BOTTAMEDI',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        trustedConnection: true
      }
    }
  },
  {
    name: '127.0.0.1',
    config: {
      server: '127.0.0.1',
      port: 1433,
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  },
  {
    name: 'Computer name',
    config: {
      server: process.env.COMPUTERNAME || 'DESKTOP-COMPUTER',
      database: 'ADB_BOTTAMEDI',
      user: 'bihortus_reader',
      password: 'BiHortus2025!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  }
];

async function testConnection(name, config) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`Server: ${config.server}${config.port ? ':' + config.port : ''}`);
  
  let pool = null;
  try {
    pool = new sql.ConnectionPool({
      ...config,
      connectionTimeout: 5000,
      requestTimeout: 5000
    });
    
    await pool.connect();
    console.log(`✅ ${name} - Connection successful!`);
    
    // Test simple query
    const result = await pool.request().query('SELECT 1 as test');
    console.log(`✅ ${name} - Query test successful!`);
    
    // Try to get database list
    try {
      const databases = await pool.request().query('SELECT name FROM sys.databases WHERE name = \'ADB_BOTTAMEDI\'');
      if (databases.recordset.length > 0) {
        console.log(`✅ ${name} - Database ADB_BOTTAMEDI found!`);
        
        // Try to get some table info
        const tables = await pool.request().query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          AND TABLE_NAME IN ('CF', 'SC', 'DOTes')
        `);
        console.log(`✅ ${name} - Found ${tables.recordset.length} ARCA tables`);
        
        return { success: true, config: config, tables: tables.recordset.length };
      } else {
        console.log(`⚠️  ${name} - Database ADB_BOTTAMEDI not found`);
      }
    } catch (dbError) {
      console.log(`⚠️  ${name} - Cannot access database info: ${dbError.message}`);
    }
    
    return { success: true, config: config };
    
  } catch (error) {
    console.log(`❌ ${name} - Failed: ${error.message}`);
    return { success: false, error: error.message };
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
  console.log('🚀 Starting SQL Server connection tests...\n');
  console.log(`💻 Computer: ${process.env.COMPUTERNAME || 'Unknown'}`);
  console.log(`👤 User: ${process.env.USERNAME || 'Unknown'}`);
  
  const results = [];
  
  for (const { name, config } of configs) {
    const result = await testConnection(name, config);
    results.push({ name, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`\n✅ SUCCESSFUL CONNECTIONS (${successful.length}):`);
    successful.forEach(result => {
      console.log(`   • ${result.name}${result.tables ? ` (${result.tables} tables)` : ''}`);
    });
    
    console.log('\n🎯 RECOMMENDED CONFIG:');
    console.log(JSON.stringify(successful[0].config, null, 2));
  } else {
    console.log('\n❌ NO SUCCESSFUL CONNECTIONS');
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ FAILED CONNECTIONS (${failed.length}):`);
    failed.forEach(result => {
      console.log(`   • ${result.name}: ${result.error}`);
    });
  }
  
  process.exit(0);
}

main().catch(console.error);