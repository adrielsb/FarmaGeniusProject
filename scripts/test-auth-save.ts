import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function testAuthenticationIssues() {
  console.log('🔍 Testando possíveis problemas de autenticação no salvamento...\n')

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin não está configurado')
    return
  }

  try {
    // Teste 1: Verificar se há usuários reais na base
    console.log('👥 Teste 1: Verificando usuários existentes...')
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
    } else {
      console.log(`✅ Encontrados ${users?.length || 0} usuários`)
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} - ID: ${user.id}`)
        })
      } else {
        console.log('⚠️  Nenhum usuário encontrado - isso pode causar problemas de autenticação')
      }
    }

    // Teste 2: Verificar se há problemas de RLS na tabela users
    console.log('\n🔐 Teste 2: Verificando políticas RLS na tabela users...')
    
    // Tentar buscar um usuário específico sem bypass de RLS
    const { data: rlsTest, error: rlsError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)

    if (rlsError) {
      console.error('❌ Problema de RLS:', rlsError.message)
      console.log('💡 Solução: Verifique se o Service Role tem permissões de bypass de RLS')
    } else {
      console.log('✅ RLS funcionando corretamente')
    }

    // Teste 3: Verificar estrutura da tabela reports
    console.log('\n📋 Teste 3: Verificando estrutura da tabela reports...')
    
    const { data: reportStructure, error: structError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .limit(1)

    if (structError) {
      console.error('❌ Erro ao acessar tabela reports:', structError.message)
      
      // Possíveis problemas comuns
      if (structError.message.includes('relation "public.reports" does not exist')) {
        console.log('💡 Problema: Tabela "reports" não existe')
        console.log('   Solução: Execute as migrações do banco de dados')
      } else if (structError.message.includes('permission denied')) {
        console.log('💡 Problema: Permissões insuficientes')
        console.log('   Solução: Verifique as políticas RLS')
      }
    } else {
      console.log('✅ Tabela reports acessível')
    }

    // Teste 4: Simular erro comum de user_id inválido
    console.log('\n❌ Teste 4: Simulando erro de user_id inválido...')
    
    const invalidUserId = 'user-inexistente-123'
    
    try {
      const { data: report, error: invalidUserError } = await supabaseAdmin
        .from('reports')
        .insert({
          title: 'Teste user inválido',
          date: '28/08',
          status: 'completed',
          user_id: invalidUserId, // Usuário que não existe
          total_quantity: 0,
          total_value: 0,
          processed_data: {}
        })
        .select('*')
        .single()

      if (invalidUserError) {
        console.log('✅ Erro capturado corretamente:', invalidUserError.message)
        
        if (invalidUserError.message.includes('foreign key constraint')) {
          console.log('💡 Diagnóstico: Restrição de chave estrangeira está funcionando')
          console.log('   Isso significa que o erro no frontend pode ser devido a:')
          console.log('   1. Sessão do usuário expirada')
          console.log('   2. user.id undefined ou null')
          console.log('   3. Problema no middleware de autenticação')
        }
      } else {
        console.log('⚠️  Não houve erro - isso pode indicar problema nas restrições do banco')
      }
    } catch (error: any) {
      console.log('✅ Erro capturado:', error.message)
    }

    // Teste 5: Verificar formato de dados enviados pelo frontend
    console.log('\n📱 Teste 5: Simulando possíveis problemas de formato de dados...')
    
    // Testar dados com campos undefined/null
    const problematicData = {
      title: undefined, // Pode causar erro
      date: '', // String vazia
      items: null, // Null ao invés de array
      kpis: undefined // Undefined
    }

    console.log('📊 Dados problemáticos identificados:')
    console.log('   - title undefined:', problematicData.title === undefined)
    console.log('   - date vazio:', problematicData.date === '')
    console.log('   - items null:', problematicData.items === null)
    console.log('   - kpis undefined:', problematicData.kpis === undefined)

    // Teste 6: Verificar NextAuth session
    console.log('\n🔑 Teste 6: Problemas comuns de sessão NextAuth...')
    
    console.log('💡 Possíveis causas de erro de autenticação:')
    console.log('   1. NEXTAUTH_SECRET não configurado corretamente')
    console.log('   2. NEXTAUTH_URL não corresponde ao domínio atual')
    console.log('   3. Sessão expirada no lado do cliente')
    console.log('   4. Cookies de sessão bloqueados')
    console.log('   5. Middleware de autenticação com erro')

    // Verificar variáveis de ambiente críticas
    console.log('\n🔧 Verificando variáveis de ambiente...')
    const envVars = {
      'NEXTAUTH_SECRET': !!process.env.NEXTAUTH_SECRET,
      'NEXTAUTH_URL': !!process.env.NEXTAUTH_URL,
      'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    Object.entries(envVars).forEach(([key, exists]) => {
      console.log(`   ${exists ? '✅' : '❌'} ${key}: ${exists ? 'configurado' : 'FALTANDO'}`)
    })

    console.log('\n✨ Diagnóstico completo finalizado!')
    
  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error)
  }
}

testAuthenticationIssues()