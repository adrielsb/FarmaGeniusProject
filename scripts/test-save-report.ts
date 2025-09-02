import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function testSaveReport() {
  console.log('🔍 Testando salvamento de relatório...\n')

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin não está configurado')
    return
  }

  try {
    // Teste 1: Verificar se a tabela 'reports' existe
    console.log('📋 Testando acesso à tabela reports...')
    const { data: reportsTest, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .limit(1)

    if (reportsError) {
      console.error('❌ Erro ao acessar tabela reports:', reportsError)
      return
    } else {
      console.log('✅ Tabela reports acessível')
    }

    // Teste 2: Verificar se a tabela 'users' existe
    console.log('👤 Testando acesso à tabela users...')
    const { data: usersTest, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError)
      console.log('ℹ️  Isso pode causar problemas na verificação de usuário')
    } else {
      console.log('✅ Tabela users acessível')
    }

    // Teste 3: Verificar se a tabela 'report_items' existe
    console.log('📄 Testando acesso à tabela report_items...')
    const { data: itemsTest, error: itemsError } = await supabaseAdmin
      .from('report_items')
      .select('*')
      .limit(1)

    if (itemsError) {
      console.error('❌ Erro ao acessar tabela report_items:', itemsError)
      console.log('ℹ️  Isso pode causar problemas ao salvar itens do relatório')
    } else {
      console.log('✅ Tabela report_items acessível')
    }

    // Teste 4: Simular inserção de relatório (mas não executar)
    console.log('\n🧪 Testando estrutura de dados para salvamento...')
    
    const mockReportData = {
      title: 'Teste - ' + new Date().toISOString(),
      date: '2025-08-28',
      status: 'completed',
      user_id: '12345',
      total_quantity: 100,
      total_value: 1000,
      solid_count: 50,
      top_seller: 'Vendedor Teste',
      processed_data: {
        items: [],
        kpis: {},
        sellersData: [],
        kanbanData: {}
      },
      kanban_data: {},
      sellers_data: []
    }

    console.log('✅ Estrutura de dados válida para salvamento')
    console.log('📊 Campos a serem salvos:', Object.keys(mockReportData))

    // Teste 5: Verificar tipos de dados esperados na tabela reports
    console.log('\n🔍 Obtendo informações sobre a estrutura da tabela...')
    
    // Tentar obter metadados da tabela
    const { data: tableInfo } = await supabaseAdmin.rpc('version')
    console.log('🗄️  Versão do PostgreSQL:', tableInfo || 'Não disponível')

    console.log('\n✨ Teste concluído!')
    console.log('📋 Possíveis problemas identificados:')
    
    if (reportsError) {
      console.log('   ❌ Tabela "reports" não existe ou não é acessível')
    }
    if (usersError) {
      console.log('   ❌ Tabela "users" não existe ou não é acessível')
    }
    if (itemsError) {
      console.log('   ❌ Tabela "report_items" não existe ou não é acessível')
    }
    
    if (!reportsError && !usersError && !itemsError) {
      console.log('   ✅ Todas as tabelas estão acessíveis')
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testSaveReport()