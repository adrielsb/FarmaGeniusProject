// Script para testar conexão com banco de dados
import { supabaseAdmin } from '../lib/supabase.js'

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com banco de dados...')
  
  try {
    // Teste 1: Verificar configuração do supabaseAdmin
    if (!supabaseAdmin) {
      console.error('❌ supabaseAdmin não está configurado')
      return
    }
    console.log('✅ supabaseAdmin configurado')

    // Teste 2: Listar tabelas
    console.log('\n📋 Verificando tabelas disponíveis...')
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (tablesError) {
      console.error('❌ Erro ao listar tabelas:', tablesError)
    } else {
      console.log('✅ Tabelas encontradas:')
      tables?.forEach(table => console.log(`  - ${table.table_name}`))
    }

    // Teste 3: Verificar tabela processing_history
    console.log('\n🗂️  Verificando tabela processing_history...')
    const { data: historyCount, error: historyError } = await supabaseAdmin
      .from('processing_history')
      .select('*', { count: 'exact', head: true })

    if (historyError) {
      console.error('❌ Erro ao acessar processing_history:', historyError)
    } else {
      console.log(`✅ processing_history encontrada com ${historyCount?.length || 0} registros`)
      
      // Buscar um exemplo de registro
      const { data: sampleData } = await supabaseAdmin
        .from('processing_history')
        .select('*')
        .limit(1)
        
      if (sampleData && sampleData.length > 0) {
        console.log('📄 Exemplo de registro:')
        console.log(JSON.stringify(sampleData[0], null, 2))
      }
    }

    // Teste 4: Verificar tabela user_settings
    console.log('\n⚙️  Verificando tabela user_settings...')
    const { data: settingsCount, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*', { count: 'exact', head: true })

    if (settingsError) {
      console.error('❌ Erro ao acessar user_settings:', settingsError)
      console.log('Detalhes do erro:', settingsError)
    } else {
      console.log(`✅ user_settings encontrada com ${settingsCount?.length || 0} registros`)
    }

    // Teste 5: Verificar tabelas relacionadas a usuários
    console.log('\n👤 Verificando tabela users...')
    const { data: usersCount, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('❌ Erro ao acessar users:', usersError)
    } else {
      console.log(`✅ users encontrada com ${usersCount?.length || 0} registros`)
    }

    console.log('\n✅ Teste de conexão concluído!')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

testDatabaseConnection().catch(console.error)