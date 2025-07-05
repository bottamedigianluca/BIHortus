const sql = require('mssql');

async function testDirectConnection() {
    console.log('🔍 Testing direct SQL Server connection from WSL');
    console.log('='.repeat(60));
    
    // Get Windows host IP from WSL
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
        // Get Windows host IP
        const { stdout } = await execAsync('ip route show | grep -i default | awk \'{print $3}\'');
        const windowsHostIP = stdout.trim();
        console.log(`Windows Host IP: ${windowsHostIP}`);
        
        // Test configuration with Windows host IP
        const config = {
            server: windowsHostIP,
            port: 1433,
            user: 'bihortus_reader',
            password: 'BiHortus2025!',
            database: 'master', // Connect to master first
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true,
                connectionTimeout: 30000,
                requestTimeout: 30000
            }
        };
        
        console.log('🚀 Attempting connection to SQL Server...');
        console.log(`   Server: ${config.server}:${config.port}`);
        console.log(`   User: ${config.user}`);
        
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        
        console.log('✅ CONNECTION SUCCESSFUL!');
        
        // Test server info
        const serverInfo = await pool.request().query('SELECT @@SERVERNAME as ServerName, @@VERSION as Version');
        console.log(`📡 Server Name: ${serverInfo.recordset[0].ServerName}`);
        console.log(`📋 Version: ${serverInfo.recordset[0].Version.substring(0, 100)}...`);
        
        // List all databases
        const dbQuery = await pool.request().query(`
            SELECT name, database_id, create_date 
            FROM sys.databases 
            ORDER BY name
        `);
        
        console.log('\n📊 Available Databases:');
        dbQuery.recordset.forEach((db, index) => {
            console.log(`   ${index + 1}. ${db.name} (ID: ${db.database_id}) - Created: ${db.create_date.toISOString().split('T')[0]}`);
        });
        
        // Check if ADB_BOTTAMEDI exists
        const arcaDb = dbQuery.recordset.find(db => db.name === 'ADB_BOTTAMEDI');
        if (arcaDb) {
            console.log('\n🎉 ADB_BOTTAMEDI DATABASE FOUND!');
            
            // Test connecting directly to ADB_BOTTAMEDI
            const arcaConfig = {
                ...config,
                database: 'ADB_BOTTAMEDI'
            };
            
            const arcaPool = new sql.ConnectionPool(arcaConfig);
            await arcaPool.connect();
            
            console.log('✅ Connected to ADB_BOTTAMEDI successfully!');
            
            // Test ARCA tables
            const tables = await arcaPool.request().query(`
                SELECT TABLE_NAME, TABLE_TYPE 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                AND TABLE_NAME IN ('CF', 'SC', 'DOTes', 'DORig', 'AR', 'DOTotali')
                ORDER BY TABLE_NAME
            `);
            
            console.log('\n📋 ARCA Tables Found:');
            tables.recordset.forEach(table => {
                console.log(`   ✅ ${table.TABLE_NAME}`);
            });
            
            // Test a simple query on CF table
            try {
                const cfTest = await arcaPool.request().query(`
                    SELECT TOP 3 Cd_CF, Descrizione 
                    FROM CF 
                    WHERE Cliente = 1
                `);
                
                console.log(`\n👥 Sample Customers from CF table:`);
                cfTest.recordset.forEach(customer => {
                    console.log(`   ${customer.Cd_CF}: ${customer.Descrizione}`);
                });
                
                console.log('\n🎯 FINAL RESULT: ARCA CONNECTION FULLY FUNCTIONAL!');
                console.log('\n📋 Working Configuration:');
                console.log(JSON.stringify({
                    server: windowsHostIP,
                    port: 1433,
                    database: 'ADB_BOTTAMEDI',
                    user: 'bihortus_reader',
                    password: 'BiHortus2025!',
                    options: {
                        encrypt: false,
                        trustServerCertificate: true,
                        enableArithAbort: true
                    }
                }, null, 2));
                
            } catch (queryError) {
                console.log(`⚠️ Table access error: ${queryError.message}`);
            }
            
            await arcaPool.close();
            
        } else {
            console.log('\n❌ ADB_BOTTAMEDI database not found');
            console.log('   Please check if the database name is correct or if it exists');
        }
        
        await pool.close();
        
    } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        
        if (error.code === 'ELOGIN') {
            console.log('   💡 Authentication failed - check username/password');
        } else if (error.code === 'ESOCKET') {
            console.log('   💡 Network error - check IP and port');
        } else if (error.code === 'ETIMEOUT') {
            console.log('   💡 Connection timeout - check server availability');
        }
    }
}

testDirectConnection().catch(console.error);