# BiHortus - Sistema Intelligente di Riconciliazione Bancaria

## ⚠️ PROPRIETARY SOFTWARE - BOTTAMEDI S.R.L. EXCLUSIVE USE

**🔒 CONFIDENTIAL - For authorized Bottamedi personnel only**

## 🌟 Panoramica

BiHortus è un sistema proprietario avanzato di riconciliazione bancaria e analytics progettato esclusivamente per Bottamedi S.r.l. e la perfetta integrazione con Arca Evolution. Utilizza AI/ML per automatizzare la riconciliazione pagamenti e fornire insights avanzati sui flussi finanziari.

## 🚀 Caratteristiche Principali

### 🔄 Riconciliazione Intelligente
- **Matching Automatico**: Algoritmi ML per associare movimenti bancari a scadenze
- **Fuzzy Matching**: Riconoscimento tollerante di nomi e importi
- **Apprendimento Continuo**: Migliora l'accuratezza nel tempo
- **Gestione Eccezioni**: Workflow per gestire casi complessi

### 📊 Analytics Avanzate
- **Dashboard Real-time**: KPI finanziari in tempo reale
- **Analisi Predittive**: Previsioni cash flow e DSO
- **Reporting Automatico**: Report personalizzabili e schedulati
- **Alerting Intelligente**: Notifiche proattive per anomalie

### 🌐 Sincronizzazione Cloud
- **Multi-PC Sync**: Sincronizzazione automatica tra installazioni
- **Backup Automatico**: Backup continuo su cloud
- **Modalità Offline**: Funzionamento anche senza connessione
- **Conflict Resolution**: Gestione automatica conflitti dati

### 🔒 Sicurezza Enterprise
- **Encryption**: Crittografia end-to-end dei dati
- **Access Control**: Controllo accessi granulare
- **Audit Trail**: Log completo di tutte le operazioni
- **Compliance**: Conformità normative bancarie

## 📋 Requisiti Sistema

### Minimi
- Node.js 18+
- RAM: 4GB
- Spazio: 2GB
- OS: Windows 10+, Linux, macOS

### Consigliati
- Node.js 20+
- RAM: 8GB
- Spazio: 10GB
- SSD per database

## 🛠️ Installazione

### Setup Rapido
\`\`\`bash
# Clone repository
git clone https://github.com/bottamedi/bihortus.git
cd bihortus

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env

# Initialize database
npm run setup

# Start development
npm run dev
\`\`\`

### Configurazione Arca Evolution
1. Crea utente readonly per BiHortus
2. Configura connection string in .env
3. Testa connessione con `npm run test:arca`

### Setup Cloud Sync
1. Configura provider cloud (Supabase/Firebase)
2. Imposta credenziali in .env
3. Inizializza sync con `npm run sync:init`

## 📁 Architettura

\`\`\`
BiHortus/
├── src/
│   ├── components/      # Componenti React
│   ├── pages/          # Pagine principali
│   ├── services/       # Servizi backend
│   ├── utils/          # Utilities
│   ├── hooks/          # React hooks
│   ├── store/          # State management
│   ├── types/          # TypeScript types
│   ├── api/            # API routes
│   └── sync/           # Cloud sync logic
├── database/           # Database files
├── config/             # Configurazioni
├── scripts/            # Automation scripts
└── docs/              # Documentazione
\`\`\`

## 🔧 Configurazione

### Database
\`\`\`javascript
// config/database.js
{
  sqlite: {
    path: './database/sqlite/bihortus.db',
    backup: true,
    encryption: true
  },
  arca: {
    host: 'localhost',
    database: 'ADB_BOTTAMEDI',
    readonly: true,
    timeout: 30000
  }
}
\`\`\`

### Cloud Sync
\`\`\`javascript
// config/sync.js
{
  provider: 'supabase',
  interval: 300000, // 5 minuti
  tables: ['reconciliation', 'analytics', 'settings'],
  encryption: true,
  compression: true
}
\`\`\`

## 🎯 Utilizzo

### Riconciliazione Bancaria
1. **Import Estratti**: Carica file bancari (CSV, Excel, MT940)
2. **Auto-Match**: Sistema automatico di associazione
3. **Review**: Verifica e correzione manuale
4. **Approve**: Approvazione e contabilizzazione

### Analytics
- **Dashboard**: Visualizzazione KPI principali
- **Reports**: Generazione report personalizzati
- **Alerts**: Configurazione soglie e notifiche
- **Export**: Esportazione dati in vari formati

### Sync Multi-PC
- **Master**: PC principale con Arca Evolution
- **Slave**: PC secondari sincronizzati
- **Conflict**: Risoluzione automatica conflitti
- **Backup**: Backup automatico su cloud

## 📊 API Reference

### Riconciliazione
\`\`\`
GET    /api/reconciliation/matches
POST   /api/reconciliation/import
PUT    /api/reconciliation/approve/:id
DELETE /api/reconciliation/reject/:id
\`\`\`

### Analytics
\`\`\`
GET    /api/analytics/dashboard
GET    /api/analytics/reports
POST   /api/analytics/export
GET    /api/analytics/predictions
\`\`\`

### Sync
\`\`\`
GET    /api/sync/status
POST   /api/sync/trigger
PUT    /api/sync/resolve-conflict
GET    /api/sync/history
\`\`\`

## 🔄 Deployment

### Produzione
\`\`\`bash
# Build
npm run build

# Start production server
npm run start

# Setup PM2 (consigliato)
npm install -g pm2
pm2 start ecosystem.config.js
\`\`\`

### Docker
\`\`\`bash
# Build image
docker build -t bihortus .

# Run container
docker run -p 3000:3000 -p 5000:5000 bihortus
\`\`\`

## 📈 Monitoraggio

### Health Check
\`\`\`bash
# System health
curl http://localhost:5000/api/health

# Database status
curl http://localhost:5000/api/health/database

# Sync status
curl http://localhost:5000/api/health/sync
\`\`\`

### Logging
- **Application**: `logs/app.log`
- **Error**: `logs/error.log`
- **Sync**: `logs/sync.log`
- **Database**: `logs/database.log`

## 🤝 Contribuire

1. Fork il repository
2. Crea feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT License - vedere LICENSE file per dettagli.

## 🆘 Supporto

- **Email**: support@bottamedi.com
- **Docs**: https://docs.bihortus.com
- **Issues**: https://github.com/bottamedi/bihortus/issues

---

*Powered by BiHortus Team - Innovazione per il Finance*