import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function debugHistoryData() {
  console.log('🔍 Debug da aba Histórico - Verificando dados disponíveis...\n')

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin não configurado')
    return
  }

  // 1. Verificar todos os relatórios salvos
  console.log('📊 TODOS OS RELATÓRIOS NO BANCO:')
  const { data: allReports, error: reportsError } = await supabaseAdmin
    .from('reports')
    .select(`
      id,
      title,
      date,
      status,
      created_at,
      total_quantity,
      total_value,
      top_seller,
      user_id
    `)
    .order('created_at', { ascending: false })

  if (reportsError) {
    console.error('❌ Erro ao buscar relatórios:', reportsError)
    return
  }

  console.log(`✅ Total de relatórios encontrados: ${allReports?.length || 0}`)
  
  const userGroups: Record<string, any[]> = {}
  allReports?.forEach((report: any) => {
    const userId = report.user_id
    if (!userGroups[userId]) {
      userGroups[userId] = []
    }
    userGroups[userId].push(report)
  })

  // Mostrar relatórios por usuário
  for (const [userId, reports] of Object.entries(userGroups)) {
    console.log(`\n👤 Usuário ${userId}:`)
    console.log(`   📊 ${reports.length} relatórios`)
    
    reports.slice(0, 5).forEach((report, index) => {
      console.log(`   ${index + 1}. ${report.title} | ${report.date} | ${report.total_quantity} itens | R$ ${report.total_value}`)
    })
    
    if (reports.length > 5) {
      console.log(`   ... e mais ${reports.length - 5} relatórios`)
    }
  }

  // 2. Testar API /api/history com diferentes usuários
  console.log('\n🔍 TESTANDO API /api/history:')
  
  // Simular chamada da API (sem autenticação, então vai dar 401)
  try {
    const response = await fetch('http://localhost:3000/api/history')
    const result = await response.json()
    
    console.log(`Status: ${response.status}`)
    if (response.status === 401) {
      console.log('✅ API protegida corretamente (precisa estar logado)')
    } else if (response.ok) {
      console.log(`✅ API funcionando: ${result.reports?.length || 0} relatórios retornados`)
    } else {
      console.log('❌ Problema na API:', result.error)
    }
  } catch (error) {
    console.log(`❌ Erro ao testar API: ${error}`)
  }

  // 3. Verificar estrutura esperada pela API
  console.log('\n📋 VERIFICANDO ESTRUTURA PARA FRONTEND:')
  
  if (allReports && allReports.length > 0) {
    const sampleReport = allReports[0] as any
    console.log('✅ Estrutura do relatório mais recente:')
    console.log(`   id: ${sampleReport.id ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   title: ${sampleReport.title ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   date: ${sampleReport.date ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   status: ${sampleReport.status ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   created_at: ${sampleReport.created_at ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   total_quantity: ${sampleReport.total_quantity ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   total_value: ${sampleReport.total_value ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   top_seller: ${sampleReport.top_seller ? 'PRESENTE' : 'AUSENTE'}`)

    // Verificar se os campos correspondem ao que o frontend espera
    console.log('\n🔍 Mapeamento para interface HistoryItem:')
    console.log('   Interface espera: id, title, date, status, createdAt, totalQuantity, totalValue, topSeller')
    console.log('   Banco tem: id, title, date, status, created_at, total_quantity, total_value, top_seller')
    console.log('   ⚠️  PROBLEMA ENCONTRADO: Nomes de campos diferentes!')
    console.log('   - createdAt vs created_at')
    console.log('   - totalQuantity vs total_quantity') 
    console.log('   - totalValue vs total_value')
    console.log('   - topSeller vs top_seller')
  }

  console.log('\n🎯 POSSÍVEL PROBLEMA IDENTIFICADO:')
  console.log('❌ A API /api/history pode não estar mapeando corretamente os campos')
  console.log('❌ O frontend espera camelCase mas o Supabase usa snake_case')
  console.log('❌ Precisa converter os nomes dos campos na resposta da API')

  console.log('\n💡 SOLUÇÃO:')
  console.log('1. Verificar o arquivo /api/history/route.ts')
  console.log('2. Adicionar mapeamento de campos snake_case → camelCase')
  console.log('3. Garantir que a resposta tenha a estrutura que o frontend espera')
}

debugHistoryData()