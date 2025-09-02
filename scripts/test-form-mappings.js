const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFormMappings() {
  console.log('🧪 Testando tabela form_mappings...\n')
  
  try {
    // Teste 1: SELECT simples
    console.log('1️⃣ Testando SELECT...')
    const { data: selectData, error: selectError } = await supabase
      .from('form_mappings')
      .select('*')
      .limit(5)

    if (selectError) {
      console.error('❌ Erro no SELECT:', selectError)
      return
    }
    console.log('✅ SELECT funcionou! Registros encontrados:', selectData.length)

    // Teste 2: INSERT 
    console.log('\n2️⃣ Testando INSERT...')
    const testMapping = {
      user_id: 'test-user-123',
      original_form: 'DIPIRONA SODICA 500MG',
      mapped_category: 'Analgésicos',
      confidence_score: 95,
      mapping_source: 'manual'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('form_mappings')
      .insert(testMapping)
      .select()

    if (insertError) {
      console.error('❌ Erro no INSERT:', insertError)
      return
    }
    console.log('✅ INSERT funcionou!', insertData)

    // Teste 3: SELECT com WHERE
    console.log('\n3️⃣ Testando SELECT com filtro...')
    const { data: filterData, error: filterError } = await supabase
      .from('form_mappings')
      .select('original_form, mapped_category')
      .eq('user_id', 'test-user-123')

    if (filterError) {
      console.error('❌ Erro no SELECT com filtro:', filterError)
    } else {
      console.log('✅ SELECT com filtro funcionou!', filterData)
    }

    // Teste 4: UPSERT
    console.log('\n4️⃣ Testando UPSERT...')
    const updateMapping = {
      user_id: 'test-user-123',
      original_form: 'DIPIRONA SODICA 500MG',
      mapped_category: 'Analgésicos e Antipiréticos',
      confidence_score: 100,
      mapping_source: 'manual'
    }

    const { data: upsertData, error: upsertError } = await supabase
      .from('form_mappings')
      .upsert(updateMapping, { onConflict: 'user_id,original_form' })
      .select()

    if (upsertError) {
      console.error('❌ Erro no UPSERT:', upsertError)
    } else {
      console.log('✅ UPSERT funcionou!', upsertData)
    }

    // Limpeza
    console.log('\n5️⃣ Limpando dados de teste...')
    const { error: deleteError } = await supabase
      .from('form_mappings')
      .delete()
      .eq('user_id', 'test-user-123')

    if (deleteError) {
      console.warn('⚠️ Erro na limpeza:', deleteError)
    } else {
      console.log('✅ Limpeza concluída!')
    }

    console.log('\n🎉 Todos os testes da tabela form_mappings passaram!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testFormMappings()