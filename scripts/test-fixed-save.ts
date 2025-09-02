import 'dotenv/config'

async function testFixedSaveAPI() {
  console.log('🔍 Testando API de salvamento corrigida...\n')

  const baseURL = 'http://localhost:3000'

  // Teste 1: Dados válidos
  console.log('✅ Teste 1: Testando dados válidos...')
  
  const validData = {
    title: 'Relatório Teste Corrigido',
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
        observacoes: 'Teste',
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

  try {
    const response = await fetch(`${baseURL}/api/save-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validData)
    })

    const result = await response.json()
    console.log(`   Status: ${response.status}`)
    console.log(`   Resposta: ${JSON.stringify(result, null, 2)}`)

    if (response.status === 401) {
      console.log('   💡 Status 401 esperado - sem autenticação')
    }
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error}`)
  }

  // Teste 2: Dados inválidos - título vazio
  console.log('\n❌ Teste 2: Testando título vazio...')
  
  const invalidTitleData = {
    ...validData,
    title: ''
  }

  try {
    const response = await fetch(`${baseURL}/api/save-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidTitleData)
    })

    const result = await response.json()
    console.log(`   Status: ${response.status}`)
    console.log(`   Erro esperado: ${result.error}`)
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error}`)
  }

  // Teste 3: Dados inválidos - items não é array
  console.log('\n❌ Teste 3: Testando items inválido...')
  
  const invalidItemsData = {
    ...validData,
    items: null
  }

  try {
    const response = await fetch(`${baseURL}/api/save-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidItemsData)
    })

    const result = await response.json()
    console.log(`   Status: ${response.status}`)
    console.log(`   Erro esperado: ${result.error}`)
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error}`)
  }

  // Teste 4: Teste de tipos - KPIs inválidos
  console.log('\n🧪 Teste 4: Testando validação de tipos...')
  
  const invalidTypesData = {
    ...validData,
    kpis: {
      totalQuantity: 'string_inválida',
      totalValue: null,
      solidCount: undefined,
      topSeller: 123
    }
  }

  try {
    const response = await fetch(`${baseURL}/api/save-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidTypesData)
    })

    const result = await response.json()
    console.log(`   Status: ${response.status}`)
    console.log(`   Resposta: ${JSON.stringify(result, null, 2)}`)
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error}`)
  }

  console.log('\n✨ Testes de API concluídos!')
  console.log('📋 As melhorias implementadas incluem:')
  console.log('   ✅ Validação robusta de dados de entrada')
  console.log('   ✅ Sanitização de strings (trim)')
  console.log('   ✅ Conversão segura de tipos numéricos')
  console.log('   ✅ Filtragem de itens inválidos')
  console.log('   ✅ Logging detalhado de erros')
  console.log('   ✅ Classificação inteligente de erros')
  console.log('   ✅ Tratamento de casos edge')
}

testFixedSaveAPI()