#!/bin/bash

# ===============================================
# 🚀 Deploy FarmaGenius para VPS
# Servidor: 91.98.113.63:22
# ===============================================

set -e  # Parar script em caso de erro

# Configurações
VPS_IP="91.98.113.63"
VPS_PORT="22"
VPS_USER="root"  # Altere se necessário
APP_NAME="farmagenius"
APP_DIR="/var/www/$APP_NAME"
SERVICE_NAME="farmagenius"
DOMAIN="your-domain.com"  # Altere para seu domínio

echo "🚀 Iniciando deploy do FarmaGenius para VPS $VPS_IP"

# Função para executar comandos no VPS
run_remote() {
    ssh -p $VPS_PORT $VPS_USER@$VPS_IP "$1"
}

# Função para copiar arquivos
copy_files() {
    rsync -avz -e "ssh -p $VPS_PORT" --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.next' \
        --exclude 'out' \
        --exclude '.env' \
        ./ $VPS_USER@$VPS_IP:$APP_DIR/
}

echo "📦 Fase 1: Preparando servidor..."

# Instalar dependências do sistema
run_remote "
    apt update && apt upgrade -y
    apt install -y curl wget git nginx pm2 ufw
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs
    npm install -g pm2
    systemctl enable nginx
    systemctl start nginx
"

echo "📁 Fase 2: Criando estrutura de diretórios..."

run_remote "
    mkdir -p $APP_DIR
    mkdir -p /var/log/$APP_NAME
    chown -R $VPS_USER:$VPS_USER $APP_DIR
"

echo "📤 Fase 3: Enviando arquivos..."

copy_files

echo "🔧 Fase 4: Configurando aplicação..."

run_remote "
    cd $APP_DIR
    npm install --production
    npm run build
"

echo "⚙️ Fase 5: Configurando PM2..."

# Criar arquivo ecosystem para PM2
cat > /tmp/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/$APP_NAME/error.log',
    out_file: '/var/log/$APP_NAME/access.log',
    log_file: '/var/log/$APP_NAME/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
EOF

scp -P $VPS_PORT /tmp/ecosystem.config.js $VPS_USER@$VPS_IP:$APP_DIR/

run_remote "
    cd $APP_DIR
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
"

echo "🌐 Fase 6: Configurando Nginx..."

# Configuração do Nginx
cat > /tmp/farmagenius-nginx << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN $VPS_IP;

    # Logs
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Proxy to Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Favicon
    location /favicon.ico {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
EOF

scp -P $VPS_PORT /tmp/farmagenius-nginx $VPS_USER@$VPS_IP:/etc/nginx/sites-available/$APP_NAME

run_remote "
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx
"

echo "🔥 Fase 7: Configurando Firewall..."

run_remote "
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable
"

echo "🎯 Fase 8: Verificação final..."

run_remote "
    systemctl status nginx --no-pager
    pm2 status
    pm2 logs $SERVICE_NAME --lines 10 --nostream
"

echo "✅ Deploy concluído!"
echo ""
echo "🌐 Seu FarmaGenius está disponível em:"
echo "   http://$VPS_IP"
echo "   http://$DOMAIN (se configurado)"
echo ""
echo "🔧 Comandos úteis:"
echo "   ssh -p $VPS_PORT $VPS_USER@$VPS_IP"
echo "   pm2 status"
echo "   pm2 logs $SERVICE_NAME"
echo "   pm2 restart $SERVICE_NAME"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure seu domínio para apontar para $VPS_IP"
echo "   2. Configure SSL com Let's Encrypt:"
echo "      sudo apt install certbot python3-certbot-nginx"
echo "      sudo certbot --nginx -d $DOMAIN"
echo ""

# Cleanup
rm -f /tmp/ecosystem.config.js /tmp/farmagenius-nginx

echo "🚀 Deploy finalizado com sucesso!"