import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function verifySupabaseStructure() {
  console.log('🔍 Verificando estrutura completa do Supabase...\n')

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin não configurado')
    return
  }

  // Lista de tabelas que o projeto espera ter
  const expectedTables = [
    'users',
    'reports', 
    'report_items',
    'audit_logs',
    'daily_observations',
    'mappings',
    'last_processing',
    'user_settings',
    'processing_history'
  ]

  console.log('📋 VERIFICANDO TABELAS EXISTENTES:')
  
  const tableStatus: Record<string, any> = {}

  for (const tableName of expectedTables) {
    try {
      // Tentar fazer uma query básica para verificar se a tabela existe
      const { data, error, count } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(1)

      if (error) {
        tableStatus[tableName] = { 
          exists: false, 
          error: error.message,
          count: 0 
        }
        console.log(`   ❌ ${tableName}: NÃO EXISTE - ${error.message}`)
      } else {
        tableStatus[tableName] = { 
          exists: true, 
          count: count || 0 
        }
        console.log(`   ✅ ${tableName}: EXISTE (${count || 0} registros)`)
      }
    } catch (catchError) {
      tableStatus[tableName] = { 
        exists: false, 
        error: String(catchError), 
        count: 0 
      }
      console.log(`   ❌ ${tableName}: ERRO - ${catchError}`)
    }
  }

  console.log('\n📊 VERIFICANDO ESTRUTURA DAS TABELAS EXISTENTES:')

  // Verificar estrutura da tabela users
  if (tableStatus.users?.exists) {
    console.log('\n👤 Tabela USERS:')
    try {
      const { data: userSample } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1)
        .single()

      if (userSample) {
        console.log('   Colunas encontradas:', Object.keys(userSample))
        console.log('   Campos esperados: id, name, email, password, created_at, updated_at')
      }
    } catch (error) {
      console.log('   ⚠️ Não foi possível obter amostra dos dados')
    }
  }

  // Verificar estrutura da tabela reports
  if (tableStatus.reports?.exists) {
    console.log('\n📊 Tabela REPORTS:')
    try {
      const { data: reportSample } = await supabaseAdmin
        .from('reports')
        .select('*')
        .limit(1)
        .single()

      if (reportSample) {
        console.log('   Colunas encontradas:', Object.keys(reportSample))
        console.log('   Campos esperados: id, title, date, status, user_id, total_quantity,')
        console.log('                     total_value, solid_count, top_seller, processed_data,')
        console.log('                     kanban_data, sellers_data, created_at, updated_at')
      }
    } catch (error) {
      console.log('   ⚠️ Não foi possível obter amostra dos dados')
    }
  }

  // Verificar estrutura da tabela report_items
  if (tableStatus.report_items?.exists) {
    console.log('\n📄 Tabela REPORT_ITEMS:')
    try {
      const { data: itemSample } = await supabaseAdmin
        .from('report_items')
        .select('*')
        .limit(1)
        .single()

      if (itemSample) {
        console.log('   Colunas encontradas:', Object.keys(itemSample))
        console.log('   Campos esperados: id, report_id, form_norm, linha, horario, vendedor,')
        console.log('                     quantidade, valor, categoria, observacoes, source_file,')
        console.log('                     row_index, is_mapped, created_at')
      }
    } catch (error) {
      console.log('   ⚠️ Não foi possível obter amostra dos dados')
    }
  }

  console.log('\n🔍 VERIFICANDO APIS QUE USAM TABELAS ESPECÍFICAS:')

  // Verificar quais APIs podem estar falhando por falta de tabelas
  const apiTableDependencies = {
    '/api/history': ['reports'],
    '/api/save-report': ['reports', 'report_items', 'users'],
    '/api/last-processing': ['last_processing'],
    '/api/observations': ['daily_observations'],
    '/api/analytics': ['reports', 'report_items'],
    '/api/audit': ['audit_logs'],
    '/api/user/settings': ['user_settings'],
    '/api/mappings': ['mappings']
  }

  Object.entries(apiTableDependencies).forEach(([api, tables]) => {
    const missingTables = tables.filter(table => !tableStatus[table]?.exists)
    if (missingTables.length > 0) {
      console.log(`   ❌ ${api}: PODE FALHAR - tabelas faltantes: ${missingTables.join(', ')}`)
    } else {
      console.log(`   ✅ ${api}: OK - todas as tabelas necessárias existem`)
    }
  })

  console.log('\n📋 RESUMO DA VERIFICAÇÃO:')
  const existingTables = Object.entries(tableStatus).filter(([, status]) => status.exists)
  const missingTables = Object.entries(tableStatus).filter(([, status]) => !status.exists)

  console.log(`✅ Tabelas existentes: ${existingTables.length}/${expectedTables.length}`)
  existingTables.forEach(([table, status]) => {
    console.log(`   - ${table} (${status.count} registros)`)
  })

  if (missingTables.length > 0) {
    console.log(`❌ Tabelas faltantes: ${missingTables.length}`)
    missingTables.forEach(([table, status]) => {
      console.log(`   - ${table}: ${status.error}`)
    })
  }

  console.log('\n💡 RECOMENDAÇÕES:')
  if (missingTables.length > 0) {
    console.log('1. Criar as tabelas faltantes no Supabase')
    console.log('2. Executar migrações necessárias')
    console.log('3. Verificar se o schema está atualizado')
  } else {
    console.log('✅ Estrutura do banco parece completa!')
    console.log('✅ Todas as tabelas esperadas existem')
  }

  // Verificar relacionamentos/constraints
  console.log('\n🔗 VERIFICANDO RELACIONAMENTOS:')
  if (tableStatus.reports?.exists && tableStatus.users?.exists) {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .select('*, users!inner(*)')
        .limit(1)

      if (error) {
        console.log('   ⚠️ Relacionamento reports -> users pode ter problema:', error.message)
      } else {
        console.log('   ✅ Relacionamento reports -> users funcionando')
      }
    } catch (error) {
      console.log('   ⚠️ Erro ao testar relacionamento:', error)
    }
  }

  return {
    existingTables: existingTables.map(([name]) => name),
    missingTables: missingTables.map(([name]) => name),
    totalTables: expectedTables.length,
    healthCheck: missingTables.length === 0
  }
}

verifySupabaseStructure()