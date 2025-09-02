#!/bin/bash

# Script para verificar variáveis de ambiente
echo "🔍 Verificando Configuração de Ambiente"
echo "======================================"

# Arquivo .env
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado"
    
    # Verificar permissões
    PERMS=$(stat -c "%a" .env)
    if [ "$PERMS" = "600" ]; then
        echo "✅ Permissões corretas (.env = 600)"
    else
        echo "⚠️ Permissões incorretas (.env = $PERMS, deveria ser 600)"
        echo "   Execute: chmod 600 .env"
    fi
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Verificar variáveis obrigatórias
echo ""
echo "📋 Verificando Variáveis:"

check_var() {
    local var_name=$1
    local var_value=$(grep "^$var_name=" .env 2>/dev/null | cut -d'=' -f2-)
    
    if [ -n "$var_value" ] && [ "$var_value" != "your-value-here" ] && [ "$var_value" != "sua-chave-aqui" ]; then
        echo "✅ $var_name: Configurada"
    else
        echo "❌ $var_name: Não configurada ou usando valor padrão"
        return 1
    fi
}

MISSING=0

check_var "NEXT_PUBLIC_SUPABASE_URL" || MISSING=1
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" || MISSING=1  
check_var "SUPABASE_SERVICE_ROLE_KEY" || MISSING=1
check_var "NEXTAUTH_URL" || MISSING=1
check_var "NEXTAUTH_SECRET" || MISSING=1
check_var "NODE_ENV" || MISSING=1

echo ""
if [ $MISSING -eq 0 ]; then
    echo "🎉 Todas as variáveis estão configuradas!"
    
    # Teste de conectividade (se Node.js estiver disponível)
    if command -v node &> /dev/null; then
        echo ""
        echo "🔗 Testando conectividade..."
        node -e "
        require('dotenv').config();
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (url && url.includes('supabase.co')) {
            console.log('✅ URL do Supabase parece válida');
        } else {
            console.log('❌ URL do Supabase inválida');
        }
        
        const secret = process.env.NEXTAUTH_SECRET;
        if (secret && secret.length >= 32) {
            console.log('✅ NEXTAUTH_SECRET tem comprimento adequado');
        } else {
            console.log('❌ NEXTAUTH_SECRET muito curta (mínimo 32 caracteres)');
        }
        "
    fi
else
    echo "❌ Algumas variáveis precisam ser configuradas"
    echo ""
    echo "📝 Exemplo de .env:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui"
    echo "SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui"
    echo "NEXTAUTH_URL=https://seu-dominio.com"
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'gere-um-secret-de-32-chars')"
    echo "NODE_ENV=production"
fi