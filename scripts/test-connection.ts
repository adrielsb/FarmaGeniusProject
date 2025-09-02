#!/usr/bin/env npx tsx

/**
 * Script para testar conectividade com Supabase
 * 
 * Uso:
 * npm run test-connection
 * ou
 * npx tsx scripts/test-connection.ts
 */

import 'dotenv/config'
import { testSupabaseConnection, getConnectionInfo, supabase, supabaseAdmin } from '../lib/supabase'
import { checkDatabaseHealth, usersService } from '../lib/database'

async function main() {
  console.log('🔍 Testando conexão com Supabase...\n')

  // Informações de conexão
  const connectionInfo = getConnectionInfo()
  console.log('📊 Informações de Conexão:')
  console.log(`   URL: ${connectionInfo.url}`)
  console.log(`   Project ID: ${connectionInfo.projectId}`)
  console.log(`   Service Role disponível: ${connectionInfo.hasServiceRole ? '✅' : '❌'}`)
  console.log()

  // Teste de conectividade básica
  console.log('🔧 Teste de Conectividade:')
  const isConnected = await testSupabaseConnection()
  console.log(`   Status: ${isConnected ? '✅ Conectado' : '❌ Falha na conexão'}`)

  // Health check detalhado
  const healthCheck = await checkDatabaseHealth()
  console.log(`   Latência: ${healthCheck.latency || 'N/A'}ms`)
  if (healthCheck.error) {
    console.log(`   Erro: ${healthCheck.error}`)
  }
  console.log()

  // Teste de operações básicas
  console.log('🗄️  Teste de Operações:')
  
  try {
    // Testar contagem de usuários
    const userCount = await usersService.count()
    console.log(`   Usuários cadastrados: ${userCount}`)

    // Testar listagem de usuários (limitado)
    const users = await usersService.findMany({}, { limit: 5, select: 'id, email, created_at' })
    console.log(`   Últimos usuários encontrados: ${users.length}`)
    
    if (users.length > 0) {
      users.forEach((user: any, index: number) => {
        console.log(`     ${index + 1}. ${user.email} (${user.created_at})`)
      })
    }

    console.log('   Status: ✅ Operações funcionando')
  } catch (error) {
    console.log('   Status: ❌ Erro nas operações')
    console.log(`   Erro: ${error}`)
  }
  console.log()

  // Teste de autorização RLS
  console.log('🔐 Teste de Segurança (RLS):')
  try {
    // Tentar acessar dados sem autenticação (deve falhar se RLS estiver ativo)
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) {
      console.log('   RLS Status: ✅ Ativo (acesso negado sem autenticação)')
      console.log(`   Erro esperado: ${error.message}`)
    } else {
      console.log('   RLS Status: ⚠️  Possível problema de segurança')
      console.log('   Dados acessíveis sem autenticação')
    }
  } catch (error) {
    console.log('   RLS Status: ❌ Erro inesperado')
    console.log(`   Erro: ${error}`)
  }
  console.log()

  // Teste com Service Role (se disponível)
  if (supabaseAdmin) {
    console.log('👑 Teste com Service Role:')
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        console.log('   Status: ❌ Erro com Service Role')
        console.log(`   Erro: ${error.message}`)
      } else {
        console.log('   Status: ✅ Service Role funcionando')
      }
    } catch (error) {
      console.log('   Status: ❌ Erro inesperado')
      console.log(`   Erro: ${error}`)
    }
    console.log()
  }

  // Verificar tabelas existentes
  console.log('📋 Verificação de Schema:')
  try {
    const { data, error } = await supabase
      .rpc('get_table_names')
      .limit(10)

    if (data && data.length > 0) {
      console.log('   Tabelas encontradas:')
      data.forEach((table: any) => {
        console.log(`     - ${table.table_name}`)
      })
    } else {
      console.log('   ⚠️  Não foi possível listar tabelas')
      if (error) {
        console.log(`   Erro: ${error.message}`)
      }
    }
  } catch (error) {
    console.log('   ⚠️  Função get_table_names não disponível')
    console.log('   (Isso é normal se a função não foi criada)')
  }
  console.log()

  // Resultado final
  console.log('🎯 Resultado Final:')
  if (isConnected && healthCheck.connected) {
    console.log('   ✅ Supabase está configurado e funcionando')
    console.log('   ✅ Pronto para uso em produção')
  } else {
    console.log('   ❌ Problemas de configuração detectados')
    console.log('   📖 Consulte o SUPABASE_MIGRATION_GUIDE.md para soluções')
  }
}

// Executar o script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Teste concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erro durante o teste:', error)
      process.exit(1)
    })
}