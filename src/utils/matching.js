// Utility functions for string matching and similarity calculation

/**
 * Calcola la distanza di Levenshtein tra due stringhe
 * @param {string} str1 - Prima stringa
 * @param {string} str2 - Seconda stringa
 * @returns {number} Distanza di Levenshtein
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Inizializza la matrice
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Riempie la matrice
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sostituzione
          matrix[i][j - 1] + 1,     // inserimento
          matrix[i - 1][j] + 1      // eliminazione
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcola la similarità tra due stringhe usando Levenshtein
 * @param {string} str1 - Prima stringa
 * @param {string} str2 - Seconda stringa
 * @returns {number} Similarità (0-1)
 */
function calculateStringDistance(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const normalizedStr1 = normalizeString(str1);
  const normalizedStr2 = normalizeString(str2);
  
  if (normalizedStr1 === normalizedStr2) return 1;
  
  const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(normalizedStr1, normalizedStr2);
  return (maxLength - distance) / maxLength;
}

/**
 * Fuzzy matching avanzato con multiple strategie
 * @param {string} str1 - Prima stringa
 * @param {string} str2 - Seconda stringa
 * @param {Object} options - Opzioni di matching
 * @returns {number} Score di matching (0-1)
 */
function fuzzyMatch(str1, str2, options = {}) {
  const {
    caseSensitive = false,
    ignoreSpaces = true,
    ignoreSpecialChars = true,
    tokenize = true,
    threshold = 0.8
  } = options;

  if (!str1 || !str2) return 0;

  let processedStr1 = str1;
  let processedStr2 = str2;

  // Normalizzazione
  if (!caseSensitive) {
    processedStr1 = processedStr1.toLowerCase();
    processedStr2 = processedStr2.toLowerCase();
  }

  if (ignoreSpaces) {
    processedStr1 = processedStr1.replace(/\s+/g, '');
    processedStr2 = processedStr2.replace(/\s+/g, '');
  }

  if (ignoreSpecialChars) {
    processedStr1 = processedStr1.replace(/[^a-z0-9\s]/gi, '');
    processedStr2 = processedStr2.replace(/[^a-z0-9\s]/gi, '');
  }

  // Match esatto
  if (processedStr1 === processedStr2) return 1;

  // Substring match
  if (processedStr1.includes(processedStr2) || processedStr2.includes(processedStr1)) {
    const longer = Math.max(processedStr1.length, processedStr2.length);
    const shorter = Math.min(processedStr1.length, processedStr2.length);
    return shorter / longer;
  }

  // Token-based matching
  if (tokenize) {
    const tokens1 = processedStr1.split(/\s+/).filter(t => t.length > 0);
    const tokens2 = processedStr2.split(/\s+/).filter(t => t.length > 0);
    
    if (tokens1.length > 0 && tokens2.length > 0) {
      const tokenScore = calculateTokenSimilarity(tokens1, tokens2);
      if (tokenScore >= threshold) {
        return tokenScore;
      }
    }
  }

  // Levenshtein distance
  return calculateStringDistance(processedStr1, processedStr2);
}

/**
 * Calcola la similarità tra due array di token
 * @param {string[]} tokens1 - Primi token
 * @param {string[]} tokens2 - Secondi token
 * @returns {number} Similarità (0-1)
 */
function calculateTokenSimilarity(tokens1, tokens2) {
  let matchedTokens = 0;
  const maxTokens = Math.max(tokens1.length, tokens2.length);

  for (const token1 of tokens1) {
    for (const token2 of tokens2) {
      if (calculateStringDistance(token1, token2) >= 0.8) {
        matchedTokens++;
        break;
      }
    }
  }

  return matchedTokens / maxTokens;
}

/**
 * Normalizza una stringa per il matching
 * @param {string} str - Stringa da normalizzare
 * @returns {string} Stringa normalizzata
 */
function normalizeString(str) {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z0-9\s]/g, ' ')    // Sostituisce caratteri speciali con spazi
    .replace(/\s+/g, ' ')            // Normalizza spazi multipli
    .trim();
}

/**
 * Estrae numeri da una stringa
 * @param {string} str - Stringa da cui estrarre numeri
 * @returns {number[]} Array di numeri trovati
 */
