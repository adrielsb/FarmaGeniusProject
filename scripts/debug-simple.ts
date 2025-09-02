import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function debugSimple() {
  console.log('🔍 Debug simples - Dados no banco vs Frontend\n')

  // 1. Verificar dados no banco
  console.log('📊 DADOS NO BANCO:')
  const { data: reports } = await supabaseAdmin!
    .from('reports')
    .select('id, date, title, total_quantity, total_value, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  reports?.forEach((report, index) => {
    console.log(`${index + 1}. ID: ${report.id.substring(0, 8)}...`)
    console.log(`   Data: ${report.date} | Qtd: ${report.total_quantity} | Valor: R$ ${report.total_value}`)
    console.log(`   Criado: ${new Date(report.created_at).toLocaleString('pt-BR')}`)
  })

  // 2. Testar API que o frontend usa
  console.log('\n🖥️  API QUE O FRONTEND USA:')
  try {
    const response = await fetch('http://localhost:3000/api/last-processing')
    const result = await response.json()
    
    console.log(`Status: ${response.status}`)
    if (response.ok && result.success) {
      console.log('✅ API funcionando!')
      console.log(`Data do relatório: ${result.data.reportDate}`)
      console.log(`Total de itens: ${result.data.items ? result.data.items.length : 0}`)
      console.log(`KPIs presentes: ${result.data.kpis ? 'SIM' : 'NÃO'}`)
      console.log(`Vendedores: ${result.data.sellersData ? result.data.sellersData.length : 0}`)
    } else {
      console.log('❌ Problema na API:', result.error || result)
    }
  } catch (error) {
    console.log(`❌ Erro: ${error}`)
  }

  // 3. Verificar se há itens salvos para o último relatório
  if (reports && reports.length > 0) {
    console.log('\n📝 ITENS DO ÚLTIMO RELATÓRIO:')
    const latestReport = reports[0]
    const { count } = await supabaseAdmin!
      .from('report_items')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', latestReport.id)
    
    console.log(`Itens salvos: ${count || 0}`)
    
    // Mostrar alguns itens como exemplo
    const { data: sampleItems } = await supabaseAdmin!
      .from('report_items')
      .select('form_norm, vendedor, quantidade, valor')
      .eq('report_id', latestReport.id)
      .limit(3)
    
    console.log('Exemplos de itens:')
    sampleItems?.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.form_norm} | ${item.vendedor} | Qtd: ${item.quantidade} | R$ ${item.valor}`)
    })
  }

  console.log('\n🎯 CONCLUSÃO:')
  if (reports && reports.length > 0) {
    console.log('✅ Dados estão sendo salvos no banco corretamente')
    console.log('❓ Se não aparecem no frontend, pode ser:')
    console.log('   1. Problema de cache no navegador')
    console.log('   2. Usuário não está logado/autenticado')
    console.log('   3. Frontend não está carregando dados da API')
    console.log('   4. Estado do React não está sendo atualizado')
    console.log('\n💡 SOLUÇÕES:')
    console.log('   - Fazer hard refresh no navegador (Ctrl+Shift+R)')
    console.log('   - Verificar se está logado')
    console.log('   - Verificar console do navegador por erros')
  } else {
    console.log('❌ Nenhum dado encontrado no banco')
  }
}

debugSimple()