# BiHortus - Specifiche Tecniche Complete

## 🏗️ Architettura Sistema

### Stack Tecnologico

**Frontend:**
- React 18 + TypeScript
- Chakra UI per interfaccia
- React Query per state management 
- React Router per routing
- Recharts per grafici
- Socket.IO client per real-time

**Backend:**
- Node.js + Express
- SQLite (database principale)
- SQL Server (Arca Evolution - READ ONLY)
- Socket.IO per WebSocket
- Winston per logging
- Better-SQLite3 per performance

**Cloud Sync:**
- Supabase/Firebase per sincronizzazione
- Encryption AES-256 per sicurezza
- Conflict resolution automatica
- Backup automatico

## 📊 Schema Database

### SQLite (Locale)

```sql
-- Utenti sistema
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Record riconciliazione
CREATE TABLE reconciliation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_movement_id TEXT NOT NULL,
  bank_date DATE NOT NULL,
  bank_amount DECIMAL(15,2) NOT NULL,
  bank_description TEXT NOT NULL,
  bank_reference TEXT,
  arca_scadenza_id INTEGER,
  arca_cliente_code TEXT,
  arca_fattura_numero TEXT,
  arca_importo DECIMAL(15,2),
  match_score DECIMAL(5,2),
  match_type TEXT, -- 'auto', 'manual', 'fuzzy'
  status TEXT DEFAULT 'pending', -- 'pending', 'matched', 'approved', 'rejected'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  approved_by INTEGER,
  approved_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (approved_by) REFERENCES users (id)
);

-- Movimenti bancari
CREATE TABLE bank_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE NOT NULL,
  account_number TEXT NOT NULL,
  date DATE NOT NULL,
  value_date DATE,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  transaction_type TEXT,
  counterpart TEXT,
  reconciled BOOLEAN DEFAULT FALSE,
  reconciliation_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reconciliation_id) REFERENCES reconciliation_records (id)
);

-- Cache analytics
CREATE TABLE analytics_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  data TEXT NOT NULL, -- JSON data
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stato sincronizzazione
CREATE TABLE sync_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  last_sync DATETIME,
  sync_hash TEXT,
  records_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurazioni
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Log audit
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Arca Evolution (Read-Only)

Utilizza le tabelle esistenti:
- `SC` - Scadenzario
- `CF` - Clienti/Fornitori
- `DOTes/DORig` - Documenti
- `MGMov` - Movimenti magazzino
- Altri secondo necessità

## 🔄 Algoritmi di Riconciliazione

### 1. Exact Match
```javascript
// Match esatto: importo + descrizione + riferimento
score = 0;
if (Math.abs(bankAmount - arcaAmount) < 0.01) score += 0.4;
if (bankDesc.includes(clientName)) score += 0.3;
if (bankRef.includes(invoiceNum)) score += 0.2;
if (dateDiff <= 5) score += 0.1;
```

### 2. Fuzzy Match
```javascript
// Match tollerante con Levenshtein distance
amountSimilarity = 1 - (amountDiff / maxAmount);
descSimilarity = fuzzyStringMatch(bankDesc, clientName);
score = (amountSimilarity * 0.35) + (descSimilarity * 0.4) + ...;
```

### 3. ML Enhanced (Future)
- Learning da approvazioni manuali
- Pattern recognition su descrizioni
- Clustering di movimenti simili

## 🌐 Sincronizzazione Cloud

### Flusso di Sync

1. **Detect Changes**: Monitora modifiche locali tramite timestamp
2. **Fetch Remote**: Scarica modifiche dal cloud
3. **Conflict Detection**: Identifica conflitti basandosi su hash
4. **Resolution**: Applica strategia di risoluzione (server_wins/client_wins/merge)
5. **Apply Changes**: Sincronizza bidirezionalmente
6. **Update Status**: Aggiorna metadata di sync

### Strategie Conflict Resolution

```javascript
// Server Wins: priorità al cloud
resolution = conflict.remote;

// Client Wins: priorità al locale  
resolution = conflict.local;

