const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkMappingsStructure() {
  console.log('🔍 Verificando estrutura da tabela mappings...\n')
  
  try {
    // Tentar fazer uma query simples para descobrir as colunas
    const { data, error } = await supabase
      .from('mappings')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Erro ao consultar mappings:', error)
      
      // Tentar um select básico para ver que colunas existem
      console.log('\n🔍 Tentando descobrir colunas disponíveis...')
      const { data: basicData, error: basicError } = await supabase
        .from('mappings')
        .select()
        .limit(1)
      
      if (basicError) {
        console.error('❌ Erro básico:', basicError)
      } else {
        console.log('✅ Consulta básica funcionou:', basicData)
      }
    } else {
      console.log('✅ Estrutura da tabela mappings:')
      if (data && data.length > 0) {
        console.log('Colunas encontradas:', Object.keys(data[0]))
        console.log('Exemplo de dados:', data[0])
      } else {
        console.log('Tabela vazia, mas consulta funcionou')
        
        // Tentar inserir um registro de teste com campos básicos
        console.log('\n🧪 Testando inserção com user_id apenas...')
        const { data: insertData, error: insertError } = await supabase
          .from('mappings')
          .insert({ user_id: 'test-user-structure' })
          .select()
        
        if (insertError) {
          console.log('📋 Erro de inserção revela estrutura necessária:')
          console.log(insertError.message)
          
          // Tentar com mais campos
          console.log('\n🧪 Testando com campos adicionais...')
          const testFields = [
            { user_id: 'test', original_form: 'test', mapped_category: 'test' },
            { user_id: 'test', form: 'test', category: 'test' },
            { user_id: 'test', key: 'test', value: 'test' },
            { user_id: 'test', original: 'test', mapped: 'test' }
          ]
          
          for (const testField of testFields) {
            const { data: testData, error: testError } = await supabase
              .from('mappings')
              .insert(testField)
              .select()
            
            if (!testError) {
              console.log('✅ Estrutura funcionou:', Object.keys(testField))
              
              // Limpar teste
              await supabase.from('mappings').delete().eq('user_id', 'test')
              break
            } else {
              console.log(`❌ Falhou com:`, Object.keys(testField), '-', testError.message)
            }
          }
        } else {
          console.log('✅ Inserção básica funcionou:', insertData)
          console.log('📋 Colunas na resposta:', Object.keys(insertData[0]))
          
          // Limpar teste
          await supabase.from('mappings').delete().eq('user_id', 'test-user-structure')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkMappingsStructure()