#!/bin/bash

# ===============================================
# 🔄 Script de Atualização - FarmaGenius VPS
# ===============================================

set -e

VPS_IP="91.98.113.63"
VPS_PORT="22"
VPS_USER="root"
APP_DIR="/var/www/farmagenius"
SERVICE_NAME="farmagenius"

echo "🔄 Atualizando FarmaGenius no VPS..."

# Função para executar comandos remotos
run_remote() {
    ssh -p $VPS_PORT $VPS_USER@$VPS_IP "$1"
}

# Backup antes da atualização
echo "📦 Criando backup..."
BACKUP_DIR="/backup/farmagenius-$(date +%Y%m%d-%H%M%S)"
run_remote "
    mkdir -p /backup
    cp -r $APP_DIR $BACKUP_DIR
    echo 'Backup criado em: $BACKUP_DIR'
"

# Enviar novos arquivos
echo "📤 Enviando arquivos atualizados..."
rsync -avz -e "ssh -p $VPS_PORT" --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'out' \
    --exclude '.env' \
    ./ $VPS_USER@$VPS_IP:$APP_DIR/

# Atualizar no servidor
echo "🔧 Atualizando aplicação..."
run_remote "
    cd $APP_DIR
    npm install --production
    npm run build
    pm2 restart $SERVICE_NAME
    pm2 save
"

echo "✅ Atualização concluída!"
echo "🌐 Verificar em: http://$VPS_IP"
echo "📋 Backup disponível em: $BACKUP_DIR"

# Verificar status
echo "📊 Status da aplicação:"
run_remote "pm2 status | grep $SERVICE_NAME"