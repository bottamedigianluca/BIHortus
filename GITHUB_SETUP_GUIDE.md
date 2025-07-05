# 📚 Guida Creazione Repository GitHub

## 🌐 **Passaggio 1: Crea Repository su GitHub**

1. **Vai su**: https://github.com/bottamedigianluca
2. **Clicca**: "New repository" (pulsante verde)
3. **Compila**:
   - Repository name: `bihortus`
   - Description: `BiHortus - Proprietary Banking Intelligence System for Bottamedi S.r.l.`
   - **IMPORTANTE**: Seleziona "Private" ⚠️
   - **NON** spuntare "Add a README file"
   - **NON** aggiungere .gitignore
   - **NON** scegliere licenza
4. **Clicca**: "Create repository"

## 🔗 **Passaggio 2: Collega Repository Locale**

Dopo aver creato il repository, GitHub ti mostrerà delle istruzioni. Usa queste:

```bash
# Naviga nella cartella del progetto
cd /home/bottamedi/BiHortus

# Collega al repository remoto
git remote add origin https://github.com/bottamedigianluca/bihortus.git

# Publica il codice
git push -u origin main
```

## ✅ **Verifica Successo**

Dopo il push, dovresti vedere su GitHub:
- 47 file pubblicati
- 3 commit
- Repository privato con badge "Private"
- README.md che mostra il sistema BiHortus

## 🖥️ **Dal Tuo PC Windows/Locale**

### Opzione 1: Clone da GitHub
```bash
git clone https://github.com/bottamedigianluca/bihortus.git
cd bihortus
npm install
```

### Opzione 2: Copia Diretta
Il codice è già nella cartella:
```
/home/bottamedi/BiHortus
```

Puoi copiare questa cartella dove vuoi sul tuo sistema.

## 🚀 **Avvio Sistema**

Una volta che hai il codice:

1. **Installa dipendenze** (se necessario):
   ```bash
   npm install
   ```

2. **Configura Arca** (vedi ARCA_SETUP.md)

3. **Avvia sistema**:
   ```bash
   npm run dev
   ```

4. **Apri browser**: http://localhost:3000

## 🔧 **Troubleshooting**

### Se git push fallisce:
```bash
# Verifica remote
git remote -v

# Se non configurato:
git remote add origin https://github.com/bottamedigianluca/bihortus.git

# Riprova push
git push -u origin main
```

### Se hai problemi di autenticazione GitHub:
- Usa GitHub Desktop per Windows
- O configura Personal Access Token
- O usa SSH keys

## 📱 **GitHub Desktop (Consigliato per Windows)**

1. Scarica GitHub Desktop
2. Fai login con il tuo account
3. "Clone repository from the Internet"
4. Seleziona `bottamedigianluca/bihortus`
5. Scegli dove salvarlo sul PC

---

**🎯 Risultato Finale**: Repository privato su GitHub con sistema BiHortus completo!