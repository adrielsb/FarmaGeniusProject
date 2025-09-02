import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }

    console.log('🔍 Verificando integridade do banco de dados...')
    
    const verification = {
      tables: {},
      userData: {},
      relationships: {},
      crudTest: {},
      timestamp: new Date().toISOString()
    }

    // 1. Verificar estrutura das tabelas
    const tables = ['users', 'reports', 'report_items', 'user_settings', 'last_processing']
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          (verification.tables as any)[table] = { error: error.message, count: 0 }
        } else {
          (verification.tables as any)[table] = { success: true, count: count || 0 }
        }
      } catch (err) {
        (verification.tables as any)[table] = { error: `Erro inesperado: ${err}`, count: 0 }
      }
    }

    // 2. Verificar dados do usuário atual
    console.log('🔍 Verificando usuário ID:', session.user.id)
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário atual:', userError);
      (verification.userData as any).currentUser = { error: userError.message }
    } else {
      console.log('✅ Usuário atual encontrado:', currentUser ? 'SIM' : 'NÃO');
      console.log('📋 Dados do usuário:', currentUser);
      (verification.userData as any).currentUser = {
        success: true,
        id: (currentUser as any).id,
        name: (currentUser as any).name,
        email: (currentUser as any).email
      }
    }

    // 3. Verificar relatórios do usuário
    const { data: userReports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        date,
        status,
        total_quantity,
        total_value,
        top_seller,
        created_at,
        report_items(count)
      `)
      .eq('user_id', session.user.id)
      .limit(5)

    if (reportsError) {
      (verification.userData as any).reports = { error: reportsError.message }
    } else {
      (verification.userData as any).reports = {
        success: true,
        count: userReports?.length || 0,
        data: userReports?.map(report => ({
          id: (report as any).id,
          title: (report as any).title,
          date: (report as any).date,
          status: (report as any).status,
          totalValue: (report as any).total_value,
          totalQuantity: (report as any).total_quantity,
          topSeller: (report as any).top_seller,
          itemsCount: (report as any).report_items?.[0]?.count || 0
        }))
      }
    }

    // 4. Verificar configurações do usuário
    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)

    if (settingsError) {
      (verification.userData as any).settings = { error: settingsError.message }
    } else {
      (verification.userData as any).settings = {
        success: true,
        count: userSettings?.length || 0,
        keys: userSettings?.map(s => (s as any).setting_key) || []
      }
    }

    // 5. Verificar último processamento
    const { data: lastProcessing, error: lastError } = await supabaseAdmin
      .from('last_processing')
      .select('*')
      .eq('user_id', session.user.id)

    if (lastError) {
      (verification.userData as any).lastProcessing = { error: lastError.message }
    } else {
      (verification.userData as any).lastProcessing = {
        success: true,
        count: lastProcessing?.length || 0,
        data: lastProcessing?.map(proc => ({
          reportDate: (proc as any).report_date,
          reportId: (proc as any).report_id,
          totalValue: (proc as any).total_value,
          totalQuantity: (proc as any).total_quantity,
          processedAt: (proc as any).processed_at
        }))
      }
    }

    // 6. Verificar relacionamentos
    // Verificar se todos os reports têm itens
    const { data: reportsWithItems, error: relationError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        report_items(count)
      `)
      .eq('user_id', session.user.id)
      .limit(10)

    if (relationError) {
      (verification as any).relationships = { reportsItems: { error: relationError.message } }
    } else {
      const reportsWithoutItems = reportsWithItems?.filter(r => 
        !(r as any).report_items?.[0]?.count || (r as any).report_items[0].count === 0
      ) || [];
      
      (verification as any).relationships = { reportsItems: {
        success: true,
        totalReports: reportsWithItems?.length || 0,
        reportsWithoutItems: reportsWithoutItems.length,
        orphanedReports: reportsWithoutItems.map(r => ({ id: (r as any).id, title: (r as any).title }))
      }};
    }

    // 7. Teste CRUD básico
    const testSetting = {
      user_id: session.user.id,
      setting_key: 'test_db_verification',
      setting_value: JSON.stringify({ 
        test: true, 
        timestamp: new Date().toISOString() 
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Teste INSERT
    console.log('🔧 Iniciando teste CRUD - INSERT...')
    const { error: insertError } = await (supabaseAdmin as any)
      .from('user_settings')
      .insert(testSetting)

    if (insertError) {
      console.error('❌ Erro no teste INSERT:', insertError);
      (verification.crudTest as any).insert = { error: insertError.message }
    } else {
      console.log('✅ Teste INSERT bem-sucedido');
      (verification.crudTest as any).insert = { success: true };

      // Teste UPDATE
      console.log('🔧 Iniciando teste UPDATE...');
      const { error: updateError } = await (supabaseAdmin as any)
        .from('user_settings')
        .update({ 
          setting_value: JSON.stringify({ 
            test: true, 
            updated: true,
            timestamp: new Date().toISOString() 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .eq('setting_key', 'test_db_verification');

      if (updateError) {
        console.error('❌ Erro no teste UPDATE:', updateError);
        (verification.crudTest as any).update = { error: updateError.message }
      } else {
        console.log('✅ Teste UPDATE bem-sucedido');
        (verification.crudTest as any).update = { success: true }
      }

      // Teste DELETE
      console.log('🔧 Iniciando teste DELETE...');
      const { error: deleteError } = await supabaseAdmin
        .from('user_settings')
        .delete()
        .eq('user_id', session.user.id)
        .eq('setting_key', 'test_db_verification');

      if (deleteError) {
        console.error('❌ Erro no teste DELETE:', deleteError);
        (verification.crudTest as any).delete = { error: deleteError.message }
      } else {
        console.log('✅ Teste DELETE bem-sucedido');
        (verification.crudTest as any).delete = { success: true }
      }
    }

    // Resumo final
    console.log('📊 Resumo da verificação:')
    const tablesOk = Object.values(verification.tables).every((t: any) => t.success);
    console.log('- Tabelas OK:', tablesOk)
    
    const userDataOk = (verification.userData as any).currentUser?.success && 
                      !(verification.userData as any).reports?.error &&
                      !(verification.userData as any).settings?.error &&
                      !(verification.userData as any).lastProcessing?.error;
    console.log('- User Data OK:', userDataOk)
    console.log('  - currentUser.success:', (verification.userData as any).currentUser?.success);
    console.log('  - reports.error:', (verification.userData as any).reports?.error);
    console.log('  - settings.error:', (verification.userData as any).settings?.error);
    console.log('  - lastProcessing.error:', (verification.userData as any).lastProcessing?.error);
    
    const relationshipsOk = (verification as any).relationships?.reportsItems?.success;
    console.log('- Relationships OK:', relationshipsOk)
    
    const crudOk = (verification.crudTest as any).insert?.success && 
                   (verification.crudTest as any).update?.success && 
                   (verification.crudTest as any).delete?.success;
    console.log('- CRUD OK:', crudOk);
    console.log('  - insert.success:', (verification.crudTest as any).insert?.success);
    console.log('  - update.success:', (verification.crudTest as any).update?.success);
    console.log('  - delete.success:', (verification.crudTest as any).delete?.success);

    const summary = {
      tablesOk,
      userDataOk,
      relationshipsOk,
      crudOk,
      allOk: tablesOk && userDataOk && relationshipsOk && crudOk
    };

    (verification as any).summary = summary;

    console.log('✅ Verificação concluída:', (verification as any).summary);

    return NextResponse.json({
      success: true,
      verification,
      message: (verification as any).summary.allOk ? 
        'Banco de dados íntegro e funcionando corretamente' :
        'Foram encontrados alguns problemas - veja os detalhes'
    })

  } catch (error) {
    console.error('Erro durante verificação:', error)
    return NextResponse.json({ 
      error: 'Erro interno durante verificação',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}