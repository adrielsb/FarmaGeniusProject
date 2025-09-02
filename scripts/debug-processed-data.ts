import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function debugProcessedData() {
  console.log('🔍 Investigando dados processados salvos...\n')

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin não configurado')
    return
  }

  // 1. Verificar relatórios recentes
  console.log('📊 Verificando relatórios recentes...')
  const { data: reports, error: reportsError } = await supabaseAdmin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (reportsError) {
    console.error('❌ Erro ao buscar relatórios:', reportsError)
  } else {
    console.log(`✅ Encontrados ${reports?.length || 0} relatórios`)
    reports?.forEach((report: any, index: number) => {
      console.log(`   ${index + 1}. ID: ${report.id}`)
      console.log(`      Data: ${report.date}`)
      console.log(`      Título: ${report.title}`)
      console.log(`      Status: ${report.status}`)
      console.log(`      Quantidade: ${report.total_quantity}`)
      console.log(`      Valor: R$ ${report.total_value}`)
      console.log(`      Criado em: ${new Date(report.created_at).toLocaleString('pt-BR')}`)
      console.log()
    })
  }

  // 2. Verificar itens dos relatórios
  console.log('📝 Verificando itens dos relatórios...')
  // @ts-ignore
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('report_items')
    .select('report_id, count(*)')
    // @ts-ignore
    .group('report_id')
    .order('report_id', { ascending: false })
    .limit(5)

  if (itemsError) {
    console.error('❌ Erro ao buscar itens:', itemsError)
  } else {
    console.log(`✅ Itens por relatório:`)
    // Como aggregate não funciona bem no Supabase, vamos fazer diferente
    if (reports) {
      for (const report of reports) {
        const { count } = await supabaseAdmin
          .from('report_items')
          .select('*', { count: 'exact', head: true })
          .eq('report_id', report.id)
        
        console.log(`   Relatório ${report.id}: ${count || 0} itens`)
      }
    }
  }

  // 3. Verificar último processamento
  console.log('\n⏱️  Verificando último processamento...')
  const { data: lastProcessing, error: lastError } = await supabaseAdmin
    .from('last_processing')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (lastError) {
    if (lastError.code === 'PGRST116') {
      console.log('⚠️  Nenhum processamento encontrado')
    } else {
      console.error('❌ Erro ao buscar último processamento:', lastError)
    }
  } else {
    console.log('✅ Último processamento encontrado:')
    console.log(`   Data: ${lastProcessing.report_date}`)
    console.log(`   Relatório ID: ${lastProcessing.report_id}`)
    console.log(`   Processado em: ${new Date(lastProcessing.processed_at).toLocaleString('pt-BR')}`)
    console.log(`   Total itens: ${lastProcessing.total_quantity}`)
    console.log(`   Valor total: R$ ${lastProcessing.total_value}`)
  }

  // 4. Verificar estrutura dos dados processados
  console.log('\n🗂️  Verificando estrutura de dados processados...')
  if (reports && reports.length > 0) {
    const latestReport = reports[0]
    
    console.log('📋 Estrutura do último relatório:')
    console.log(`   processed_data: ${latestReport.processed_data ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   kanban_data: ${latestReport.kanban_data ? 'PRESENTE' : 'AUSENTE'}`)
    console.log(`   sellers_data: ${latestReport.sellers_data ? 'PRESENTE' : 'AUSENTE'}`)

    if (latestReport.processed_data) {
      const processedData = latestReport.processed_data
      console.log('   Conteúdo processed_data:')
      console.log(`     - items: ${processedData.items ? processedData.items.length : 0} itens`)
      console.log(`     - kpis: ${processedData.kpis ? 'PRESENTE' : 'AUSENTE'}`)
      console.log(`     - sellersData: ${processedData.sellersData ? processedData.sellersData.length : 0} vendedores`)
      console.log(`     - kanbanData: ${processedData.kanbanData ? 'PRESENTE' : 'AUSENTE'}`)
    }
  }

  // 5. Testar recuperação de dados para o frontend
  console.log('\n🖥️  Testando recuperação para frontend...')
  try {
    const response = await fetch('http://localhost:3000/api/last-processing')
    const result = await response.json()
    
    console.log(`   Status da API: ${response.status} ${response.ok ? '✅' : '❌'}`)
    if (response.ok && result.success) {
      console.log('   ✅ API last-processing retornando dados:')
      console.log(`      Data: ${result.data.reportDate}`)
      console.log(`      Items: ${result.data.items ? result.data.items.length : 0}`)
      console.log(`      KPIs: ${result.data.kpis ? 'PRESENTE' : 'AUSENTE'}`)
      console.log(`      Sellers: ${result.data.sellersData ? result.data.sellersData.length : 0}`)
    } else {
      console.log('   ❌ Problema na API:', result.error || 'Erro desconhecido')
    }
  } catch (error) {
    console.log(`   ❌ Erro ao testar API: ${error}`)
  }

  console.log('\n🎯 DIAGNÓSTICO:')
  console.log('Se os dados estão sendo salvos no banco mas não aparecem no frontend:')
  console.log('1. 🔍 Verificar se a API last-processing está funcionando')
  console.log('2. 🔍 Verificar se o frontend está fazendo a requisição correta')
  console.log('3. 🔍 Verificar se há problema de cache ou estado no React')
  console.log('4. 🔍 Verificar se o usuário logado tem acesso aos dados')
}

debugProcessedData()