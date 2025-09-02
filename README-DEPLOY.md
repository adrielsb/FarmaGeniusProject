# 🚀 Deploy FarmaGenius para VPS 91.98.113.63

## ✅ Status: Pronto para Deploy

Seu VPS está **online** e **acessível**! 

## 🎯 Deploy em 3 Passos Simples

### 1️⃣ **Deploy Automático (Recomendado)**

```bash
# Execute este comando no seu computador:
bash deploy-vps.sh
```

**O script vai fazer tudo automaticamente:**
- ✅ Configurar servidor (Node.js, Nginx, PM2)
- ✅ Enviar arquivos
- ✅ Instalar dependências
- ✅ Fazer build de produção
- ✅ Configurar proxy reverso
- ✅ Iniciar aplicação

### 2️⃣ **Configurar Variáveis Importantes**

**⚠️ ANTES do deploy, edite o arquivo `deploy-vps.sh`:**

```bash
# Linha 12-15: Configurações básicas
VPS_USER="root"        # Seu usuário SSH
DOMAIN="91.98.113.63"  # Ou seu domínio personalizado
```

### 3️⃣ **Gerar Chave de Segurança**

```bash
# Gere uma chave segura:
openssl rand -base64 32

# Copie o resultado e cole no arquivo .env.vps na linha:
NEXTAUTH_SECRET="cole-aqui-a-chave-gerada"
```

## 🌐 **Após o Deploy**

Sua aplicação estará disponível em:
- **http://91.98.113.63**

## 🔧 **Comandos Úteis**

```bash
# Conectar ao VPS
ssh root@91.98.113.63 -p 22

# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs farmagenius

# Reiniciar aplicação
pm2 restart farmagenius

# Atualizar aplicação (futuras atualizações)
bash update-vps.sh
```

## 📋 **Checklist de Deploy**

- [ ] **1. Testar conectividade VPS** ✅ (91.98.113.63 está online)
- [ ] **2. Configurar chave SSH** (recomendado)
- [ ] **3. Editar configurações no script**
- [ ] **4. Gerar NEXTAUTH_SECRET**
- [ ] **5. Executar deploy automático**
- [ ] **6. Verificar aplicação funcionando**
- [ ] **7. (Opcional) Configurar domínio próprio**
- [ ] **8. (Opcional) Configurar SSL**

## 🚨 **Problemas Comuns e Soluções**

### **Erro: "Permission denied (publickey)"**
```bash
# Solução: Configurar chave SSH
ssh-keygen -t rsa -b 4096
ssh-copy-id root@91.98.113.63
```

### **Erro: "Port 3000 already in use"**
```bash
# No VPS, mate processos na porta 3000:
ssh root@91.98.113.63 "lsof -ti:3000 | xargs kill -9"
```

### **Aplicação não carrega**
```bash
# Verificar logs:
ssh root@91.98.113.63 "pm2 logs farmagenius"
```

## ⚡ **Performance Esperada**

- **Build time:** ~20-30 segundos
- **Deploy total:** ~3-5 minutos
- **Restart time:** ~2 segundos
- **Memory usage:** ~150-300MB

## 🎊 **Próximos Passos (Opcional)**

### **1. Domínio Personalizado**
- Aponte seu domínio para `91.98.113.63`
- Edite o nginx config para incluir seu domínio

### **2. SSL Certificate**
```bash
# No VPS:
apt install certbot python3-certbot-nginx
certbot --nginx -d seudominio.com
```

### **3. Monitoramento**
- Configure alerts de uptime
- Monitore uso de recursos

## 🆘 **Suporte**

Se encontrar problemas:
1. Verifique logs: `pm2 logs farmagenius`
2. Teste conectividade: `curl http://91.98.113.63`
3. Reinicie serviços: `pm2 restart farmagenius`

---

**🚀 Pronto para fazer deploy? Execute:**
```bash
bash deploy-vps.sh
```