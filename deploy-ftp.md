# Deploy FTP Manual - FarmaGenius

## 🚨 ATENÇÃO: Limitações Críticas

Seu projeto atual **NÃO FUNCIONA** com FTP tradicional (hosting estático) porque usa:

- ✗ APIs server-side (`/api/*`)
- ✗ NextAuth (autenticação)
- ✗ Middleware 
- ✗ Conexões com banco de dados
- ✗ Server-side rendering

## 📋 Opções para FTP

### Opção 1: Hosting com Node.js Support
**Provedores que suportam Node.js via FTP:**
- Hostinger (Node.js hosting)
- GoDaddy (VPS)
- DigitalOcean (Droplets)
- Vultr

**Passos:**
1. Build do projeto: `npm run build`
2. Upload da pasta completa via FTP
3. Instalar dependências no servidor: `npm install --production`
4. Iniciar: `npm start`

### Opção 2: Conversão para SPA (Funcionalidade Limitada)
**⚠️ Você perderia:**
- Autenticação
- APIs
- Processamento de relatórios
- Conexão com banco

**Passos:**
1. `npm run build` (gera pasta `out/`)
2. Upload da pasta `out/` via FTP
3. Configurar `.htaccess` para SPA

### Opção 3: Hosting Gratuito com Node.js
**Recomendado:**
- **Railway**: Gratuito, suporte completo
- **Render**: Gratuito, fácil deploy
- **Vercel**: Gratuito, otimizado para Next.js

## 🎯 Recomendação

**NÃO use FTP tradicional** para este projeto. 

Use Railway (gratuito) ou similar que suporte Node.js completo.

### Deploy Railway (5 minutos):
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

## 📁 Se insistir em FTP estático

Para hosting apenas HTML/CSS/JS (SEM funcionalidades server):

```bash
# 1. Configurar para static
npm run build

# 2. Upload da pasta 'out/' via FTP
# 3. Apontar domínio para pasta 'out/'
```

**Resultado:** Site "morto" - apenas interface, sem funcionalidades.