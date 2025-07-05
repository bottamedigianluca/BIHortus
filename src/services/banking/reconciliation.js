const sqliteService = require('../database/sqlite');
const arcaService = require('../database/arca');
const { calculateStringDistance, fuzzyMatch } = require('../../utils/matching');
const { logger } = require('../../utils/logger');

class ReconciliationService {
  constructor() {
    this.matchingAlgorithms = {
      exact: this.exactMatch.bind(this),
      fuzzy: this.fuzzyMatch.bind(this),
      amount: this.amountMatch.bind(this),
      date: this.dateMatch.bind(this),
      combined: this.combinedMatch.bind(this)
    };
  }

  // Processo principale di riconciliazione
  async processReconciliation(bankMovements, options = {}) {
    try {
      logger.info('🔄 Inizio processo di riconciliazione', { 
        movements: bankMovements.length,
        options 
      });

      // 1. Carica scadenze aperte da Arca
      const scadenzeAperte = await arcaService.getScadenzeAperte({
        data_scadenza_da: options.dateFrom,
        data_scadenza_a: options.dateTo,
        importo_min: options.minAmount
      });

      logger.info('📋 Scadenze aperte caricate', { count: scadenzeAperte.length });

      // 2. Salva movimenti bancari
      await sqliteService.insertBankMovements(bankMovements);

      // 3. Esegui matching per ogni movimento
      const reconciliationResults = [];
      
      for (const movement of bankMovements) {
        const matches = await this.findMatches(movement, scadenzeAperte, options);
        
        if (matches.length > 0) {
          // Prendi il match con score più alto
          const bestMatch = matches[0];
          
          // Crea record di riconciliazione
          const reconciliationRecord = await this.createReconciliationRecord(
            movement, 
            bestMatch, 
            options.userId
          );
          
          reconciliationResults.push({
            movement,
            matches,
            bestMatch,
            reconciliationRecord,
            status: 'matched'
          });
        } else {
          reconciliationResults.push({
            movement,
            matches: [],
            bestMatch: null,
            reconciliationRecord: null,
            status: 'unmatched'
          });
        }
      }

      // 4. Statistiche risultati
      const stats = this.calculateReconciliationStats(reconciliationResults);
      
      logger.info('✅ Riconciliazione completata', stats);

      return {
        success: true,
        results: reconciliationResults,
        stats
      };

    } catch (error) {
      logger.error('❌ Errore nel processo di riconciliazione', error);
      throw error;
    }
  }

  // Trova matches per un movimento bancario
  async findMatches(movement, scadenzeAperte, options = {}) {
    const matches = [];
    const algorithms = options.algorithms || ['combined'];
    
    for (const scadenza of scadenzeAperte) {
      for (const algorithm of algorithms) {
        const score = await this.matchingAlgorithms[algorithm](movement, scadenza, options);
        
        if (score >= (options.minScore || 0.7)) {
          matches.push({
            scadenza,
            score,
            algorithm,
            reasons: this.getMatchReasons(movement, scadenza, score, algorithm)
          });
        }
      }
    }

    // Ordina per score decrescente e rimuovi duplicati
    return matches
      .sort((a, b) => b.score - a.score)
      .filter((match, index, array) => 
        index === array.findIndex(m => m.scadenza.Id_SC === match.scadenza.Id_SC)
      )
      .slice(0, options.maxMatches || 5);
  }

