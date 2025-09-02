#!/bin/bash

# FarmaGenius - Script de Deploy Automatizado
# Execute no seu servidor: bash deploy.sh

set -e  # Para execução caso haja erro

echo "🚀 FarmaGenius - Deploy Automatizado"
echo "==================================="

# Variáveis de configuração
APP_NAME="farma-genius"
APP_DIR="/var/www/FarmaGenius"
PORT="3000"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está executando como root/sudo
if [[ $EUID -eq 0 ]]; then
   log_error "Não execute este script como root. Use um usuário com sudo."
   exit 1
fi

# 1. Verificar dependências
log_info "Verificando dependências do sistema..."

if ! command -v node &> /dev/null; then
    log_warn "Node.js não encontrado. Instalando..."
    sudo apt update
    sudo apt install -y nodejs npm
fi

if ! command -v pm2 &> /dev/null; then
    log_warn "PM2 não encontrado. Instalando..."
    sudo npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
    log_warn "Nginx não encontrado. Instalando..."
    sudo apt install -y nginx
fi

# 2. Verificar versões
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js versão 18+ é necessária. Versão atual: $(node --version)"
    exit 1
fi

log_info "✅ Node.js $(node --version)"
log_info "✅ NPM $(npm --version)"

# 3. Parar aplicação existente (se houver)
log_info "Parando aplicação existente..."
pm2 stop $APP_NAME 2>/dev/null || log_warn "Aplicação não estava rodando"
pm2 delete $APP_NAME 2>/dev/null || true

# 4. Criar diretório da aplicação
log_info "Preparando diretório da aplicação..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 5. Verificar se .env existe
if [ ! -f "$APP_DIR/.env" ]; then
    log_error "Arquivo .env não encontrado em $APP_DIR"
    log_error "Crie o arquivo .env com as variáveis necessárias:"
    echo "
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=seu-secret-seguro
NODE_ENV=production
    "
    exit 1
fi

log_info "✅ Arquivo .env encontrado"

# 6. Instalar dependências
log_info "Instalando dependências..."
cd $APP_DIR
npm ci --omit=dev --silent

# 7. Build da aplicação
log_info "Fazendo build da aplicação..."
npm run build

# 8. Iniciar aplicação com PM2
log_info "Iniciando aplicação com PM2..."
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# 9. Configurar PM2 para iniciar automaticamente
log_info "Configurando inicialização automática..."
pm2 startup | sudo bash || true

# 10. Verificar se aplicação está rodando
sleep 3
if pm2 show $APP_NAME > /dev/null 2>&1; then
    log_info "✅ Aplicação iniciada com sucesso!"
    pm2 show $APP_NAME
else
    log_error "❌ Falha ao iniciar aplicação"
    pm2 logs $APP_NAME --lines 10
    exit 1
fi

# 11. Teste de conectividade
log_info "Testando conectividade..."
if curl -s http://localhost:$PORT > /dev/null; then
    log_info "✅ Aplicação respondendo na porta $PORT"
else
    log_warn "⚠️ Aplicação pode não estar respondendo na porta $PORT"
fi

# 12. Informações finais
echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "================================"
echo "📍 Diretório: $APP_DIR"
echo "🌐 URL Local: http://localhost:$PORT"
echo "📊 Status: pm2 status"
echo "📋 Logs: pm2 logs $APP_NAME"
echo "🔄 Restart: pm2 restart $APP_NAME"
echo "🛑 Stop: pm2 stop $APP_NAME"
echo ""
echo "💡 Para configurar Nginx como proxy reverso, use:"
echo "   sudo nano /etc/nginx/sites-available/$APP_NAME"
echo ""