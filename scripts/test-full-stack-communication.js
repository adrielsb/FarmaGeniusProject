const { createClient } = require('@supabase/supabase-js')
// Usar fetch nativo do Node.js (18+)
const fetch = globalThis.fetch || require('undici').fetch
require('dotenv').config()

// Configurações
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = 'http://localhost:3004' // Porta onde a aplicação está rodando

console.log('🔍 Verificação Completa da Stack FarmaGenius')
console.log('=' .repeat(50))

// 1. VERIFICAÇÃO DAS VARIÁVEIS DE AMBIENTE
console.log('\n1️⃣ VERIFICAÇÃO DAS VARIÁVEIS DE AMBIENTE')
console.log('-'.repeat(40))
console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl ? '✅ Configurada' : '❌ Faltando')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey ? '✅ Configurada' : '❌ Faltando')
console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey ? '✅ Configurada' : '❌ Faltando')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis essenciais do Supabase não encontradas!')
  process.exit(1)
}

// Clientes Supabase
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseService = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

async function testDatabase() {
  console.log('\n2️⃣ TESTE DE COMUNICAÇÃO COM BANCO DE DADOS')
  console.log('-'.repeat(40))

  try {
    // Teste básico de conectividade
    console.log('🔗 Testando conectividade básica...')
    const { data: ping, error: pingError } = await supabaseAnon
      .from('form_mappings')
      .select('count', { count: 'exact', head: true })

    if (pingError) {
      console.error('❌ Erro de conectividade:', pingError.message)
      return false
    }
    console.log('✅ Conectividade OK')

    // Listar tabelas principais
    console.log('\n📋 Verificando tabelas principais...')
    const tables = ['form_mappings', 'reports', 'processed_reports', 'production_data']
    const tableStatus = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabaseAnon
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
          tableStatus[table] = false
        } else {
          console.log(`✅ ${table}: ${count || 0} registros`)
          tableStatus[table] = true
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
        tableStatus[table] = false
      }
    }

    // Teste de operações CRUD na form_mappings
    console.log('\n🧪 Testando operações CRUD...')
    const testData = {
      user_id: 'test-stack-' + Date.now(),
      original_form: 'TEST COMUNICACAO',
      mapped_category: 'TESTE',
      mapping_source: 'manual'
    }

    // INSERT
    const { data: insertData, error: insertError } = await supabaseAnon
      .from('form_mappings')
      .insert(testData)
      .select()

    if (insertError) {
      console.error('❌ INSERT falhou:', insertError.message)
      return false
    }
    console.log('✅ INSERT funcionou')

    // SELECT
    const { data: selectData, error: selectError } = await supabaseAnon
      .from('form_mappings')
      .select('*')
      .eq('user_id', testData.user_id)

    if (selectError || !selectData || selectData.length === 0) {
      console.error('❌ SELECT falhou')
      return false
    }
    console.log('✅ SELECT funcionou')

    // UPDATE
    const { error: updateError } = await supabaseAnon
      .from('form_mappings')
      .update({ mapped_category: 'TESTE ATUALIZADO' })
      .eq('user_id', testData.user_id)

    if (updateError) {
      console.error('❌ UPDATE falhou:', updateError.message)
      return false
    }
    console.log('✅ UPDATE funcionou')

    // DELETE (limpeza)
    const { error: deleteError } = await supabaseAnon
      .from('form_mappings')
      .delete()
      .eq('user_id', testData.user_id)

    if (deleteError) {
      console.error('❌ DELETE falhou:', deleteError.message)
    } else {
      console.log('✅ DELETE funcionou')
    }

    return true

  } catch (error) {
    console.error('❌ Erro geral no teste de banco:', error.message)
    return false
  }
}

