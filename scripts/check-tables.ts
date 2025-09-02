#!/usr/bin/env npx tsx

/**
 * Script para verificar tabelas criadas no Supabase
 */

import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function main() {
  console.log('🔍 Verificando tabelas criadas no banco...\n')

  if (!supabaseAdmin) {
    console.error('❌ Service Role Key não configurada')
    process.exit(1)
  }

  try {
    // Listar todas as tabelas do schema público
    const { data: tables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      console.error('❌ Erro ao listar tabelas:', error.message)
      return
    }

    console.log('📋 Tabelas encontradas no banco:')
    console.log('=' .repeat(50))
    
    if (tables && tables.length > 0) {
      tables.forEach((table: any, index: number) => {
        const icon = table.table_type === 'BASE TABLE' ? '🗄️' : '📊'
        console.log(`${(index + 1).toString().padStart(2)}. ${icon} ${table.table_name}`)
      })
      
      console.log('=' .repeat(50))
      console.log(`✅ Total: ${tables.length} tabelas encontradas`)
    } else {
      console.log('⚠️  Nenhuma tabela encontrada')
      console.log('   Isso pode significar que a migração ainda não foi executada')
    }

    // Verificar tabelas específicas do FarmaGenius
    const expectedTables = [
      'users', 'accounts', 'sessions', 'reports', 'report_items',
      'mappings', 'daily_observations', 'production_metrics',
      'defaulters', 'audit_logs', 'inventory_items',
      'digital_prescriptions', 'system_config'
    ]

    console.log('\n🎯 Verificação de tabelas do FarmaGenius:')
    console.log('=' .repeat(50))

    const foundTableNames = tables?.map((t: any) => t.table_name) || []
    
    for (const tableName of expectedTables) {
      const found = foundTableNames.includes(tableName)
      const icon = found ? '✅' : '❌'
      console.log(`${icon} ${tableName}`)
    }

    const foundCount = expectedTables.filter(table => 
      foundTableNames.includes(table)
    ).length

    console.log('=' .repeat(50))
    console.log(`📊 Status: ${foundCount}/${expectedTables.length} tabelas do FarmaGenius criadas`)

    if (foundCount === expectedTables.length) {
      console.log('🎉 Migração completada com sucesso!')
    } else if (foundCount > 0) {
      console.log('⚠️  Migração parcial - algumas tabelas estão faltando')
    } else {
      console.log('❌ Migração não executada - execute o SQL no Dashboard')
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

// Executar o script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Verificação concluída!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erro durante a verificação:', error)
      process.exit(1)
    })
}