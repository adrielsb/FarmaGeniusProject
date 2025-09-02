#!/bin/bash

# Script para restaurar backup do sistema de mapeamento interativo
# Uso: ./restore_backup.sh

BACKUP_DIR="/home/adrielsb/FarmaGenius/backups/20250829_195834"

echo "🔄 Restaurando arquivos do backup..."

# Restaurar arquivos
cp "$BACKUP_DIR/dashboard-content.tsx" "/home/adrielsb/FarmaGenius/components/dashboard/"
cp "$BACKUP_DIR/route.ts" "/home/adrielsb/FarmaGenius/app/api/process-report/"
cp "$BACKUP_DIR/route.ts" "/home/adrielsb/FarmaGenius/app/api/process-period/"

# Remover arquivo de diálogo se existir (foi criado nas melhorias)
rm -f "/home/adrielsb/FarmaGenius/components/unmapped-items-dialog.tsx"

echo "✅ Backup restaurado com sucesso!"
echo "🔄 Reinicie o servidor se necessário: npm run builder:dev"