#!/usr/bin/env npx tsx

/**
 * Script para executar migração do banco de dados para Supabase
 * 
 * Uso:
 * npm run migrate-supabase
 * ou  
 * npx tsx scripts/migrate-supabase.ts
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin, getConnectionInfo } from '../lib/supabase'

async function main() {
  console.log('🚀 Iniciando migração para Supabase...\n')

  // Verificar se temos o service role key
  if (!supabaseAdmin) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!')
    console.error('   Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY')
    console.error('   Você pode encontrar esta chave em: Settings > API > service_role')
    process.exit(1)
  }

  const connectionInfo = getConnectionInfo()
  console.log('📊 Informações de Conexão:')
  console.log(`   Project ID: ${connectionInfo.projectId}`)
  console.log(`   URL: ${connectionInfo.url}`)
  console.log('   Service Role: ✅ Disponível\n')

  // Ler o arquivo de migração
  let migrationSQL: string
  try {
    const migrationPath = join(process.cwd(), 'supabase-migration.sql')
    migrationSQL = readFileSync(migrationPath, 'utf-8')
    console.log('📄 Arquivo de migração carregado com sucesso')
    console.log(`   Tamanho: ${Math.round(migrationSQL.length / 1024)}KB`)
    console.log(`   Linhas: ${migrationSQL.split('\\n').length}`)
    console.log()
  } catch (error) {
    console.error('❌ Erro ao ler arquivo de migração:')
    console.error('   Arquivo: supabase-migration.sql')
    console.error(`   Erro: ${error}`)
    process.exit(1)
  }

  // Confirmar execução
  console.log('⚠️  ATENÇÃO: Esta operação irá:')
  console.log('   - Criar tabelas e estruturas no banco de dados')
  console.log('   - Configurar políticas RLS (Row Level Security)')
  console.log('   - Criar índices para performance')
  console.log('   - Inserir dados iniciais do sistema')
  console.log()

  // Em produção, você pode querer adicionar confirmação manual
  // const rl = require('readline').createInterface({
  //   input: process.stdin,
  //   output: process.stdout
  // })
  // 
  // const answer = await new Promise(resolve => {
  //   rl.question('Deseja continuar? (sim/não): ', resolve)
  // })
  // rl.close()
  // 
  // if (answer !== 'sim') {
  //   console.log('❌ Migração cancelada pelo usuário')
  //   process.exit(0)
  // }

  console.log('🔄 Executando migração...\n')

  try {
    // Dividir o SQL em statements individuais para melhor controle de erro
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`   Executando ${statements.length} statements...`)

    let executedCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Pular comentários e statements vazios
      if (statement.startsWith('--') || statement.length < 5) {
        continue
      }

      try {
        const { error } = await supabaseAdmin.rpc('exec', { 
          sql: statement + ';' 
        })

        if (error) {
          console.warn(`   ⚠️  Aviso no statement ${i + 1}: ${error.message}`)
          errorCount++
        } else {
          executedCount++
        }

        // Mostrar progresso a cada 10 statements
        if ((i + 1) % 10 === 0) {
          console.log(`   Progresso: ${i + 1}/${statements.length} statements`)
        }

      } catch (error) {
        console.error(`   ❌ Erro no statement ${i + 1}: ${error}`)
        errorCount++
      }
    }

    console.log()
    console.log('📊 Resultado da Migração:')
    console.log(`   ✅ Executados com sucesso: ${executedCount}`)
    console.log(`   ⚠️  Avisos/Erros: ${errorCount}`)

    if (errorCount === 0) {
      console.log('   🎉 Migração concluída com sucesso!')
    } else {
      console.log('   ⚠️  Migração concluída com avisos')
      console.log('   Verifique os logs acima para detalhes')
    }

  } catch (error) {
    console.error('❌ Erro crítico durante a migração:', error)
    process.exit(1)
  }

  console.log()
  console.log('🔍 Próximos passos:')
  console.log('   1. Execute: npm run test-connection')
  console.log('   2. Teste a aplicação: npm run dev')
  console.log('   3. Verifique as tabelas no Supabase Dashboard')
  console.log('   4. Configure as variáveis de ambiente se necessário')
}

// Executar o script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\\n✨ Script concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\\n💥 Erro durante a migração:', error)
      process.exit(1)
    })
}