
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔐 Sessão recebida:', session ? 'OK' : 'NENHUMA')
    if (session?.user) {
      console.log('👤 User ID:', session.user.id)
    }
    
    if (!session?.user?.id) {
      console.log('❌ Sessão inválida ou sem user.id')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: "Erro de configuração do servidor" 
      }, { status: 500 })
    }

    // Verificar se o usuário existe
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json({ 
        error: "Usuário não encontrado no banco de dados" 
      }, { status: 401 })
    }

    // Buscar último processamento do usuário atual
    const { data: lastProcessing, error: lastProcessingError } = await supabaseAdmin
      .from('last_processing')
      .select('*')
      .order('processed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    if (lastProcessingError && lastProcessingError.code !== 'PGRST116') {
      console.error('Erro ao buscar último processamento:', lastProcessingError)
    }

    console.log('🔍 Último processamento encontrado:', lastProcessing ? 'SIM' : 'NÃO')
    if (lastProcessing) {
      console.log('📊 Dados:', {
        reportDate: (lastProcessing as any).report_date,
        totalQuantity: (lastProcessing as any).total_quantity,
        totalValue: (lastProcessing as any).total_value,
        processedAt: (lastProcessing as any).processed_at
      })
    }

    return NextResponse.json({
      success: true,
      data: lastProcessing
    })

  } catch (error) {
    console.error('Erro ao buscar último processamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: "Erro de configuração do servidor" 
      }, { status: 500 })
    }

    const body = await request.json()
    const {
      reportDate,
      reportId,
      totalQuantity,
      totalValue,
      solidCount,
      topSeller,
      diarioFileName,
      controleFileName
    } = body

    // Usar a mesma lógica do process-report para evitar constraint violations
    const { data: existingRecord } = await supabaseAdmin
      .from('last_processing')
      .select('id')
      .eq('report_date', reportDate)
      .maybeSingle()

    const lastProcessingData: any = {
      report_date: reportDate,
      report_id: reportId,
      processed_at: new Date().toISOString(),
      total_quantity: totalQuantity,
      total_value: totalValue,
      solid_count: solidCount,
      top_seller: topSeller,
      diario_file_name: diarioFileName,
      controle_file_name: controleFileName,
      updated_at: new Date().toISOString()
    }

    let lastProcessing: any = null
    let upsertError: any = null

    if (existingRecord) {
      // Atualizar registro existente
      const { data, error } = await (supabaseAdmin as any)
        .from('last_processing')
        .update(lastProcessingData)
        .eq('report_date', reportDate)
        .select()
        .single()
      lastProcessing = data
      upsertError = error
    } else {
      // Inserir novo registro
      const { data, error } = await (supabaseAdmin as any)
        .from('last_processing')
        .insert(lastProcessingData)
        .select()
        .single()
      lastProcessing = data
      upsertError = error
    }

    if (upsertError) {
      throw new Error(`Erro ao salvar último processamento: ${upsertError.message}`)
    }

    return NextResponse.json({
      success: true,
      data: lastProcessing
    })

  } catch (error) {
    console.error('Erro ao salvar último processamento:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
