import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Admin client não configurado',
        hasAdmin: false 
      }, { status: 500 })
    }

    console.log('🔄 Testando conectividade com Supabase...')
    
    const results: any = {
      hasAdmin: true,
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Teste 1: Contar usuários
    try {
      const { count: userCount, error: userError } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })

      results.tests.users = {
        success: !userError,
        count: userCount || 0,
        error: userError?.message || null
      }
      
      console.log('👥 Users:', results.tests.users)
    } catch (error: any) {
      results.tests.users = { success: false, error: error.message }
      console.error('❌ Erro ao testar users:', error)
    }

    // Teste 2: Contar relatórios
    try {
      const { count: reportCount, error: reportError } = await supabaseAdmin
        .from('reports')
        .select('id', { count: 'exact', head: true })

      results.tests.reports = {
        success: !reportError,
        count: reportCount || 0,
        error: reportError?.message || null
      }
      
      console.log('📊 Reports:', results.tests.reports)
    } catch (error: any) {
      results.tests.reports = { success: false, error: error.message }
      console.error('❌ Erro ao testar reports:', error)
    }

    // Teste 3: Contar itens de relatórios
    try {
      const { count: itemCount, error: itemError } = await supabaseAdmin
        .from('report_items')
        .select('id', { count: 'exact', head: true })

      results.tests.reportItems = {
        success: !itemError,
        count: itemCount || 0,
        error: itemError?.message || null
      }
      
      console.log('📝 Report Items:', results.tests.reportItems)
    } catch (error: any) {
      results.tests.reportItems = { success: false, error: error.message }
      console.error('❌ Erro ao testar report_items:', error)
    }

    // Teste 4: Verificar last_processing
    try {
      const { data: lastProcessing, error: lastError } = await supabaseAdmin
        .from('last_processing')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      results.tests.lastProcessing = {
        success: !lastError,
        hasData: !!lastProcessing,
        latestDate: (lastProcessing as any)?.report_date || null,
        error: lastError?.message || null
      }
      
      console.log('📋 Last Processing:', results.tests.lastProcessing)
    } catch (error: any) {
      results.tests.lastProcessing = { success: false, error: error.message }
      console.error('❌ Erro ao testar last_processing:', error)
    }

    console.log('✅ Teste de conectividade concluído')

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error: any) {
    console.error('❌ Erro geral no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      hasAdmin: !!supabaseAdmin
    }, { status: 500 })
  }
}