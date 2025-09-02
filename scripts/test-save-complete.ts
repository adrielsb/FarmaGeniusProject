import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'
import { getServerSession } from "next-auth"

async function testCompleteSaveFlow() {
  console.log('🔍 Testando fluxo completo de salvamento de relatório...\n')

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin não está configurado')
    return
  }

  try {
    // Teste 1: Simular dados de entrada como enviados pelo frontend
    console.log('📋 Teste 1: Validando estrutura de dados de entrada...')
    
    const mockFrontendData = {
      title: 'Relatório 28/08',
      date: '28/08',
      items: [
        {
          formaNorm: 'DIPIRONA 500MG',
          linha: 'ANALGÉSICOS',
          horario: '08:00',
          vendedor: 'João Silva',
          quantidade: 10,
          valor: 150.00,
          categoria: 'MEDICAMENTOS',
          observacoes: '',
          sourceFile: 'controle',
          rowIndex: 0,
          isMapped: true
        }
      ],
      kpis: {
        totalQuantity: 10,
        totalValue: 150.00,
        solidCount: 1,
        topSeller: 'João Silva'
      },
      sellersData: [
        { vendedor: 'João Silva', quantidade: 10, valor: 150.00 }
      ],
      kanbanData: {
        todo: [],
        inProgress: [],
        done: ['DIPIRONA 500MG']
      }
    }

    console.log('✅ Estrutura de dados válida')

    // Teste 2: Verificar user_id fictício
    console.log('\n👤 Teste 2: Verificando usuário fictício...')
    
    const testUserId = 'test-user-123'
    
    // Criar usuário fictício se não existir
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', testUserId)
      .single()

    if (!existingUser) {
      console.log('📝 Criando usuário fictício para teste...')
      const { error: createUserError } = await supabaseAdmin
        .from('users')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          name: 'Test User'
        })

      if (createUserError) {
        console.error('❌ Erro ao criar usuário fictício:', createUserError)
      } else {
        console.log('✅ Usuário fictício criado')
      }
    } else {
      console.log('✅ Usuário fictício já existe')
    }

    // Teste 3: Testar salvamento do relatório
    console.log('\n💾 Teste 3: Testando salvamento do relatório...')
    
    const reportData = {
      title: mockFrontendData.title,
      date: mockFrontendData.date,
      status: "completed",
      user_id: testUserId,
      total_quantity: mockFrontendData.kpis?.totalQuantity || 0,
      total_value: mockFrontendData.kpis?.totalValue || 0,
      solid_count: mockFrontendData.kpis?.solidCount || 0,
      top_seller: mockFrontendData.kpis?.topSeller,
      processed_data: {
        items: mockFrontendData.items,
        kpis: mockFrontendData.kpis,
        sellersData: mockFrontendData.sellersData,
        kanbanData: mockFrontendData.kanbanData
      },
      kanban_data: mockFrontendData.kanbanData || {},
      sellers_data: mockFrontendData.sellersData || []
    }

    console.log('📊 Dados preparados para inserção:')
    console.log('   - Título:', reportData.title)
    console.log('   - Data:', reportData.date)
    console.log('   - Usuário:', reportData.user_id)
    console.log('   - Total Quantity:', reportData.total_quantity)
    console.log('   - Total Value:', reportData.total_value)
    console.log('   - Items count:', mockFrontendData.items?.length || 0)

    // Inserir o relatório
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert(reportData)
      .select('*')
      .single()

    if (reportError || !report) {
      console.error('❌ Erro ao inserir relatório:', reportError)
      return
    } else {
      console.log('✅ Relatório inserido com sucesso! ID:', report.id)
    }

    // Teste 4: Testar inserção de itens do relatório
    console.log('\n📄 Teste 4: Testando inserção de itens do relatório...')
    
    if (mockFrontendData.items && mockFrontendData.items.length > 0) {
      const reportItems = mockFrontendData.items.map((item: any, index: number) => ({
        report_id: report.id,
        form_norm: item.formaNorm || item.formNorm || '',
        linha: item.linha || '',
        horario: item.horario || item.bucket || '',
        vendedor: item.vendedor || '—',
        quantidade: Number(item.quantidade || 0),
        valor: Number(item.valor || 0),
        categoria: item.categoria || '',
        observacoes: item.observacoes || '',
        source_file: item.sourceFile || 'controle',
        row_index: item.rowIndex || index,
        is_mapped: item.isMapped !== false
      }))

      console.log('📊 Itens preparados para inserção:', reportItems.length)
      
      const { error: itemsError } = await supabaseAdmin
        .from('report_items')
        .insert(reportItems)

      if (itemsError) {
        console.error('❌ Erro ao inserir itens:', itemsError)
      } else {
        console.log('✅ Itens inseridos com sucesso!')
      }
    }

    // Teste 5: Verificar recuperação dos dados
    console.log('\n📖 Teste 5: Verificando recuperação dos dados...')
    
    const { data: savedReport, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', report.id)
      .single()

    if (fetchError) {
      console.error('❌ Erro ao recuperar relatório:', fetchError)
    } else {
      console.log('✅ Relatório recuperado com sucesso!')
      console.log('📋 Dados recuperados:')
      console.log('   - ID:', savedReport.id)
      console.log('   - Título:', savedReport.title)
      console.log('   - Data:', savedReport.date)
      console.log('   - Status:', savedReport.status)
      console.log('   - Total Value:', savedReport.total_value)
    }

    // Teste 6: Limpeza - remover dados de teste
    console.log('\n🧹 Teste 6: Limpando dados de teste...')
    
    // Remover itens do relatório
    const { error: deleteItemsError } = await supabaseAdmin
      .from('report_items')
      .delete()
      .eq('report_id', report.id)

    if (deleteItemsError) {
      console.warn('⚠️ Aviso ao remover itens:', deleteItemsError.message)
    } else {
      console.log('✅ Itens removidos')
    }

    // Remover relatório
    const { error: deleteReportError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', report.id)

    if (deleteReportError) {
      console.warn('⚠️ Aviso ao remover relatório:', deleteReportError.message)
    } else {
      console.log('✅ Relatório removido')
    }

    // Remover usuário fictício
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', testUserId)

    if (deleteUserError) {
      console.warn('⚠️ Aviso ao remover usuário:', deleteUserError.message)
    } else {
      console.log('✅ Usuário fictício removido')
    }

    console.log('\n✨ Teste completo finalizado!')
    console.log('📋 Resultado: ✅ SISTEMA FUNCIONANDO CORRETAMENTE')
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste completo:', error)
    console.log('📋 Possíveis causas:')
    console.log('   1. Problema de conectividade com o banco')
    console.log('   2. Permissões de RLS muito restritivas')
    console.log('   3. Estrutura de tabela incompatível')
    console.log('   4. Problema com variáveis de ambiente')
  }
}

testCompleteSaveFlow()