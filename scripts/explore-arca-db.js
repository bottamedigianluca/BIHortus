const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_ARCA_HOST,
  port: parseInt(process.env.DB_ARCA_PORT),
  database: process.env.DB_ARCA_DATABASE,
  user: process.env.DB_ARCA_USER,
  password: process.env.DB_ARCA_PASSWORD,
  options: {
    encrypt: process.env.DB_ARCA_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_ARCA_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

async function exploreDatabase() {
  try {
    console.log('🔍 Connessione al database ARCA...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connesso! Esplorazione tabelle...\n');
    
    // Lista tutte le tabelle
    console.log('=== TABELLE PRINCIPALI ===');
    const tablesQuery = `
      SELECT TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME IN ('SC', 'CF', 'DOTes', 'DORig', 'DOTotali', 'AR', 'ARCategoria', 'ARMarca', 'Agente')
      ORDER BY TABLE_NAME
    `;
    
    const tables = await pool.request().query(tablesQuery);
    tables.recordset.forEach(table => {
      console.log(`📋 ${table.TABLE_NAME}`);
    });
    
    // Esplora tabella SC (Scadenzario)
    console.log('\n=== STRUTTURA TABELLA SC (Scadenzario) ===');
    const scStructure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'SC'
      ORDER BY ORDINAL_POSITION
    `);
    
    scStructure.recordset.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // Controlla alcuni dati di esempio
    console.log('\n=== DATI DI ESEMPIO - TABELLA SC ===');
    const scSample = await pool.request().query(`
      SELECT TOP 3
        Id_SC, Cd_CF, DataScadenza, ImportoE, ImportoV, Pagata, NumFattura
      FROM SC 
      WHERE ImportoE > 0
      ORDER BY DataScadenza DESC
    `);
    
    scSample.recordset.forEach(row => {
      console.log(`  ID: ${row.Id_SC}, Cliente: ${row.Cd_CF}, Data: ${row.DataScadenza?.toISOString().slice(0,10)}, Importo: €${row.ImportoE}, Pagata: ${row.Pagata}`);
    });
    
    // Controlla se esistono le tabelle documenti
    console.log('\n=== TABELLE DOCUMENTI ===');
    const docTables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
        AND (TABLE_NAME LIKE 'DO%' OR TABLE_NAME LIKE 'Doc%')
      ORDER BY TABLE_NAME
    `);
    
    if (docTables.recordset.length > 0) {
      console.log('Tabelle documenti trovate:');
      docTables.recordset.forEach(table => {
        console.log(`  📄 ${table.TABLE_NAME}`);
      });
      
      // Se esiste DOTes, esploriamola
      const dotesExists = docTables.recordset.find(t => t.TABLE_NAME === 'DOTes');
      if (dotesExists) {
        console.log('\n=== STRUTTURA TABELLA DOTes ===');
        const dotesStructure = await pool.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'DOTes'
          ORDER BY ORDINAL_POSITION
        `);
        
        dotesStructure.recordset.forEach(col => {
          console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });
        
        // Alcuni dati esempio
        console.log('\n=== DATI DI ESEMPIO - DOTes ===');
        const dotesSample = await pool.request().query(`
          SELECT TOP 3 *
          FROM DOTes 
          ORDER BY DataDoc DESC
        `);
        
        if (dotesSample.recordset.length > 0) {
          console.log('Campi trovati:', Object.keys(dotesSample.recordset[0]).join(', '));
        }
      }
    } else {
      console.log('Nessuna tabella documenti standard trovata');
    }
    
    // Controlla tabella articoli
    console.log('\n=== TABELLA ARTICOLI ===');
    const arExists = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'AR'
    `);
    
    if (arExists.recordset.length > 0) {
      console.log('✅ Tabella AR (Articoli) trovata');
      
      const arSample = await pool.request().query(`
        SELECT TOP 3 Cd_AR, Descrizione, CostoStandard
        FROM AR 
        WHERE CostoStandard > 0
      `);
      
      arSample.recordset.forEach(row => {
        console.log(`  Art: ${row.Cd_AR} - ${row.Descrizione} - Costo: €${row.CostoStandard}`);
      });
    }
    
    // Statiche di base
    console.log('\n=== STATISTICHE DATABASE ===');
    
    const stats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM SC WHERE ImportoE > 0) as TotaleScadenze,
        (SELECT COUNT(*) FROM CF) as TotaleClienti,
        (SELECT SUM(ImportoE) FROM SC WHERE ImportoE > 0) as TotaleFatturato,
        (SELECT COUNT(*) FROM SC WHERE Pagata = 0 AND ImportoE > 0) as ScadenzeAperte
    `);
    
    const stat = stats.recordset[0];
    console.log(`📊 Totale scadenze: ${stat.TotaleScadenze}`);
    console.log(`👥 Totale clienti: ${stat.TotaleClienti}`);
    console.log(`💰 Fatturato totale: €${stat.TotaleFatturato?.toLocaleString()}`);
    console.log(`⏰ Scadenze aperte: ${stat.ScadenzeAperte}`);
    
    await pool.close();
    console.log('\n✅ Esplorazione completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

exploreDatabase();