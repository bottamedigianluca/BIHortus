#!/bin/bash

echo "🚀 BiHortus - Deploy to GitHub"
echo "=============================="
echo ""

# Verifica che il repository remoto non sia già configurato
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Repository remoto già configurato:"
    git remote get-url origin
    echo ""
    echo "🔄 Push dei cambiamenti..."
    git push
else
    echo "⚠️  Repository remoto non configurato."
    echo ""
    echo "📋 Passaggi da seguire:"
    echo ""
    echo "1. Vai su: https://github.com/bottamedigianluca"
    echo "2. Clicca 'New repository'"
    echo "3. Nome repository: bihortus"
    echo "4. Descrizione: BiHortus - Proprietary Banking Intelligence System for Bottamedi S.r.l."
    echo "5. ⚠️  IMPORTANTE: Seleziona 'Private' (repository proprietario)"
    echo "6. NON inizializzare con README"
    echo "7. Clicca 'Create repository'"
    echo ""
    echo "8. Poi esegui questi comandi:"
    echo ""
    echo "   git remote add origin https://github.com/bottamedigianluca/bihortus.git"
    echo "   git push -u origin main"
    echo ""
fi

echo "📊 Statistiche repository:"
echo "   Files: $(git ls-files | wc -l)"
echo "   Commits: $(git rev-list --count HEAD)"
echo "   Ultimo commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
echo ""

echo "🔒 RICORDA: Repository PRIVATO per software proprietario Bottamedi S.r.l."