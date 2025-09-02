# 🚀 Deploy Manual para VPS 91.98.113.63

## 📋 Pré-requisitos

1. **Acesso SSH ao VPS:**
   ```bash
   ssh root@91.98.113.63 -p 22
   ```

2. **Chave SSH configurada (recomendado):**
   ```bash
   ssh-keygen -t rsa -b 4096
   ssh-copy-id root@91.98.113.63
   ```

## 🎯 Opção 1: Deploy Automático (Recomendado)

### Execute o script de deploy:

```bash
# No Windows (Git Bash/WSL)
chmod +x deploy-vps.sh
./deploy-vps.sh

# Ou execute diretamente via bash
bash deploy-vps.sh
```

## ⚙️ Opção 2: Deploy Manual Passo-a-Passo

### 1. Preparar o servidor

```bash
# Conectar ao VPS
ssh root@91.98.113.63 -p 22

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl wget git nginx ufw

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar PM2
npm install -g pm2

# Configurar nginx
systemctl enable nginx
systemctl start nginx
```

### 2. Enviar arquivos

```bash
# Do seu computador local
rsync -avz -e "ssh -p 22" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  ./ root@91.98.113.63:/var/www/farmagenius/
```

### 3. Configurar aplicação

```bash
# No VPS
cd /var/www/farmagenius

# Copiar variáveis de ambiente
cp .env.vps .env

# IMPORTANTE: Gerar novo NEXTAUTH_SECRET
openssl rand -base64 32

# Editar .env e adicionar o secret gerado
nano .env

# Instalar dependências e build
npm install --production
npm run build
```

### 4. Configurar PM2

```bash
# Criar ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'farmagenius',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/farmagenius',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/farmagenius/error.log',
    out_file: '/var/log/farmagenius/access.log',
    log_file: '/var/log/farmagenius/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
EOF

# Criar diretório de logs
mkdir -p /var/log/farmagenius

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configurar Nginx

```bash
# Criar configuração do site
cat > /etc/nginx/sites-available/farmagenius << 'EOF'
server {
    listen 80;
    server_name 91.98.113.63;

    # Logs
    access_log /var/log/nginx/farmagenius_access.log;
    error_log /var/log/nginx/farmagenius_error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/farmagenius /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar nginx
systemctl reload nginx
```

### 6. Configurar Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## ✅ Verificação

```bash
# Verificar status
systemctl status nginx
pm2 status
pm2 logs farmagenius

# Testar aplicação
curl http://91.98.113.63

# Verificar logs
tail -f /var/log/farmagenius/combined.log
```

## 🌐 Acesso

Após o deploy, acesse:
- **http://91.98.113.63**

## 🔧 Comandos Úteis

```bash
# Reiniciar aplicação
pm2 restart farmagenius

# Ver logs
pm2 logs farmagenius

# Atualizar aplicação
cd /var/www/farmagenius
git pull  # se usando git
npm run build
pm2 restart farmagenius

# Verificar uso de recursos
pm2 monit
```

## 🚨 Próximos Passos (Opcional)

### 1. Configurar domínio próprio

```bash
# Editar nginx config
nano /etc/nginx/sites-available/farmagenius
# Adicionar: server_name seudominio.com www.seudominio.com;

# Recarregar nginx
systemctl reload nginx
```

### 2. Configurar SSL (Let's Encrypt)

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d seudominio.com
```

### 3. Configurar backup automático

```bash
crontab -e
# Adicionar: 0 2 * * * /usr/bin/rsync -a /var/www/farmagenius/ /backup/farmagenius-$(date +\%Y\%m\%d)/
```

## 🐛 Solução de Problemas

1. **Aplicação não inicia:**
   ```bash
   pm2 logs farmagenius --lines 50
   ```

2. **Nginx erro 502:**
   ```bash
   systemctl status nginx
   pm2 status
   ```

3. **Porta 3000 ocupada:**
   ```bash
   lsof -i :3000
   pm2 delete all
   ```

4. **Erro de permissões:**
   ```bash
   chown -R root:root /var/www/farmagenius
   chmod -R 755 /var/www/farmagenius
   ```