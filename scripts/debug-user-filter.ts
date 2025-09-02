import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

async function debugUserFilter() {
  console.log('🔍 Debug filtro de usuário - Investigando discrepância...\n')

  if (!supabaseAdmin) {
    console.error('❌ supabaseAdmin não configurado')
    return
  }

  // 1. Verificar todos os relatórios e seus user_ids
  console.log('📊 TODOS OS RELATÓRIOS E SEUS USER_IDs:')
  const { data: allReports } = await supabaseAdmin
    .from('reports')
    .select('id, title, date, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const userCounts: Record<string, number> = {}
  allReports?.forEach(report => {
    const userId = report.user_id
    userCounts[userId] = (userCounts[userId] || 0) + 1
    console.log(`📄 ${report.title} | ${report.date} | User: ${userId} | ID: ${report.id.substring(0, 8)}...`)
  })

  console.log('\n👥 CONTAGEM POR USUÁRIO:')
  Object.entries(userCounts).forEach(([userId, count]) => {
    console.log(`   ${userId}: ${count} relatórios`)
  })

  // 2. Verificar quais user_ids existem na tabela users
  console.log('\n👤 USUÁRIOS CADASTRADOS:')
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, name')

  users?.forEach(user => {
    const reportsCount = userCounts[user.id] || 0
    console.log(`   ${user.id} | ${user.email} | ${user.name} | ${reportsCount} relatórios`)
  })

  // 3. Simular o filtro que a API /api/history usa
  console.log('\n🔍 SIMULANDO FILTRO DA API:')
  const testUserId = '7a9d6e31-37f6-4643-b696-570f2ff686e7' // Do log
  
  const { data: filteredReports } = await supabaseAdmin
    .from('reports')
    .select('id, title, date, user_id')
    .eq('user_id', testUserId)
    .order('created_at', { ascending: false })

  console.log(`   Filtro para user_id: ${testUserId}`)
  console.log(`   Relatórios encontrados: ${filteredReports?.length || 0}`)
  
  if (filteredReports && filteredReports.length > 0) {
    filteredReports.forEach((report, index) => {
      console.log(`   ${index + 1}. ${report.title} | ${report.date}`)
    })
  }

  // 4. Verificar se há problema na consulta
  console.log('\n🔍 TESTANDO CONSULTA SEM FILTRO:')
  const { data: noFilterReports } = await supabaseAdmin
    .from('reports')
    .select('id, title, date, user_id')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log(`   Últimos 5 relatórios (sem filtro):`)
  noFilterReports?.forEach((report, index) => {
    console.log(`   ${index + 1}. ${report.title} | User: ${report.user_id}`)
  })

  // 5. Verificar exatamente o que está acontecendo
  console.log('\n💡 DIAGNÓSTICO:')
  const adminUserId = '7a9d6e31-37f6-4643-b696-570f2ff686e7'
  const manipulariumUserId = 'eefe3e43-6a7c-480b-8f94-a8d72fda664c'
  
  const adminReports = userCounts[adminUserId] || 0
  const manipulariumReports = userCounts[manipulariumUserId] || 0
  
  console.log(`   admin@farma.com (${adminUserId}): ${adminReports} relatórios`)
  console.log(`   manipularium@manipularium.com.br (${manipulariumUserId}): ${manipulariumReports} relatórios`)

  if (adminReports === 0 && manipulariumReports > 0) {
    console.log('\n❌ PROBLEMA IDENTIFICADO:')
    console.log('   Os relatórios estão sendo salvos com o user_id do manipularium')
    console.log('   Mas o usuário admin@farma.com está tentando acessá-los')
    console.log('   Solução: Usar a conta manipularium ou corrigir o salvamento')
  } else if (adminReports > 0) {
    console.log('\n✅ Relatórios existem para admin, problema pode ser na API')
  }
}

debugUserFilter()