# 🚀 Guia Completo de Deploy - FarmaGenius

## 📋 Pré-requisitos

### No Servidor
- Ubuntu 18.04+ / Debian 10+ / CentOS 7+
- Node.js 18+ 
- Acesso SSH
- Domínio configurado (opcional)

### Variáveis de Ambiente Necessárias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## 🚀 Método 1: Deploy Automatizado (Recomendado)

### 1. Transferir Arquivos
```bash
# Opção A: Via SCP
scp -r /caminho/para/FarmaGenius usuario@servidor:/var/www/

# Opção B: Via Git (se o projeto estiver no GitHub)
ssh usuario@servidor
cd /var/www
git clone https://github.com/seu-usuario/FarmaGenius.git
```

### 2. Configurar Ambiente
```bash
# No servidor
cd /var/www/FarmaGenius
nano .env
```

Cole as configurações de produção:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=uma-string-aleatoria-muito-segura-com-32-chars
NODE_ENV=production
```

### 3. Executar Deploy
```bash
# No servidor
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Método 2: Deploy Manual

### 1. Instalar Dependências do Sistema
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm nginx -y

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### 2. Preparar Aplicação
```bash
cd /var/www/FarmaGenius

# Instalar dependências
npm ci --omit=dev

# Build de produção
npm run build
```

### 3. Iniciar com PM2
```bash
# Iniciar aplicação
pm2 start npm --name "farma-genius" -- start

# Salvar configuração
pm2 save

# Configurar inicialização automática
pm2 startup
```

## 🌐 Configuração do Nginx

### 1. Criar Configuração
```bash
sudo cp nginx.conf /etc/nginx/sites-available/farma-genius
sudo ln -s /etc/nginx/sites-available/farma-genius /etc/nginx/sites-enabled/
```

### 2. Editar Domínio
```bash
sudo nano /etc/nginx/sites-available/farma-genius
# Alterar "seu-dominio.com" para seu domínio real
```

### 3. Testar e Reiniciar
```bash
# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 SSL/HTTPS (Let's Encrypt)

### Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obter Certificado
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 📊 Monitoramento e Manutenção

### Comandos PM2 Úteis
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs farma-genius

# Reiniciar
pm2 restart farma-genius

# Parar
pm2 stop farma-genius

# Monitoramento em tempo real
pm2 monit
```

### Logs do Nginx
```bash
# Logs de acesso
sudo tail -f /var/log/nginx/farma-genius.access.log

# Logs de erro
sudo tail -f /var/log/nginx/farma-genius.error.log
```

## 🔄 Updates e Deploy Contínuo

### Script de Update
```bash
#!/bin/bash
cd /var/www/FarmaGenius
git pull origin main
npm ci --omit=dev
npm run build
pm2 restart farma-genius
```

## ⚡ Otimizações de Performance

### 1. Configurar Swap (se necessário)
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Configurar Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. Configurar Rate Limiting no Nginx
```bash
# Adicionar ao bloco http em /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

## 🐛 Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs farma-genius

# Verificar variáveis de ambiente
pm2 show farma-genius

# Verificar porta
netstat -tulnp | grep :3000
```

### Nginx não funciona
```bash
# Testar configuração
sudo nginx -t

# Verificar status
sudo systemctl status nginx

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

### Problemas de permissão
```bash
# Corrigir proprietário
sudo chown -R $USER:$USER /var/www/FarmaGenius

# Corrigir permissões
sudo chmod -R 755 /var/www/FarmaGenius
```

## 📝 Checklist de Deploy

- [ ] Servidor preparado com Node.js 18+
- [ ] Arquivos transferidos para /var/www/FarmaGenius
- [ ] Arquivo .env criado com variáveis corretas
- [ ] Dependências instaladas (npm ci --omit=dev)
- [ ] Build realizado (npm run build)
- [ ] PM2 configurado e aplicação iniciada
- [ ] Nginx configurado e testado
- [ ] SSL configurado (se aplicável)
- [ ] Firewall configurado
- [ ] Testes de conectividade realizados

## 🎯 URLs Importantes

- **Aplicação**: http://seu-dominio.com
- **Health Check**: http://seu-dominio.com/health
- **API**: http://seu-dominio.com/api/*

## 📞 Suporte

Para problemas específicos, verifique:
1. Logs do PM2: `pm2 logs farma-genius`
2. Logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Status dos serviços: `sudo systemctl status nginx pm2`