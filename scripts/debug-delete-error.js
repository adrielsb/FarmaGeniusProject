const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugDeleteError() {
  console.log('🔍 Investigando erro de DELETE em /api/history/[id]')
  console.log('=' .repeat(50))

  const problemId = '4e5b931d-c6ce-4de8-8869-e6c7ccf64668'
  const currentUserId = '1d7978bb-1dca-4c1f-ace0-feedc35ae7c2'

  try {
    // 1. Verificar se o ID existe na tabela reports
    console.log('\n1️⃣ Verificando se o relatório existe...')
    const { data: allReports, error: allError } = await supabase
      .from('reports')
      .select('id, user_id, title, date')
      .eq('id', problemId)

    if (allError) {
      console.error('❌ Erro ao buscar relatório:', allError.message)
      return
    }

    if (!allReports || allReports.length === 0) {
      console.log('❌ Relatório não encontrado na tabela reports')
      
      // Listar todos os relatórios para debug
      console.log('\n🔍 Listando todos os relatórios disponíveis:')
      const { data: allReportsList } = await supabase
        .from('reports')
        .select('id, user_id, title, date')
        .limit(10)

      if (allReportsList && allReportsList.length > 0) {
        allReportsList.forEach(report => {
          console.log(`  📄 ID: ${report.id}`)
          console.log(`     User: ${report.user_id}`)
          console.log(`     Title: ${report.title}`)
          console.log(`     Date: ${report.date}`)
          console.log('     ---')
        })
      } else {
        console.log('❌ Nenhum relatório encontrado na tabela reports')
      }
      return
    }

    const report = allReports[0]
    console.log('✅ Relatório encontrado:')
    console.log(`   📄 ID: ${report.id}`)
    console.log(`   👤 User ID: ${report.user_id}`)
    console.log(`   📝 Title: ${report.title}`)
    console.log(`   📅 Date: ${report.date}`)

    // 2. Verificar se pertence ao usuário atual
    console.log('\n2️⃣ Verificando propriedade do relatório...')
    console.log(`   Usuário logado: ${currentUserId}`)
    console.log(`   Dono do relatório: ${report.user_id}`)
    
    if (report.user_id !== currentUserId) {
      console.log('❌ PROBLEMA: Relatório não pertence ao usuário logado!')
      console.log('   Este é o motivo do erro 404 - o endpoint só retorna/deleta relatórios do próprio usuário')
    } else {
      console.log('✅ Relatório pertence ao usuário logado')
    }

    // 3. Testar a query exata que o endpoint DELETE usa
    console.log('\n3️⃣ Testando query do endpoint DELETE...')
    const { data: deleteTestData, error: deleteTestError } = await supabase
      .from('reports')
      .select('id')
      .eq('id', problemId)
      .eq('user_id', currentUserId)
      .single()

    if (deleteTestError || !deleteTestData) {
      console.log('❌ Query do DELETE falhou - explicando o 404')
      if (deleteTestError) {
        console.log(`   Erro: ${deleteTestError.message}`)
      }
    } else {
      console.log('✅ Query do DELETE funcionaria')
    }

    // 4. Verificar se existe report_items para este relatório
    console.log('\n4️⃣ Verificando itens do relatório...')
    const { data: reportItems, error: itemsError } = await supabase
      .from('report_items')
      .select('id')
      .eq('report_id', problemId)

    if (itemsError) {
      console.log('⚠️ Erro ao buscar itens:', itemsError.message)
    } else if (reportItems) {
      console.log(`📦 Encontrados ${reportItems.length} itens do relatório`)
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugDeleteError()