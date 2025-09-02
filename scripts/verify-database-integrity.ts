import { supabaseAdmin } from '../lib/supabase'

async function verifyDatabaseIntegrity() {
  console.log('🔍 Verificando integridade do banco de dados...')
  console.log('=' .repeat(50))

  if (!supabaseAdmin) {
    console.error('❌ Erro: supabaseAdmin não inicializado')
    return
  }

  try {
    // 1. Verificar estrutura das tabelas principais
    console.log('\n📋 1. ESTRUTURA DAS TABELAS')
    console.log('-'.repeat(30))
    
    const tables = [
      'users',
      'reports', 
      'report_items',
      'user_settings',
      'last_processing'
    ]

    for (const table of tables) {
      try {
        const { data, error, count } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error(`❌ Erro na tabela ${table}:`, error.message)
        } else {
          console.log(`✅ Tabela ${table}: ${count || 0} registros`)
        }
      } catch (err) {
        console.error(`❌ Erro ao verificar tabela ${table}:`, err)
      }
    }

    // 2. Verificar dados do usuário de teste
    console.log('\n👤 2. DADOS DO USUÁRIO')
    console.log('-'.repeat(30))
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message)
    } else {
      console.log(`✅ Usuários encontrados: ${users?.length || 0}`)
      users?.forEach(user => {
        console.log(`   - ID: ${user.id}`)
        console.log(`   - Name: ${user.name}`) 
        console.log(`   - Email: ${user.email}`)
        console.log()
      })
    }

    // 3. Verificar relatórios e itens
    console.log('\n📊 3. RELATÓRIOS E ITENS')
    console.log('-'.repeat(30))

    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        date,
        status,
        total_quantity,
        total_value,
        top_seller,
        user_id,
        created_at,
        report_items(count)
      `)
      .limit(10)

    if (reportsError) {
      console.error('❌ Erro ao buscar relatórios:', reportsError.message)
    } else {
      console.log(`✅ Relatórios encontrados: ${reports?.length || 0}`)
      reports?.forEach(report => {
        console.log(`   - ID: ${report.id}`)
        console.log(`   - Título: ${report.title}`)
        console.log(`   - Data: ${report.date}`)
        console.log(`   - Status: ${report.status}`)
        console.log(`   - Valor Total: R$ ${report.total_value}`)
        console.log(`   - Quantidade Total: ${report.total_quantity}`)
        console.log(`   - Top Seller: ${report.top_seller}`)
        console.log(`   - Itens: ${(report as any).report_items?.[0]?.count || 0}`)
        console.log()
      })
    }

    // 4. Verificar configurações de usuário (métricas)
    console.log('\n⚙️ 4. CONFIGURAÇÕES DE USUÁRIO')
    console.log('-'.repeat(30))

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')

    if (settingsError) {
      console.error('❌ Erro ao buscar configurações:', settingsError.message)
    } else {
      console.log(`✅ Configurações encontradas: ${settings?.length || 0}`)
      settings?.forEach(setting => {
        console.log(`   - User ID: ${setting.user_id}`)
        console.log(`   - Key: ${setting.setting_key}`)
        console.log(`   - Value: ${setting.setting_value?.substring(0, 100)}...`)
        console.log()
      })
    }

    // 5. Verificar último processamento
    console.log('\n🔄 5. ÚLTIMO PROCESSAMENTO')
    console.log('-'.repeat(30))

    const { data: lastProcessing, error: lastError } = await supabaseAdmin
      .from('last_processing')
      .select('*')

    if (lastError) {
      console.error('❌ Erro ao buscar último processamento:', lastError.message)
    } else {
      console.log(`✅ Registros de processamento: ${lastProcessing?.length || 0}`)
      lastProcessing?.forEach(proc => {
        console.log(`   - User ID: ${proc.user_id}`)
        console.log(`   - Report Date: ${proc.report_date}`)
        console.log(`   - Report ID: ${proc.report_id}`)
        console.log(`   - Total Value: R$ ${proc.total_value}`)
        console.log(`   - Total Quantity: ${proc.total_quantity}`)
        console.log(`   - Processed At: ${proc.processed_at}`)
        console.log()
      })
    }

    // 6. Verificar relacionamentos
    console.log('\n🔗 6. RELACIONAMENTOS')
    console.log('-'.repeat(30))

    // Verificar se todos os reports têm user válido
    const { data: orphanReports, error: orphanError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        user_id,
        users!inner(id, name)
      `)
      .limit(5)

    if (orphanError) {
      console.error('❌ Erro ao verificar relacionamentos:', orphanError.message)
    } else {
      console.log(`✅ Relatórios com usuários válidos: ${orphanReports?.length || 0}`)
    }

    // Verificar se todos os report_items têm report válido
    const { data: orphanItems, error: itemsError } = await supabaseAdmin
      .from('report_items')
      .select(`
        id,
        report_id,
        reports!inner(id, title)
      `)
      .limit(5)

    if (itemsError) {
      console.error('❌ Erro ao verificar itens órfãos:', itemsError.message)
    } else {
      console.log(`✅ Itens com relatórios válidos: ${orphanItems?.length || 0}`)
    }

    // 7. Teste de operações CRUD
    console.log('\n✍️ 7. TESTE DE OPERAÇÕES CRUD')
    console.log('-'.repeat(30))

    // Teste de inserção/atualização/remoção em user_settings
    const testUserId = users?.[0]?.id
    if (testUserId) {
      // Teste INSERT
      const testSetting = {
        user_id: testUserId,
        setting_key: 'test_verify_db',
        setting_value: JSON.stringify({ 
          test: true, 
          timestamp: new Date().toISOString() 
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: insertError } = await supabaseAdmin
        .from('user_settings')
        .insert(testSetting)

      if (insertError) {
        console.error('❌ Erro no teste INSERT:', insertError.message)
      } else {
        console.log('✅ Teste INSERT bem-sucedido')

        // Teste UPDATE
        const { error: updateError } = await supabaseAdmin
          .from('user_settings')
          .update({ 
            setting_value: JSON.stringify({ 
              test: true, 
              updated: true,
              timestamp: new Date().toISOString() 
            }),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', testUserId)
          .eq('setting_key', 'test_verify_db')

        if (updateError) {
          console.error('❌ Erro no teste UPDATE:', updateError.message)
        } else {
          console.log('✅ Teste UPDATE bem-sucedido')
        }

        // Teste DELETE
        const { error: deleteError } = await supabaseAdmin
          .from('user_settings')
          .delete()
          .eq('user_id', testUserId)
          .eq('setting_key', 'test_verify_db')

        if (deleteError) {
          console.error('❌ Erro no teste DELETE:', deleteError.message)
        } else {
          console.log('✅ Teste DELETE bem-sucedido')
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Verificação de integridade concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
  }
}

// Executar verificação se chamado diretamente
if (require.main === module) {
  verifyDatabaseIntegrity()
}

export { verifyDatabaseIntegrity }