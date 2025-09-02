#!/bin/bash

# Script de Deploy para Modo de Desenvolvimento
echo "🚧 FarmaGenius - Deploy em Modo DESENVOLVIMENTO"
echo "=============================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado!"
    echo "🔍 Certifique-se de estar no diretório correto do projeto"
    exit 1
fi

echo "📍 Diretório: $(pwd)"

# Criar .env de desenvolvimento se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando .env para desenvolvimento..."
    cat > .env << 'EOF'
# Configuração para DESENVOLVIMENTO
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
NEXTAUTH_URL=http://farmagenius.com.br
NEXTAUTH_SECRET=dev-secret-key-para-testes-123456789
NODE_ENV=development
EOF
    echo "⚠️ IMPORTANTE: Configure suas credenciais reais no arquivo .env"
    echo "   Execute: nano .env"
else
    echo "✅ Arquivo .env encontrado"
fi

# Verificar NODE_ENV
if grep -q "NODE_ENV=production" .env; then
    echo "⚠️ NODE_ENV está como 'production'. Alterando para development..."
    sed -i 's/NODE_ENV=production/NODE_ENV=development/g' .env
fi

# Instalar dependências (incluindo dev)
echo ""
echo "📦 Instalando todas as dependências..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Erro na instalação das dependências"
    exit 1
fi

echo "✅ Dependências instaladas"

# Parar aplicação anterior
echo ""
echo "🛑 Parando aplicação anterior..."
pm2 stop farmagenius-dev 2>/dev/null || true
pm2 delete farmagenius-dev 2>/dev/null || true

# Iniciar em modo desenvolvimento
echo ""
echo "🚀 Iniciando aplicação em modo DESENVOLVIMENTO..."
pm2 start npm --name "farmagenius-dev" -- run dev

if [ $? -eq 0 ]; then
    echo "✅ Aplicação iniciada em modo desenvolvimento"
    pm2 save
    
    # Aguardar um pouco e testar
    echo ""
    echo "🔗 Testando conectividade..."
    sleep 5
    
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Aplicação respondendo na porta 3000"
    else
        echo "⚠️ Aplicação pode estar iniciando ainda..."
        echo "   Aguarde alguns segundos e teste: curl http://localhost:3000"
    fi
    
    # Status
    echo ""
    echo "📊 Status da aplicação:"
    pm2 show farmagenius-dev
    
else
    echo "❌ Erro ao iniciar aplicação"
    echo ""
    echo "🔍 Verificar possíveis problemas:"
    echo "1. Porta 3000 já em uso: lsof -i :3000"
    echo "2. Configurações do .env incorretas"
    echo "3. Dependências ausentes"
    exit 1
fi

echo ""
echo "🎉 Deploy em DESENVOLVIMENTO concluído!"
echo "====================================="
echo "🌐 URL: http://localhost:3000"
echo "🌐 URL Externa: http://farmagenius.com.br:3000 (se porta aberta)"
echo "📊 Status: pm2 status"
echo "📋 Logs: pm2 logs farmagenius-dev"
echo "🔄 Restart: pm2 restart farmagenius-dev"
echo "🛑 Stop: pm2 stop farmagenius-dev"
echo ""
echo "💡 VANTAGENS do modo desenvolvimento:"
echo "   ✅ Hot reload (recarrega automaticamente quando você alterar código)"
echo "   ✅ Mensagens de erro detalhadas"
echo "   ✅ Debugging mais fácil"
echo ""
echo "⚠️ LEMBRE-SE: Configure suas credenciais reais no .env"