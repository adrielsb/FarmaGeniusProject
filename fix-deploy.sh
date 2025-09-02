#!/bin/bash

# Script para corrigir problemas de deploy
echo "🔧 Corrigindo Deploy do FarmaGenius"
echo "================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado no diretório atual: $(pwd)"
    echo "🔍 Procurando arquivos do projeto..."
    
    # Procurar package.json
    PACKAGE_LOCATION=$(find /www /var/www /root -name "package.json" -path "*/FarmaGenius/*" -o -path "*/farmagenius*" 2>/dev/null | head -1)
    
    if [ -n "$PACKAGE_LOCATION" ]; then
        PROJECT_DIR=$(dirname "$PACKAGE_LOCATION")
        echo "✅ Projeto encontrado em: $PROJECT_DIR"
        echo "📂 Mudando para diretório correto..."
        cd "$PROJECT_DIR"
    else
        echo "❌ Projeto não encontrado. Certifique-se de ter transferido todos os arquivos."
        exit 1
    fi
fi

echo "📍 Diretório atual: $(pwd)"

# Verificar arquivos essenciais
echo ""
echo "🔍 Verificando arquivos essenciais..."

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 - AUSENTE"
        return 1
    fi
}

MISSING_FILES=0
check_file "package.json" || MISSING_FILES=1
check_file "package-lock.json" || MISSING_FILES=1
check_file "next.config.js" || MISSING_FILES=1
check_file "tsconfig.json" || MISSING_FILES=1

# Verificar diretórios
echo ""
echo "📁 Verificando diretórios..."
check_file "app" || MISSING_FILES=1
check_file "components" || MISSING_FILES=1  
check_file "lib" || MISSING_FILES=1

if [ $MISSING_FILES -eq 1 ]; then
    echo ""
    echo "❌ Arquivos ausentes detectados!"
    echo "💡 Soluções:"
    echo "1. Retransfira todos os arquivos do projeto"
    echo "2. Use: scp -r /caminho/completo/FarmaGenius/* usuario@servidor:$(pwd)/"
    echo "3. Ou use: scp -r /caminho/completo/FarmaGenius/. usuario@servidor:$(pwd)/"
    exit 1
fi

# Verificar package-lock.json
if [ ! -f "package-lock.json" ]; then
    echo ""
    echo "⚠️ package-lock.json ausente. Gerando..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ package-lock.json gerado com sucesso"
    else
        echo "❌ Erro ao gerar package-lock.json"
        exit 1
    fi
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️ Arquivo .env não encontrado!"
    echo "📝 Criando .env de exemplo..."
    cat > .env << 'EOF'
# Configure estas variáveis com seus valores reais
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
NEXTAUTH_URL=https://farmagenius.com.br
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF
    echo "⚠️ IMPORTANTE: Edite o arquivo .env com suas credenciais reais!"
    echo "   Execute: nano .env"
fi

# Instalar dependências
echo ""
echo "📦 Instalando dependências de produção..."
npm ci --omit=dev

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso"
else
    echo "❌ Erro na instalação. Tentando npm install..."
    npm install --omit=dev
    if [ $? -ne 0 ]; then
        echo "❌ Falha na instalação das dependências"
        exit 1
    fi
fi

# Build da aplicação
echo ""
echo "🔨 Fazendo build da aplicação..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
else
    echo "❌ Erro no build. Verificando logs..."
    echo ""
    echo "📋 Problemas possíveis:"
    echo "1. Variáveis de ambiente não configuradas"
    echo "2. Dependências ausentes"
    echo "3. Erros de TypeScript"
    echo ""
    echo "🔍 Execute para debug: npm run build"
    exit 1
fi

# Configurar PM2
echo ""
echo "🚀 Configurando PM2..."

# Parar aplicação existente
pm2 stop farmagenius 2>/dev/null || true
pm2 delete farmagenius 2>/dev/null || true

# Iniciar aplicação
pm2 start npm --name "farmagenius" -- start

if [ $? -eq 0 ]; then
    echo "✅ Aplicação iniciada com PM2"
    pm2 save
    pm2 startup | grep -v "sudo pm2 startup" | sudo bash 2>/dev/null || true
else
    echo "❌ Erro ao iniciar com PM2"
    exit 1
fi

# Verificar status
echo ""
echo "📊 Status da aplicação:"
pm2 show farmagenius

# Teste de conectividade
echo ""
echo "🔗 Testando conectividade..."
sleep 3

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Aplicação respondendo na porta 3000"
else
    echo "⚠️ Aplicação pode não estar respondendo"
    echo "📋 Verificar logs: pm2 logs farmagenius"
fi

echo ""
echo "🎉 Deploy corrigido com sucesso!"
echo "================================"
echo "📍 Diretório: $(pwd)"
echo "📊 Status: pm2 status"
echo "📋 Logs: pm2 logs farmagenius"
echo "🔄 Restart: pm2 restart farmagenius"
echo ""
echo "⚠️ LEMBRE-SE: Configure suas variáveis reais no arquivo .env"