import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProcessingHistoryItem, LastProcessingItem } from '@/lib/types'

export async function GET(request: NextRequest) {
  console.log('🔍 Iniciando teste de banco de dados...')
  
  try {
    const results = {
      supabaseAdmin: !!supabaseAdmin,
      tests: [] as any[],
      timestamp: new Date().toISOString()
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'supabaseAdmin não configurado',
        results
      }, { status: 500 })
    }

    // Teste 1: Verificar processing_history
    console.log('📊 Testando processing_history...')
    try {
      const { data: historyData, error: historyError, count: historyCount } = await supabaseAdmin
        .from('processing_history')
        .select('*', { count: 'exact' })
        .limit(2)

      if (historyError) {
        console.error('❌ Erro em processing_history:', historyError)
        results.tests.push({
          table: 'processing_history',
          status: 'error',
          error: historyError.message,
          code: historyError.code,
          details: historyError.details
        })
      } else {
        console.log(`✅ processing_history: ${historyCount} registros`)
        const typedHistoryData = historyData as ProcessingHistoryItem[]
        results.tests.push({
          table: 'processing_history',
          status: 'success',
          count: historyCount,
          hasData: (typedHistoryData?.length || 0) > 0,
          sample: typedHistoryData?.[0] ? {
            id: typedHistoryData[0].id,
            form_norm: typedHistoryData[0].form_norm,
            quantidade: typedHistoryData[0].quantidade,
            created_at: typedHistoryData[0].created_at
          } : null
        })
      }
    } catch (e: any) {
      console.error('❌ Exceção em processing_history:', e)
      results.tests.push({
        table: 'processing_history',
        status: 'exception',
        error: e.message
      })
    }

    // Teste 2: Verificar users
    console.log('👤 Testando users...')
    try {
      const { data: usersData, error: usersError, count: usersCount } = await supabaseAdmin
        .from('users')
        .select('id, name', { count: 'exact' })
        .limit(2)

      if (usersError) {
        console.error('❌ Erro em users:', usersError)
        results.tests.push({
          table: 'users',
          status: 'error',
          error: usersError.message,
          code: usersError.code
        })
      } else {
        console.log(`✅ users: ${usersCount} registros`)
        results.tests.push({
          table: 'users',
          status: 'success',
          count: usersCount,
          hasData: (usersData?.length || 0) > 0
        })
      }
    } catch (e: any) {
      console.error('❌ Exceção em users:', e)
      results.tests.push({
        table: 'users',
        status: 'exception',
        error: e.message
      })
    }

    // Teste 3: Verificar reports
    console.log('📋 Testando reports...')
    try {
      const { data: reportsData, error: reportsError, count: reportsCount } = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact' })
        .limit(2)

      if (reportsError) {
        console.error('❌ Erro em reports:', reportsError)
        results.tests.push({
          table: 'reports',
          status: 'error',
          error: reportsError.message,
          code: reportsError.code
        })
      } else {
        console.log(`✅ reports: ${reportsCount} registros`)
        results.tests.push({
          table: 'reports',
          status: 'success',
          count: reportsCount,
          hasData: (reportsData?.length || 0) > 0
        })
      }
    } catch (e: any) {
      console.error('❌ Exceção em reports:', e)
      results.tests.push({
        table: 'reports',
        status: 'exception',
        error: e.message
      })
    }

    // Teste 4: Verificar user_settings
    console.log('⚙️ Testando user_settings...')
    try {
      const { data: settingsData, error: settingsError, count: settingsCount } = await supabaseAdmin
        .from('user_settings')
        .select('*', { count: 'exact' })
        .limit(2)

      if (settingsError) {
        console.error('❌ Erro em user_settings:', settingsError)
        results.tests.push({
          table: 'user_settings',
          status: 'error',
          error: settingsError.message,
          code: settingsError.code,
          details: settingsError.details
        })
      } else {
        console.log(`✅ user_settings: ${settingsCount} registros`)
        results.tests.push({
          table: 'user_settings',
          status: 'success',
          count: settingsCount,
          hasData: (settingsData?.length || 0) > 0,
          columns: settingsData?.[0] ? Object.keys(settingsData[0]) : []
        })
      }
    } catch (e: any) {
      console.error('❌ Exceção em user_settings:', e)
      results.tests.push({
        table: 'user_settings',
        status: 'exception',
        error: e.message
      })
    }

    // Teste 5: Verificar last_processing
    console.log('⚡ Testando last_processing...')
    try {
      const { data: lastData, error: lastError, count: lastCount } = await supabaseAdmin
        .from('last_processing')
        .select('*', { count: 'exact' })
        .limit(2)

      if (lastError) {
        console.error('❌ Erro em last_processing:', lastError)
        results.tests.push({
          table: 'last_processing',
          status: 'error',
          error: lastError.message,
          code: lastError.code
        })
      } else {
        console.log(`✅ last_processing: ${lastCount} registros`)
        const typedLastData = lastData as LastProcessingItem[]
        results.tests.push({
          table: 'last_processing',
          status: 'success',
          count: lastCount,
          hasData: (typedLastData?.length || 0) > 0,
          sample: typedLastData?.[0] ? {
            report_date: typedLastData[0].report_date,
            total_quantity: typedLastData[0].total_quantity,
            processed_at: typedLastData[0].processed_at
          } : null
        })
      }
    } catch (e: any) {
      console.error('❌ Exceção em last_processing:', e)
      results.tests.push({
        table: 'last_processing',
        status: 'exception',
        error: e.message
      })
    }

    console.log('✅ Teste de banco concluído!')
    
    return NextResponse.json({
      success: true,
      message: 'Teste de banco concluído com sucesso',
      ...results
    })

  } catch (error: any) {
    console.error('❌ Erro geral no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}