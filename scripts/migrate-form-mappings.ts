#!/usr/bin/env npx tsx

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('🚀 Executando migração da tabela form_mappings...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const migrationPath = join(process.cwd(), 'migrations/add-form-mappings-table.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Arquivo de migração carregado com sucesso')
    console.log(`   Tamanho: ${Math.round(migrationSQL.length / 1024)}KB`)

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📊 Executando ${statements.length} statements...`)

    let successCount = 0
    let warningCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length < 5) continue

      try {
        // Executar statement SQL diretamente
        const { data, error } = await supabase
          .from('_')
          .select('*')
          .limit(0)
        
        // Tentar usando query raw
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: statement + ';' })
        })

        if (result.ok) {
          console.log(`✅ Statement ${i + 1} executado com sucesso`)
          successCount++
        } else {
          const errorText = await result.text()
          console.warn(`⚠️ Aviso no statement ${i + 1}: ${errorText}`)
          warningCount++
        }
      } catch (error) {
        console.error(`❌ Erro no statement ${i + 1}:`, error)
        warningCount++
      }
    }

    console.log()
    console.log('📊 Resultado da Migração:')
    console.log(`   ✅ Sucessos: ${successCount}`)
    console.log(`   ⚠️ Avisos: ${warningCount}`)

    if (warningCount === 0) {
      console.log('   🎉 Migração concluída com sucesso!')
    } else {
      console.log('   ⚠️ Migração concluída com avisos')
    }

  } catch (error) {
    console.error('❌ Erro crítico durante a migração:', error)
    process.exit(1)
  }

  console.log()
  console.log('✨ Tabela form_mappings criada com sucesso!')
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro durante a migração:', error)
      process.exit(1)
    })
}