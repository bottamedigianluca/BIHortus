const sql = require('mssql');
const config = require('../../../config/database');

class ArcaService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.pool = new sql.ConnectionPool(config.arca);
      await this.pool.connect();
      this.isConnected = true;
      console.log('✅ Arca Evolution database connected successfully');
      return this.pool;
    } catch (error) {
      console.error('❌ Arca connection failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      if (!this.isConnected) await this.connect();
      const result = await this.pool.request().query('SELECT 1 as test');
      return result.recordset[0].test === 1;
    } catch (error) {
      console.error('❌ Arca connection test failed:', error);
      return false;
    }
  }

  // Scadenzario - Dati per riconciliazione
  async getScadenzeAperte(filters = {}) {
    try {
      if (!this.isConnected) await this.connect();

      let query = `
        SELECT 
          sc.Id_SC,
          sc.Cd_CF,
          cf.Descrizione as Cliente,
          sc.DataScadenza,
          sc.ImportoE,
          sc.ImportoV,
          sc.NumFattura,
          sc.Descrizione as DescrizioneScadenza,
          cf.PartitaIva,
          cf.CodiceFiscale,
          cf.Indirizzo,
          cf.Cap,
          cf.Localita,
          ag.Descrizione as Agente,
          -- Calcolo giorni scadenza
          DATEDIFF(day, sc.DataScadenza, GETDATE()) as GiorniScadenza,
          -- Flag priorità
          CASE 
            WHEN sc.DataScadenza < GETDATE() THEN 'SCADUTO'
            WHEN sc.DataScadenza <= DATEADD(day, 7, GETDATE()) THEN 'SCADE_7GG'
            WHEN sc.DataScadenza <= DATEADD(day, 30, GETDATE()) THEN 'SCADE_30GG'
            ELSE 'FUTURO'
          END as StatoScadenza
        FROM SC sc
        JOIN CF cf ON sc.Cd_CF = cf.Cd_CF
        LEFT JOIN Agente ag ON cf.Cd_Agente_1 = ag.Cd_Agente
        WHERE sc.Pagata = 0
        AND sc.ImportoE > 0
      `;

      const params = [];

      if (filters.cliente) {
        query += ' AND cf.Cd_CF = @cliente';
        params.push({ name: 'cliente', value: filters.cliente });
      }

      if (filters.importo_min) {
        query += ' AND sc.ImportoE >= @importo_min';
        params.push({ name: 'importo_min', value: filters.importo_min });
      }

      if (filters.importo_max) {
        query += ' AND sc.ImportoE <= @importo_max';
        params.push({ name: 'importo_max', value: filters.importo_max });
      }

      if (filters.data_scadenza_da) {
        query += ' AND sc.DataScadenza >= @data_scadenza_da';
        params.push({ name: 'data_scadenza_da', value: filters.data_scadenza_da });
      }

      if (filters.data_scadenza_a) {
        query += ' AND sc.DataScadenza <= @data_scadenza_a';
        params.push({ name: 'data_scadenza_a', value: filters.data_scadenza_a });
      }

      if (filters.solo_scadute) {
        query += ' AND sc.DataScadenza < GETDATE()';
      }

      query += ' ORDER BY sc.DataScadenza ASC, sc.ImportoE DESC';

      if (filters.limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }

      const request = this.pool.request();
      params.forEach(param => {
        request.input(param.name, param.value);
      });

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error fetching scadenze:', error);
      throw error;
    }
  }

  // Clienti - Anagrafica per matching
  async getClienti(filters = {}) {
    try {
      if (!this.isConnected) await this.connect();

      let query = `
        SELECT 
          cf.Cd_CF,
          cf.Descrizione,
          cf.PartitaIva,
          cf.CodiceFiscale,
          cf.Indirizzo,
          cf.Cap,
          cf.Localita,
          cf.Cd_Provincia,
          cf.Cd_Nazione,
          cf.Cliente,
          cf.Fornitore,
          cf.Fido,
          ag.Descrizione as Agente,
          -- Statistiche cliente
          (SELECT COUNT(*) FROM SC WHERE Cd_CF = cf.Cd_CF AND Pagata = 0) as ScadenzeAperte,
          (SELECT SUM(ImportoE) FROM SC WHERE Cd_CF = cf.Cd_CF AND Pagata = 0) as EsposizioneTotale,
          (SELECT SUM(ImportoE) FROM SC WHERE Cd_CF = cf.Cd_CF AND Pagata = 0 AND DataScadenza < GETDATE()) as Scaduto
        FROM CF cf
        LEFT JOIN Agente ag ON cf.Cd_Agente_1 = ag.Cd_Agente
        WHERE cf.Obsoleto = 0
        AND cf.Cliente = 1
      `;

      const params = [];

      if (filters.codice) {
        query += ' AND cf.Cd_CF = @codice';
        params.push({ name: 'codice', value: filters.codice });
      }

      if (filters.descrizione) {
        query += ' AND cf.Descrizione LIKE @descrizione';
        params.push({ name: 'descrizione', value: `%${filters.descrizione}%` });
      }

      if (filters.partita_iva) {
        query += ' AND cf.PartitaIva = @partita_iva';
        params.push({ name: 'partita_iva', value: filters.partita_iva });
      }

      if (filters.solo_con_scadenze) {
        query += ' AND EXISTS (SELECT 1 FROM SC WHERE Cd_CF = cf.Cd_CF AND Pagata = 0)';
      }

      query += ' ORDER BY cf.Descrizione';

      if (filters.limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }

      const request = this.pool.request();
      params.forEach(param => {
        request.input(param.name, param.value);
      });

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error fetching clienti:', error);
      throw error;
    }
  }

  // Fatturato - Analytics
  async getFatturatoAnalytics(filters = {}) {
    try {
      if (!this.isConnected) await this.connect();

      const query = `
        SELECT 
          YEAR(dt.DataDoc) as Anno,
          MONTH(dt.DataDoc) as Mese,
          cf.Cd_CF,
          cf.Descrizione as Cliente,
          ag.Descrizione as Agente,
          COUNT(DISTINCT dt.Id_DoTes) as NumeroFatture,
          SUM(tot.TotDocumentoE) as Fatturato,
          AVG(tot.TotDocumentoE) as FatturatoMedio,
          SUM(tot.TotImponibileE) as Imponibile,
          SUM(tot.TotImpostaE) as Imposta
        FROM DOTes dt
        JOIN DOTotali tot ON dt.Id_DoTes = tot.Id_DoTes
        JOIN CF cf ON dt.Cd_CF = cf.Cd_CF
        LEFT JOIN Agente ag ON dt.Cd_Agente_1 = ag.Cd_Agente
        WHERE dt.TipoDocumento = 'F'
        AND dt.DataDoc >= @data_da
        AND dt.DataDoc <= @data_a
        GROUP BY YEAR(dt.DataDoc), MONTH(dt.DataDoc), cf.Cd_CF, cf.Descrizione, ag.Descrizione
        ORDER BY Anno DESC, Mese DESC, Fatturato DESC
      `;

      const request = this.pool.request();
      request.input('data_da', filters.data_da || new Date(new Date().getFullYear(), 0, 1));
      request.input('data_a', filters.data_a || new Date());

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error fetching fatturato analytics:', error);
      throw error;
    }
  }

  // Dashboard KPI
  async getDashboardKPI() {
    try {
      if (!this.isConnected) await this.connect();

      const queries = {
        fatturato_oggi: `
          SELECT ISNULL(SUM(tot.TotDocumentoE), 0) as valore
          FROM DOTes dt
          JOIN DOTotali tot ON dt.Id_DoTes = tot.Id_DoTes
          WHERE dt.TipoDocumento = 'F' 
          AND CAST(dt.DataDoc AS DATE) = CAST(GETDATE() AS DATE)
        `,
        fatturato_mese: `
          SELECT ISNULL(SUM(tot.TotDocumentoE), 0) as valore
          FROM DOTes dt
          JOIN DOTotali tot ON dt.Id_DoTes = tot.Id_DoTes
          WHERE dt.TipoDocumento = 'F' 
          AND YEAR(dt.DataDoc) = YEAR(GETDATE())
          AND MONTH(dt.DataDoc) = MONTH(GETDATE())
        `,
        scaduto_totale: `
          SELECT ISNULL(SUM(sc.ImportoE), 0) as valore
          FROM SC sc
          WHERE sc.Pagata = 0 
          AND sc.DataScadenza < GETDATE()
        `,
        scadenze_7gg: `
          SELECT ISNULL(SUM(sc.ImportoE), 0) as valore
          FROM SC sc
          WHERE sc.Pagata = 0 
          AND sc.DataScadenza BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE())
        `,
        ordini_aperti: `
          SELECT COUNT(DISTINCT dt.Id_DoTes) as valore
          FROM DOTes dt
          JOIN DORig dr ON dt.Id_DoTes = dr.Id_DOTes
          WHERE dt.TipoDocumento = 'O' 
          AND dr.Evasa = 0
        `,
        clienti_attivi: `
          SELECT COUNT(DISTINCT cf.Cd_CF) as valore
          FROM CF cf
          JOIN DOTes dt ON cf.Cd_CF = dt.Cd_CF
          WHERE dt.TipoDocumento = 'F'
          AND dt.DataDoc >= DATEADD(day, -30, GETDATE())
        `
      };

      const kpi = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await this.pool.request().query(query);
        kpi[key] = result.recordset[0].valore || 0;
      }

      return kpi;
    } catch (error) {
      console.error('❌ Error fetching dashboard KPI:', error);
      throw error;
    }
  }

  // Ricerca fuzzy per matching
  async searchClientiByName(searchTerm, threshold = 0.6) {
    try {
      if (!this.isConnected) await this.connect();

      const query = `
        SELECT 
          cf.Cd_CF,
          cf.Descrizione,
          cf.PartitaIva,
          cf.CodiceFiscale,
          -- Calcolo similitudine (semplificato)
          CASE 
            WHEN cf.Descrizione LIKE @exact_match THEN 1.0
            WHEN cf.Descrizione LIKE @starts_with THEN 0.9
            WHEN cf.Descrizione LIKE @contains THEN 0.8
            WHEN cf.PartitaIva LIKE @search_term THEN 0.7
            ELSE 0.6
          END as SimilarityScore
        FROM CF cf
        WHERE cf.Cliente = 1
        AND cf.Obsoleto = 0
        AND (
          cf.Descrizione LIKE @contains
          OR cf.PartitaIva LIKE @search_term
          OR cf.CodiceFiscale LIKE @search_term
        )
        ORDER BY SimilarityScore DESC, cf.Descrizione
      `;

      const request = this.pool.request();
      request.input('exact_match', searchTerm);
      request.input('starts_with', `${searchTerm}%`);
      request.input('contains', `%${searchTerm}%`);
      request.input('search_term', `%${searchTerm}%`);

      const result = await request.query(query);
      return result.recordset.filter(row => row.SimilarityScore >= threshold);
    } catch (error) {
      console.error('❌ Error searching clienti:', error);
      throw error;
    }
  }

  // Aggiornamento stato scadenza (solo se necessario)
  async updateScadenzaStatus(scadenzaId, status, note = null) {
    try {
      if (!this.isConnected) await this.connect();

      // ATTENZIONE: Solo operazioni di lettura sono sicure
      // Questo metodo è solo per simulazione - non modificare database Arca
      console.warn('⚠️ Tentativo di modifica su database Arca (operazione bloccata)');
      return { success: false, message: 'Operazioni di scrittura non permesse su database Arca' };
    } catch (error) {
      console.error('❌ Error updating scadenza:', error);
      throw error;
    }
  }

  // Statistiche per report
  async getReconciliationStats(dateFrom, dateTo) {
    try {
      if (!this.isConnected) await this.connect();

      const query = `
        SELECT 
          COUNT(DISTINCT sc.Id_SC) as TotaleScadenze,
          SUM(sc.ImportoE) as ImportoTotale,
          COUNT(DISTINCT CASE WHEN sc.DataScadenza < GETDATE() THEN sc.Id_SC END) as ScadenzeScadute,
          SUM(CASE WHEN sc.DataScadenza < GETDATE() THEN sc.ImportoE ELSE 0 END) as ImportoScaduto,
          COUNT(DISTINCT cf.Cd_CF) as ClientiCoinvolti,
          AVG(sc.ImportoE) as ImportoMedio,
          MIN(sc.DataScadenza) as PrimaScadenza,
          MAX(sc.DataScadenza) as UltimaScadenza
        FROM SC sc
        JOIN CF cf ON sc.Cd_CF = cf.Cd_CF
        WHERE sc.Pagata = 0
        AND sc.DataScadenza BETWEEN @date_from AND @date_to
      `;

      const request = this.pool.request();
      request.input('date_from', dateFrom);
      request.input('date_to', dateTo);

      const result = await request.query(query);
      return result.recordset[0];
    } catch (error) {
      console.error('❌ Error fetching reconciliation stats:', error);
      throw error;
    }
  }

  // Fatture Passive - Documenti ricevuti dai fornitori
  async getPassiveInvoices(filters = {}) {
    try {
      if (!this.isConnected) await this.connect();

      let query = `
        SELECT 
          dt.Id_DoTes,
          dt.NumeroDoc,
          dt.DataDoc,
          dt.DataProt,
          cf.Cd_CF,
          cf.Descrizione as Fornitore,
          cf.PartitaIva,
          cf.CodiceFiscale,
          tot.TotDocumentoE as TotaleE,
          tot.TotImponibileE as ImponibileE,
          tot.TotImpostaE as ImpostaE,
          dt.Note,
          dt.Protocollo,
          dt.RifFornitore,
          -- Calcolo stato pagamento
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM SC sc 
              WHERE sc.Id_DoTes = dt.Id_DoTes 
              AND sc.Pagata = 1
            ) THEN 'Pagata'
            WHEN EXISTS (
              SELECT 1 FROM SC sc 
              WHERE sc.Id_DoTes = dt.Id_DoTes 
              AND sc.Pagata = 0 
              AND sc.DataScadenza < GETDATE()
            ) THEN 'Scaduta'
            ELSE 'Da pagare'
          END as Stato,
          -- Percorso file PDF (se disponibile)
          CASE 
            WHEN dt.FileAllegato IS NOT NULL THEN dt.FileAllegato
            ELSE CONCAT('C:\\Users\\Bottamedi\\Documents\\', YEAR(dt.DataDoc), '\\', 
                       FORMAT(dt.DataDoc, 'MM'), '\\', dt.NumeroDoc, '.pdf')
          END as FilePath
        FROM DOTes dt
        JOIN CF cf ON dt.Cd_CF = cf.Cd_CF
        JOIN DOTotali tot ON dt.Id_DoTes = tot.Id_DoTes
        WHERE dt.TipoDocumento = 'FA'  -- FA = Fattura Fornitore
        AND cf.Fornitore = 1
      `;

      const params = [];

      if (filters.date_from) {
        query += ' AND dt.DataDoc >= @date_from';
        params.push({ name: 'date_from', value: filters.date_from });
      }

      if (filters.date_to) {
        query += ' AND dt.DataDoc <= @date_to';
        params.push({ name: 'date_to', value: filters.date_to });
      }

      if (filters.supplier) {
        query += ' AND cf.Descrizione LIKE @supplier';
        params.push({ name: 'supplier', value: `%${filters.supplier}%` });
      }

      if (filters.status) {
        if (filters.status === 'Pagata') {
          query += ' AND EXISTS (SELECT 1 FROM SC sc WHERE sc.Id_DoTes = dt.Id_DoTes AND sc.Pagata = 1)';
        } else if (filters.status === 'Scaduta') {
          query += ' AND EXISTS (SELECT 1 FROM SC sc WHERE sc.Id_DoTes = dt.Id_DoTes AND sc.Pagata = 0 AND sc.DataScadenza < GETDATE())';
        } else if (filters.status === 'Da pagare') {
          query += ' AND NOT EXISTS (SELECT 1 FROM SC sc WHERE sc.Id_DoTes = dt.Id_DoTes AND sc.Pagata = 1)';
        }
      }

      query += ' ORDER BY dt.DataDoc DESC, dt.NumeroDoc DESC';

      if (filters.limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }

      const request = this.pool.request();
      params.forEach(param => {
        request.input(param.name, param.value);
      });

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error fetching passive invoices:', error);
      throw error;
    }
  }

  // Prodotti/Articoli
  async getProducts(filters = {}) {
    try {
      if (!this.isConnected) await this.connect();

      let query = `
        SELECT 
          art.Cd_AR,
          art.Descrizione,
          art.DescrizioneBreve,
          art.Cd_ARMisura,
          art.CostoStandard,
          art.ScortaMinima,
          art.ScortaMassima,
          art.Id_ARCategoria,
          cat.Descrizione as Categoria,
          art.Cd_ARMarca,
          marc.Descrizione as Marca,
          art.Note_AR,
          art.Obsoleto,
          art.WebB2CPubblica as InListino,
          -- Giacenza attuale
          ISNULL(giac.Giacenza, 0) as Giacenza,
          -- Statistiche vendite
          (SELECT COUNT(*) FROM DORig dr JOIN DOTes dt ON dr.Id_DoTes = dt.Id_DoTes 
           WHERE dr.Cd_AR = art.Cd_AR AND dt.TipoDocumento = 'F' 
           AND dt.DataDoc >= DATEADD(month, -12, GETDATE())) as VenditeUltimoAnno
        FROM AR art
        LEFT JOIN ARCategoria cat ON art.Id_ARCategoria = cat.Id_ARCategoria
        LEFT JOIN ARMarca marc ON art.Cd_ARMarca = marc.Cd_ARMarca
        LEFT JOIN (
          SELECT Cd_AR, SUM(Giacenza) as Giacenza
          FROM ARGiacenza
          GROUP BY Cd_AR
        ) giac ON art.Cd_AR = giac.Cd_AR
        WHERE 1=1
      `;

      const params = [];

      if (filters.search) {
        query += ' AND (art.Descrizione LIKE @search OR art.Cd_AR LIKE @search OR art.CodiceBarre LIKE @search)';
        params.push({ name: 'search', value: `%${filters.search}%` });
      }

      if (filters.category) {
        query += ' AND art.Id_ARCategoria = @category';
        params.push({ name: 'category', value: filters.category });
      }

      if (filters.active_only) {
        query += ' AND art.Obsoleto = 0 AND art.WebB2CPubblica = 1';
      }

      query += ' ORDER BY art.Descrizione';

      if (filters.limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }

      const request = this.pool.request();
      params.forEach(param => {
        request.input(param.name, param.value);
      });

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  }

  // Get active invoices (outgoing invoices to customers)
  async getActiveInvoices(filters = {}) {
    try {
      if (!this.isConnected) await this.connect();

      let query = `
        SELECT 
          dt.Id_DoTes,
          dt.NumeroDoc as numeroDocumento,
          dt.DataDoc as dataDocumento,
          dt.DataScadenza as scadenza,
          dt.TipoDocumento as tipoDocumento,
          dt.Cd_CF as codiceCliente,
          cf.Descrizione as customerName,
          dt.Note,
          dt.DataIns as dataInserimento,
          dt.DataUltMod as dataUltimaModifica,
          tot.TotDocumentoE as totaleDocumento,
          tot.TotImponibileE as imponibile,
          tot.TotImpostaE as importoIva,
          dt.ScontoPercentuale as scontoPercentuale,
          dt.ScontoValore as scontoValore,
          -- Stato documento basato su pagamenti
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM SC sc 
              WHERE sc.Id_DoTes = dt.Id_DoTes 
              AND sc.Pagata = 1
            ) THEN 'Pagata'
            WHEN EXISTS (
              SELECT 1 FROM SC sc 
              WHERE sc.Id_DoTes = dt.Id_DoTes 
              AND sc.Pagata = 0 
              AND sc.DataScadenza < GETDATE()
            ) THEN 'Scaduta'
            ELSE 'Da incassare'
          END as statoDocumento
        FROM DOTes dt
        JOIN CF cf ON dt.Cd_CF = cf.Cd_CF
        JOIN DOTotali tot ON dt.Id_DoTes = tot.Id_DoTes
        WHERE dt.TipoDocumento IN ('FAT', 'FTD', 'FTC')
          AND cf.Cliente = 1
      `;

      const request = this.pool.request();
      
      if (filters.customer) {
        query += ' AND (cf.Descrizione LIKE @customer OR dt.Cd_CF = @customer_code)';
        request.input('customer', `%${filters.customer}%`);
        request.input('customer_code', filters.customer);
      }
      
      if (filters.date_from) {
        query += ' AND dt.DataDoc >= @date_from';
        request.input('date_from', filters.date_from);
      }
      
      if (filters.date_to) {
        query += ' AND dt.DataDoc <= @date_to';
        request.input('date_to', filters.date_to);
      }
      
      if (filters.status) {
        // Add status filtering based on payment status
        switch (filters.status) {
          case 'paid':
            query += ' AND EXISTS (SELECT 1 FROM SC sc WHERE sc.Id_DoTes = dt.Id_DoTes AND sc.Pagata = 1)';
            break;
          case 'overdue':
            query += ' AND EXISTS (SELECT 1 FROM SC sc WHERE sc.Id_DoTes = dt.Id_DoTes AND sc.Pagata = 0 AND sc.DataScadenza < GETDATE())';
            break;
          case 'pending':
            query += ' AND EXISTS (SELECT 1 FROM SC sc WHERE sc.Id_DoTes = dt.Id_DoTes AND sc.Pagata = 0 AND sc.DataScadenza >= GETDATE())';
            break;
        }
      }

      query += ' ORDER BY dt.DataDoc DESC';
      
      if (filters.limit) {
        query += ` OFFSET 0 ROWS FETCH NEXT ${filters.limit} ROWS ONLY`;
      }

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('❌ Error fetching active invoices:', error);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.close();
      this.isConnected = false;
      console.log('✅ Arca Evolution database connection closed');
    }
  }
}

module.exports = new ArcaService();