async function testBackendAPIs() {
  console.log('\n3️⃣ TESTE DE COMUNICAÇÃO COM BACKEND (APIs)')
  console.log('-'.repeat(40))

  // Lista de endpoints para testar
  const endpoints = [
    { path: '/api/last-processing', method: 'GET', description: 'Último processamento' },
    { path: '/api/history', method: 'GET', description: 'Histórico de relatórios' },
    { path: '/api/production', method: 'GET', description: 'Dados de produção' },
    { path: '/api/test-connection', method: 'GET', description: 'Teste de conexão' }
  ]

  const apiResults = {}

  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Testando ${endpoint.method} ${endpoint.path}...`)
      
      const response = await fetch(`${appUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      })

      const responseTime = Date.now()
      let responseData

      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }

      if (response.ok) {
        console.log(`✅ ${endpoint.description}: OK (${response.status})`)
        apiResults[endpoint.path] = { status: 'success', code: response.status }
      } else {
        console.log(`⚠️ ${endpoint.description}: ${response.status} - ${response.statusText}`)
        apiResults[endpoint.path] = { status: 'error', code: response.status, error: response.statusText }
      }

    } catch (error) {
      console.log(`❌ ${endpoint.description}: ${error.message}`)
      apiResults[endpoint.path] = { status: 'failed', error: error.message }
    }
  }

  return apiResults
}

async function testFrontendBackendIntegration() {
  console.log('\n4️⃣ TESTE DE INTEGRAÇÃO FRONTEND-BACKEND')
  console.log('-'.repeat(40))

  try {
    // Simular chamada do FormMappingsService
    console.log('🔗 Simulando chamada do FormMappingsService...')
    
    // Teste que simula exatamente o que o dashboard faz
    const userId = 'integration-test-' + Date.now()
    
    // 1. Inserir dados via backend (simulando processamento)
    const testMapping = {
      user_id: userId,
      original_form: 'INTEGRATION TEST',
      mapped_category: 'TEST CATEGORY',
      mapping_source: 'manual'
    }

    const { data: insertData, error: insertError } = await supabaseAnon
      .from('form_mappings')
      .insert(testMapping)
      .select()

    if (insertError) {
      console.error('❌ Falha na inserção de teste:', insertError.message)
      return false
    }

    console.log('✅ Dados inseridos via backend')

    // 2. Buscar dados via frontend (simulando getUserMappings)
    const { data: mappingsData, error: mappingsError } = await supabaseAnon
      .from('form_mappings')
      .select('original_form, mapped_category')
      .eq('user_id', userId)

    if (mappingsError) {
      console.error('❌ Falha na busca de mapeamentos:', mappingsError.message)
      return false
    }

    console.log('✅ Dados recuperados via frontend')

    // 3. Verificar integridade dos dados
    const mappings = {}
    mappingsData.forEach(row => {
      if (row && row.original_form && row.mapped_category) {
        mappings[row.original_form] = row.mapped_category
      }
    })

    if (mappings['INTEGRATION TEST'] === 'TEST CATEGORY') {
      console.log('✅ Integridade dos dados confirmada')
    } else {
      console.log('❌ Dados corrompidos ou incompletos')
      return false
    }

    // Limpeza
    await supabaseAnon.from('form_mappings').delete().eq('user_id', userId)
    console.log('✅ Limpeza concluída')

    return true

  } catch (error) {
    console.error('❌ Erro no teste de integração:', error.message)
    return false
  }
}

async function runFullStackTest() {
  console.log('\n🚀 INICIANDO VERIFICAÇÃO COMPLETA...\n')

  const results = {
    database: false,
    backend: {},
    integration: false
  }

  // Testes sequenciais
  results.database = await testDatabase()
  results.backend = await testBackendAPIs()
  results.integration = await testFrontendBackendIntegration()

  // Relatório final
  console.log('\n5️⃣ RELATÓRIO FINAL')
  console.log('='.repeat(50))

  console.log(`📊 Comunicação com Banco: ${results.database ? '✅ OK' : '❌ FALHOU'}`)
  
  const apiSuccesses = Object.values(results.backend).filter(r => r.status === 'success').length
  const apiTotal = Object.keys(results.backend).length
  console.log(`🌐 APIs do Backend: ${apiSuccesses}/${apiTotal} funcionando`)

  console.log(`🔄 Integração Frontend-Backend: ${results.integration ? '✅ OK' : '❌ FALHOU'}`)

  if (results.database && results.integration && apiSuccesses > 0) {
    console.log('\n🎉 STACK FUNCIONANDO CORRETAMENTE!')
    console.log('✅ Todos os componentes essenciais estão operacionais')
  } else {
    console.log('\n⚠️ PROBLEMAS DETECTADOS NA STACK')
    console.log('❌ Alguns componentes precisam de atenção')
  }
}

// Executar verificação
runFullStackTest().catch(error => {
  console.error('❌ Erro crítico na verificação:', error)
  process.exit(1)
})