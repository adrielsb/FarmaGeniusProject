const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Usar ANON KEY como o dashboard faz
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simular FormMappingsService.getUserMappings
async function testGetUserMappings() {
  console.log('🔍 Testando cenário real do Dashboard...\n')
  
  try {
    // Simular usuário não logado (como pode estar acontecendo)
    console.log('1️⃣ Testando com userId undefined...')
    let userId = undefined
    
    if (!userId || userId.trim() === '') {
      console.log('⚠️ UserId é undefined - isso pode ser o problema!')
      console.log('Dashboard deve mostrar: "Usuário não está logado ou ID não disponível"')
    }

    // Simular usuário logado
    console.log('\n2️⃣ Testando com userId simulado...')
    userId = 'test-user-dashboard'
    
    console.log('🔄 Carregando mapeamentos do usuário:', userId)
    const { data, error } = await supabase
      .from('form_mappings')
      .select('original_form, mapped_category')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Erro ao buscar mapeamentos do usuário:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId: userId
      })
      
      if (error.code === 'PGRST116') {
        console.error('Tabela form_mappings não encontrada no banco de dados')
      } else if (error.code === '42501') {
        console.error('Permissões insuficientes para acessar form_mappings')
      }
      return
    }

    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ Nenhum dado retornado do Supabase')
    } else {
      console.log(`✅ Encontrados ${data.length} mapeamentos para usuário ${userId}`)
      
      if (data.length === 0) {
        console.log('ℹ️ Nenhum mapeamento encontrado para o usuário (normal para usuário novo)')
      }
    }

    // Testar inserção de dados para o usuário de teste
    console.log('\n3️⃣ Adicionando mapeamento de teste...')
    const testMapping = {
      user_id: userId,
      original_form: 'TESTE DASHBOARD',
      mapped_category: 'CATEGORIA TESTE',
      mapping_source: 'manual'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('form_mappings')
      .upsert(testMapping, { onConflict: 'user_id,original_form' })
      .select()

    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError)
    } else {
      console.log('✅ Mapeamento inserido:', insertData)
      
      // Testar busca novamente
      console.log('\n4️⃣ Testando busca após inserção...')
      const { data: newData, error: newError } = await supabase
        .from('form_mappings')
        .select('original_form, mapped_category')
        .eq('user_id', userId)

      if (newError) {
        console.error('❌ Erro na segunda busca:', newError)
      } else {
        console.log('✅ Mapeamentos encontrados:', newData)
        
        // Converter para formato do dashboard
        const mappings = {}
        newData.forEach(row => {
          if (row && row.original_form && row.mapped_category) {
            mappings[row.original_form] = row.mapped_category
          }
        })
        console.log('✅ Formato do dashboard:', mappings)
      }
    }

    // Limpeza
    console.log('\n5️⃣ Limpando dados de teste...')
    await supabase.from('form_mappings').delete().eq('user_id', userId)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testGetUserMappings()