// Merge: unisce i campi più recenti
resolution = mergeRecords(conflict.local, conflict.remote);
```

### Encryption

```javascript
// AES-256-GCM per dati sensibili
const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'hex');
```

## 📡 API Endpoints

### Dashboard
```
GET    /api/dashboard/kpi              # KPI principali
GET    /api/dashboard/summary          # Riassunto stato
GET    /api/dashboard/activities       # Attività recenti
GET    /api/dashboard/charts/cash-flow # Dati cash flow
```

### Riconciliazione
```
GET    /api/reconciliation/records     # Lista record
GET    /api/reconciliation/status      # Stato generale
POST   /api/reconciliation/import-bank-movements  # Import file
POST   /api/reconciliation/approve/:id # Approva
POST   /api/reconciliation/reject/:id  # Rifiuta
POST   /api/reconciliation/manual      # Riconciliazione manuale
GET    /api/reconciliation/suggestions/:id  # Suggerimenti match
```

### Sync
```
GET    /api/sync/status                # Stato sync
POST   /api/sync/trigger               # Avvia sync manuale
```

### Analytics  
```
GET    /api/analytics/cash-flow        # Analisi flussi
GET    /api/analytics/clients-distribution  # Distribuzione clienti
```

## 🔒 Sicurezza

### Autenticazione
- JWT tokens per API
- Session-based per frontend
- Role-based access control

### Autorizzazione
```javascript
// Middleware per controllo ruoli
const authorize = (roles) => (req, res, next) => {
  if (roles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};
```

### Data Protection
- Encryption at rest per dati sensibili
- TLS 1.3 per comunicazioni
- Input validation con Joi
- SQL injection prevention
- XSS protection

## ⚡ Performance

### Database Optimization
```sql
-- Indici strategici
CREATE INDEX idx_reconciliation_status ON reconciliation_records(status);
CREATE INDEX idx_bank_movements_date ON bank_movements(date);
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
```

### Caching Strategy
- In-memory cache per query frequenti
- TTL configurabile per tipo dato
- Cache invalidation su modifiche

### Query Optimization
- Prepared statements per SQLite
- Connection pooling per SQL Server
- Lazy loading per large datasets
- Pagination per liste

## 📊 Monitoring & Logging

### Structured Logging
```javascript
// Component-specific loggers
syncLogger.info('Sync completed', { 
  tables: ['reconciliation'], 
  duration: 1250,
  records: 45 
});

reconciliationLogger.info('Match found', {
  bankMovementId: 'MOV123',
  scadenzaId: 456,
  score: 0.95,
  algorithm: 'fuzzy'
});
```

### Health Checks
```javascript
// Sistema health check
GET /api/health
{
  "status": "healthy",
  "services": {
    "sqlite": true,
    "arca": true,
    "cloudSync": false
  },
  "uptime": 3600,
  "memory": {...}
}
```

### Metrics Collection
- Response times per endpoint
- Database query performance
- Sync success rates
- Error rates e patterns

## 🚀 Deployment

### Development
```bash
npm run dev          # Frontend + Backend
npm run client       # Solo frontend  
npm run server       # Solo backend
```

### Production
```bash
npm run build        # Build ottimizzato
npm start           # Produzione
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000 5000
CMD ["npm", "start"]
```

### Environment Variables
```bash
# Database
DB_ARCA_HOST=localhost
DB_ARCA_DATABASE=ADB_BOTTAMEDI
DB_ARCA_USER=automation_user

# Cloud Sync  
CLOUD_SYNC_ENABLED=true
CLOUD_SYNC_PROVIDER=supabase
CLOUD_SYNC_URL=https://xxx.supabase.co

# Security
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx

# Performance
CACHE_ENABLED=true
QUERY_TIMEOUT=30000
```

## 🔧 Maintenance

### Backup Strategy
- SQLite backup giornaliero
- Cloud sync come backup secondario
- Retention policy configurabile
- Backup verification

### Updates
- Zero-downtime deployment
- Database migrations
- Backward compatibility
- Rollback procedures

### Troubleshooting
- Centralized error tracking
- Debug mode per development
- Log aggregation
- Performance profiling

## 📈 Scalability

### Horizontal Scaling
- Stateless backend design
- Load balancer ready
- Session storage esternalizzabile
- Database connection pooling

### Vertical Scaling
- Memory optimization
- CPU-intensive task queuing
- Database indexing strategy
- Caching layers

### Future Enhancements
- Machine Learning per matching
- Real-time dashboard updates
- Mobile app companion
- API rate limiting
- Multi-tenant support

---

*Documento tecnico v1.0 - BiHortus Banking Intelligence*