function extractNumbers(str) {
  if (!str) return [];
  
  const matches = str.match(/\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Estrae potenziali riferimenti (codici fattura, ordine, etc.)
 * @param {string} str - Stringa da cui estrarre riferimenti
 * @returns {string[]} Array di riferimenti trovati
 */
function extractReferences(str) {
  if (!str) return [];
  
  const patterns = [
    /\b[A-Z]{2,}\d{3,}\b/g,    // Codici tipo ABC123
    /\b\d{4,}\b/g,              // Numeri lunghi
    /\b[A-Z]\d{2,}\b/g,         // Codici tipo A123
    /\b\d{2,}[A-Z]{2,}\b/g      // Codici tipo 123ABC
  ];
  
  const references = [];
  for (const pattern of patterns) {
    const matches = str.match(pattern);
    if (matches) {
      references.push(...matches);
    }
  }
  
  return [...new Set(references)]; // Rimuove duplicati
}

/**
 * Calcola la similarità tra due importi considerando una tolleranza
 * @param {number} amount1 - Primo importo
 * @param {number} amount2 - Secondo importo
 * @param {number} tolerance - Tolleranza percentuale (default: 0.02 = 2%)
 * @returns {number} Score di similarità (0-1)
 */
function calculateAmountSimilarity(amount1, amount2, tolerance = 0.02) {
  if (amount1 === amount2) return 1;
  
  const maxAmount = Math.max(Math.abs(amount1), Math.abs(amount2));
  if (maxAmount === 0) return 1;
  
  const difference = Math.abs(amount1 - amount2);
  const allowedDifference = maxAmount * tolerance;
  
  if (difference <= allowedDifference) {
    return 1 - (difference / allowedDifference);
  }
  
  return 0;
}

/**
 * Calcola la similarità tra due date
 * @param {Date|string} date1 - Prima data
 * @param {Date|string} date2 - Seconda data
 * @param {number} maxDays - Massimo numero di giorni di differenza (default: 30)
 * @returns {number} Score di similarità (0-1)
 */
function calculateDateSimilarity(date1, date2, maxDays = 30) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= maxDays) {
    return 1 - (diffDays / maxDays);
  }
  
  return 0;
}

/**
 * Matching avanzato per descrizioni bancarie
 * @param {string} bankDescription - Descrizione movimento bancario
 * @param {string} clientName - Nome cliente
 * @param {string} invoiceNumber - Numero fattura
 * @returns {Object} Risultato del matching con score e dettagli
 */
function advancedDescriptionMatch(bankDescription, clientName, invoiceNumber) {
  const result = {
    score: 0,
    matches: [],
    details: {}
  };

  if (!bankDescription) return result;

  const normalizedDesc = normalizeString(bankDescription);
  const normalizedClient = normalizeString(clientName);
  const normalizedInvoice = normalizeString(invoiceNumber);

  // Match nome cliente
  if (normalizedClient) {
    const clientTokens = normalizedClient.split(' ').filter(t => t.length > 2);
    let clientMatches = 0;
    
    for (const token of clientTokens) {
      if (normalizedDesc.includes(token)) {
        clientMatches++;
      }
    }
    
    if (clientTokens.length > 0) {
      const clientScore = clientMatches / clientTokens.length;
      result.score += clientScore * 0.6; // Peso 60%
      result.details.clientScore = clientScore;
      
      if (clientScore > 0.5) {
        result.matches.push(`client_name_match (${Math.round(clientScore * 100)}%)`);
      }
    }
  }

  // Match numero fattura
  if (normalizedInvoice) {
    const invoiceRefs = extractReferences(normalizedDesc);
    const invoiceInDesc = invoiceRefs.some(ref => 
      normalizedInvoice.includes(ref) || ref.includes(normalizedInvoice)
    );
    
    if (invoiceInDesc || normalizedDesc.includes(normalizedInvoice)) {
      result.score += 0.3; // Peso 30%
      result.details.invoiceMatch = true;
      result.matches.push('invoice_reference_match');
    }
  }

  // Match numeri/importi
  const descNumbers = extractNumbers(bankDescription);
  if (descNumbers.length > 0) {
    result.score += 0.1; // Peso 10%
    result.details.numbersFound = descNumbers;
    result.matches.push('numeric_references_found');
  }

  return result;
}

module.exports = {
  calculateStringDistance,
  fuzzyMatch,
  normalizeString,
  extractNumbers,
  extractReferences,
  calculateAmountSimilarity,
  calculateDateSimilarity,
  advancedDescriptionMatch,
  levenshteinDistance,
  calculateTokenSimilarity
};