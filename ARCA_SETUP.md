# 🗄️ Configurazione Arca Evolution

## ⚙️ Setup Connessione Database

### 📋 Configurazione per PCARCA-2023\Bottamedi

1. **Verifica il file `.env`** e assicurati che contenga:
```bash
# Database Arca Evolution
DB_ARCA_HOST=PCARCA-2023\\Bottamedi
DB_ARCA_PORT=1433
DB_ARCA_DATABASE=ADB_BOTTAMEDI
DB_ARCA_USER=
DB_ARCA_PASSWORD=
DB_ARCA_ENCRYPT=true
DB_ARCA_TRUST_SERVER_CERTIFICATE=true
```

### 🔧 Test Connessione

Esegui il test di connessione:
```bash
node scripts/test-arca-connection.js
```

### ✅ Output Atteso

Se la connessione funziona correttamente vedrai:
```
✅ Connection successful!
✅ Found X open scadenze
✅ Found X clients  
✅ Dashboard KPI retrieved
🎉 All tests passed! Arca Evolution integration is working correctly.
```

### 🛠️ Troubleshooting

#### Problema: Connection Timeout
- Verifica che SQL Server sia in esecuzione
- Controlla che il servizio "SQL Server (Bottamedi)" sia attivo
- Verifica firewall Windows per porta 1433

#### Problema: Authentication Failed
- Se usa autenticazione Windows: lascia user/password vuoti
- Se usa autenticazione SQL: inserisci credenziali corrette

#### Problema: Database Non Trovato
- Verifica che ADB_BOTTAMEDI esista
- Controlla permessi di lettura sul database

### 🔍 SQL Server Manager

Comandi utili da SQL Server Management Studio:

```sql
-- Verifica istanze attive
SELECT @@SERVERNAME, @@SERVICENAME

-- Lista database
SELECT name FROM sys.databases WHERE name LIKE '%BOTTAMEDI%'

-- Test query scadenzario
SELECT TOP 5 * FROM SC WHERE Pagata = 0

-- Test query clienti  
SELECT TOP 5 * FROM CF WHERE Cliente = 1
```

### 🚀 Avvio Sistema Completo

Una volta configurato Arca:

```bash
# Avvia sistema completo
npm run dev

# O separatamente
npm run server  # Backend
npm run client  # Frontend
```

### 📊 Funzionalità con Arca Attivo

Con Arca Evolution connesso avrai accesso a:

- ✅ KPI dashboard real-time da Arca
- ✅ Import automatico scadenzario  
- ✅ Anagrafica clienti aggiornata
- ✅ Dati fatturato per analytics
- ✅ Riconciliazione con scadenze reali

### 🔒 Sicurezza

- Connessione sempre READ-ONLY
- Nessuna modifica ai dati Arca
- Log completo di tutte le query
- Timeout automatico connessioni

### ⚡ Performance

Il sistema è ottimizzato per:
- Cache intelligente dei dati Arca
- Query parallele per dashboard
- Connection pooling automatico
- Fallback in caso di disconnessione

---

**📞 Supporto**: Se hai problemi contatta il team di sviluppo