import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, getConnectionInfo } from '@/lib/supabase'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const connectionInfo = getConnectionInfo()
    
    // Testes de conectividade
    const tests = {
      connectionInfo,
      hasAdmin: !!supabaseAdmin,
      tests: {} as any
    }

    // Teste 1: Verificar se consegue listar usuários
    try {
      const { data: users, error: usersError } = await supabaseAdmin!
        .from('users')
        .select('id, name, email')
        .limit(5)
      
      tests.tests.users = {
        success: !usersError,
        count: users?.length || 0,
        error: usersError?.message || null
      }
    } catch (error: any) {
      tests.tests.users = {
        success: false,
        error: error.message
      }
    }

    // Teste 2: Verificar se consegue listar relatórios
    try {
      const { data: reports, error: reportsError } = await supabaseAdmin!
        .from('reports')
        .select('id, title, date, status, created_at')
        .limit(5)
      
      tests.tests.reports = {
        success: !reportsError,
        count: reports?.length || 0,
        error: reportsError?.message || null
      }
    } catch (error: any) {
      tests.tests.reports = {
        success: false,
        error: error.message
      }
    }

    // Teste 3: Verificar report_items
    try {
      const { data: reportItems, error: itemsError } = await supabaseAdmin!
        .from('report_items')
        .select('id, report_id, form_norm, vendedor')
        .limit(5)
      
      tests.tests.reportItems = {
        success: !itemsError,
        count: reportItems?.length || 0,
        error: itemsError?.message || null
      }
    } catch (error: any) {
      tests.tests.reportItems = {
        success: false,
        error: error.message
      }
    }

    // Teste 4: Verificar last_processing
    try {
      const { data: lastProcessing, error: lastProcessingError } = await supabaseAdmin!
        .from('last_processing')
        .select('*')
        .limit(5)
      
      tests.tests.lastProcessing = {
        success: !lastProcessingError,
        count: lastProcessing?.length || 0,
        error: lastProcessingError?.message || null,
        latestRecord: lastProcessing?.[0] || null
      }
    } catch (error: any) {
      tests.tests.lastProcessing = {
        success: false,
        error: error.message
      }
    }

    // Teste 5: Verificar se consegue fazer um insert simples
    try {
      const testData = {
        id: `test-${Date.now()}`,
        name: 'Test User',
        email: `test-${Date.now()}@test.com`,
        created_at: new Date().toISOString()
      }

      const { data: insertResult, error: insertError } = await (supabaseAdmin! as any)
        .from('users')
        .insert(testData)
        .select()
        .single()

      if (!insertError && insertResult) {
        // Remove o registro de teste imediatamente
        await supabaseAdmin!
          .from('users')
          .delete()
          .eq('id', testData.id)
      }

      tests.tests.insertTest = {
        success: !insertError,
        error: insertError?.message || null
      }
    } catch (error: any) {
      tests.tests.insertTest = {
        success: false,
        error: error.message
      }
    }

    return NextResponse.json({
      success: true,
      data: tests
    })

  } catch (error: any) {
    console.error('Erro ao testar banco:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 })
  }
}