  // Algoritmi di matching
  async exactMatch(movement, scadenza, options = {}) {
    let score = 0;
    const factors = [];

    // Match esatto importo (peso: 40%)
    if (Math.abs(movement.amount - scadenza.ImportoE) < 0.01) {
      score += 0.4;
      factors.push('exact_amount');
    }

    // Match esatto descrizione cliente (peso: 30%)
    const movementDesc = this.normalizeString(movement.description);
    const clienteDesc = this.normalizeString(scadenza.Cliente);
    
    if (movementDesc.includes(clienteDesc) || clienteDesc.includes(movementDesc)) {
      score += 0.3;
      factors.push('exact_description');
    }

    // Match numero fattura (peso: 20%)
    if (movement.reference && scadenza.NumFattura) {
      const refNorm = this.normalizeString(movement.reference);
      const fatNorm = this.normalizeString(scadenza.NumFattura);
      
      if (refNorm.includes(fatNorm) || fatNorm.includes(refNorm)) {
        score += 0.2;
        factors.push('exact_reference');
      }
    }

    // Match data (peso: 10%)
    const daysDiff = Math.abs(
      (new Date(movement.date) - new Date(scadenza.DataScadenza)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff <= 5) {
      score += 0.1 * (1 - daysDiff / 5);
      factors.push('date_proximity');
    }

    return score;
  }

  async fuzzyMatch(movement, scadenza, options = {}) {
    let score = 0;
    const factors = [];

    // Fuzzy match importo (peso: 35%)
    const amountDiff = Math.abs(movement.amount - scadenza.ImportoE);
    const amountTolerance = Math.max(movement.amount, scadenza.ImportoE) * 0.02; // 2% tolerance
    
    if (amountDiff <= amountTolerance) {
      score += 0.35 * (1 - amountDiff / amountTolerance);
      factors.push('fuzzy_amount');
    }

    // Fuzzy match descrizione (peso: 40%)
    const descSimilarity = fuzzyMatch(
      this.normalizeString(movement.description),
      this.normalizeString(scadenza.Cliente)
    );
    
    if (descSimilarity >= 0.6) {
      score += 0.4 * descSimilarity;
      factors.push('fuzzy_description');
    }

    // Fuzzy match riferimento (peso: 15%)
    if (movement.reference && scadenza.NumFattura) {
      const refSimilarity = fuzzyMatch(
        this.normalizeString(movement.reference),
        this.normalizeString(scadenza.NumFattura)
      );
      
      if (refSimilarity >= 0.7) {
        score += 0.15 * refSimilarity;
        factors.push('fuzzy_reference');
      }
    }

    // Data proximity (peso: 10%)
    const daysDiff = Math.abs(
      (new Date(movement.date) - new Date(scadenza.DataScadenza)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff <= 15) {
      score += 0.1 * (1 - daysDiff / 15);
      factors.push('date_proximity');
    }

    return score;
  }

  async amountMatch(movement, scadenza, options = {}) {
    const amountDiff = Math.abs(movement.amount - scadenza.ImportoE);
    const tolerance = Math.max(movement.amount, scadenza.ImportoE) * 0.05; // 5% tolerance
    
    if (amountDiff <= tolerance) {
      return 1 - (amountDiff / tolerance);
    }
    
    return 0;
  }

  async dateMatch(movement, scadenza, options = {}) {
    const daysDiff = Math.abs(
      (new Date(movement.date) - new Date(scadenza.DataScadenza)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff <= 30) {
      return 1 - (daysDiff / 30);
    }
    
    return 0;
  }

  async combinedMatch(movement, scadenza, options = {}) {
    const exactScore = await this.exactMatch(movement, scadenza, options);
    const fuzzyScore = await this.fuzzyMatch(movement, scadenza, options);
    
    // Usa il punteggio più alto con bonus per exact match
    return Math.max(exactScore * 1.1, fuzzyScore);
  }

  // Crea record di riconciliazione
  async createReconciliationRecord(movement, match, userId) {
    const recordData = {
      bank_movement_id: movement.external_id,
      bank_date: movement.date,
      bank_amount: movement.amount,
      bank_description: movement.description,
      bank_reference: movement.reference,
      arca_scadenza_id: match.scadenza.Id_SC,
      arca_cliente_code: match.scadenza.Cd_CF,
      arca_fattura_numero: match.scadenza.NumFattura,
      arca_importo: match.scadenza.ImportoE,
      match_score: match.score,
      match_type: match.algorithm,
      status: match.score >= 0.95 ? 'matched' : 'pending',
      notes: `Auto-matched using ${match.algorithm} algorithm. Reasons: ${match.reasons.join(', ')}`,
      created_by: userId
    };

    return await sqliteService.createReconciliationRecord(recordData);
  }

  // Approva riconciliazione
  async approveReconciliation(reconciliationId, userId, notes = null) {
    try {
      const updateData = {
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        notes: notes || 'Approved by user'
      };

      await sqliteService.updateReconciliationRecord(reconciliationId, updateData);
      
      // Marca movimento bancario come riconciliato
      const reconciliation = await sqliteService.getReconciliationRecords({ 
        id: reconciliationId 
      });
      
      if (reconciliation.length > 0) {
        const record = reconciliation[0];
        await sqliteService.db.prepare(`
          UPDATE bank_movements 
          SET reconciled = TRUE, reconciliation_id = ? 
          WHERE external_id = ?
        `).run(reconciliationId, record.bank_movement_id);
      }

      logger.info('✅ Riconciliazione approvata', { reconciliationId, userId });
      
      return { success: true, message: 'Riconciliazione approvata con successo' };
    } catch (error) {
      logger.error('❌ Errore nell\'approvazione riconciliazione', error);
      throw error;
    }
  }

  // Rifiuta riconciliazione
  async rejectReconciliation(reconciliationId, userId, reason = null) {
    try {
      const updateData = {
        status: 'rejected',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        notes: reason || 'Rejected by user'
      };

      await sqliteService.updateReconciliationRecord(reconciliationId, updateData);
      
      logger.info('⚠️ Riconciliazione rifiutata', { reconciliationId, userId, reason });
      
      return { success: true, message: 'Riconciliazione rifiutata' };
    } catch (error) {
      logger.error('❌ Errore nel rifiuto riconciliazione', error);
      throw error;
    }
  }

  // Riconciliazione manuale
  async manualReconciliation(bankMovementId, scadenzaId, userId, notes = null) {
    try {
      // Carica movimento bancario
      const movements = await sqliteService.getBankMovements({ 
        external_id: bankMovementId 
      });
      
      if (movements.length === 0) {
        throw new Error('Movimento bancario non trovato');
      }

      const movement = movements[0];

      // Carica scadenza da Arca
      const scadenze = await arcaService.getScadenzeAperte({ 
        Id_SC: scadenzaId 
      });
      
      if (scadenze.length === 0) {
        throw new Error('Scadenza non trovata');
      }

      const scadenza = scadenze[0];

      // Crea record di riconciliazione manuale
      const recordData = {
        bank_movement_id: movement.external_id,
        bank_date: movement.date,
        bank_amount: movement.amount,
        bank_description: movement.description,
        bank_reference: movement.reference,
        arca_scadenza_id: scadenza.Id_SC,
        arca_cliente_code: scadenza.Cd_CF,
        arca_fattura_numero: scadenza.NumFattura,
        arca_importo: scadenza.ImportoE,
        match_score: 1.0,
        match_type: 'manual',
        status: 'approved',
        notes: notes || 'Riconciliazione manuale',
        created_by: userId,
        approved_by: userId,
        approved_at: new Date().toISOString()
      };

      const result = await sqliteService.createReconciliationRecord(recordData);
      
      // Marca movimento come riconciliato
      await sqliteService.db.prepare(`
        UPDATE bank_movements 
        SET reconciled = TRUE, reconciliation_id = ? 
        WHERE external_id = ?
      `).run(result.lastInsertRowid, movement.external_id);

      logger.info('✅ Riconciliazione manuale creata', { 
        bankMovementId, 
        scadenzaId, 
        userId 
      });
      
      return { 
        success: true, 
        message: 'Riconciliazione manuale completata',
        reconciliationId: result.lastInsertRowid
      };
    } catch (error) {
      logger.error('❌ Errore nella riconciliazione manuale', error);
      throw error;
    }
  }

  // Utility methods
  normalizeString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getMatchReasons(movement, scadenza, score, algorithm) {
    const reasons = [];
    
    if (Math.abs(movement.amount - scadenza.ImportoE) < 0.01) {
      reasons.push('exact_amount_match');
    }
    
    if (this.normalizeString(movement.description).includes(
        this.normalizeString(scadenza.Cliente)
      )) {
      reasons.push('client_name_match');
    }
    
    if (movement.reference && scadenza.NumFattura &&
        this.normalizeString(movement.reference).includes(
          this.normalizeString(scadenza.NumFattura)
        )) {
      reasons.push('invoice_reference_match');
    }
    
    const daysDiff = Math.abs(
      (new Date(movement.date) - new Date(scadenza.DataScadenza)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff <= 5) {
      reasons.push('date_proximity');
    }
    
    return reasons;
  }

  calculateReconciliationStats(results) {
    const total = results.length;
    const matched = results.filter(r => r.status === 'matched').length;
    const unmatched = total - matched;
    const autoApproved = results.filter(r => 
      r.reconciliationRecord && r.reconciliationRecord.status === 'approved'
    ).length;
    
    return {
      total,
      matched,
      unmatched,
      autoApproved,
      matchRate: total > 0 ? (matched / total * 100).toFixed(2) : 0,
      autoApprovalRate: matched > 0 ? (autoApproved / matched * 100).toFixed(2) : 0
    };
  }

  // Get reconciliation dashboard data
  async getReconciliationDashboard(filters = {}) {
    try {
      const [
        pendingReconciliations,
        recentReconciliations,
        stats
      ] = await Promise.all([
        sqliteService.getReconciliationRecords({ status: 'pending', limit: 10 }),
        sqliteService.getReconciliationRecords({ limit: 20 }),
        sqliteService.getStats()
      ]);

      const unreconciled = await sqliteService.getBankMovements({ 
        reconciled: false, 
        limit: 10 
      });

      return {
        pendingReconciliations,
        recentReconciliations,
        unreconciledMovements: unreconciled,
        stats
      };
    } catch (error) {
      logger.error('❌ Errore nel caricamento dashboard riconciliazione', error);
      throw error;
    }
  }
}

module.exports = new ReconciliationService();