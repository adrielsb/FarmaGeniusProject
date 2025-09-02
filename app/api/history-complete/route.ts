
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Buscar relatórios com paginação
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }

    let reportsQuery = supabaseAdmin
      .from('reports')
      .select(`
        *,
        users!inner(name, email)
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (startDate) {
      reportsQuery = reportsQuery.gte('created_at', new Date(startDate).toISOString())
    }
    if (endDate) {
      reportsQuery = reportsQuery.lte('created_at', new Date(endDate).toISOString())
    }

    const { data: reports, error: reportsError } = await reportsQuery

    if (reportsError) {
      console.error('Erro ao buscar relatórios:', reportsError)
      return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 })
    }

    // Buscar observações correspondentes
    const dates = (reports || []).map(report => (report as any).date)
    let observations: any[] = []
    
    if (dates.length > 0) {
      const { data: observationsData, error: observationsError } = await supabaseAdmin
        .from('daily_observations')
        .select(`
          *,
          users!inner(name, email)
        `)
        .in('date', dates)

      if (observationsError) {
        console.warn('Erro ao buscar observações:', observationsError)
        // Continua sem observações se houver erro
      } else {
        observations = observationsData || []
      }
    }

    // Mapear observações por data
    const observationsByDate = observations.reduce((acc, obs) => {
      acc[obs.date] = obs
      return acc
    }, {} as Record<string, any>)

    // TODO: For accurate total metrics, a separate, more efficient query or a database function would be needed.
    // For now, we'll calculate the metrics from the paginated data to avoid a second full query.
    const totalMetrics = (reports || []).reduce((acc, report) => {
      acc._sum.totalQuantity += Number((report as any).total_quantity) || 0
      acc._sum.totalValue += Number((report as any).total_value) || 0
      acc._sum.solidCount += Number((report as any).solid_count) || 0
      acc._count.id++
      return acc
    }, {
      _sum: {
        totalQuantity: 0,
        totalValue: 0,
        solidCount: 0
      },
      _count: {
        id: 0
      }
    })

    // Montar resposta com dados combinados
    const historyData = (reports || []).map(report => ({
      ...(report as any),
      observation: observationsByDate[(report as any).date] || null
    }))

    return NextResponse.json({
      success: true,
      data: {
        reports: historyData,
        pagination: {
          total: totalMetrics._count.id || 0, // This is the count of the current page, not the total.
          limit,
          offset,
          hasMore: (reports || []).length === limit
        },
        metrics: {
          totalReports: totalMetrics._count.id || 0,
          cumulativeQuantity: totalMetrics._sum.totalQuantity || 0,
          cumulativeValue: totalMetrics._sum.totalValue || 0,
          cumulativeSolids: totalMetrics._sum.solidCount || 0,
          averageValue: totalMetrics._count.id ? 
            (totalMetrics._sum.totalValue || 0) / totalMetrics._count.id : 0
        }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar histórico completo:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// POST - Buscar dados específicos de um relatório
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId } = body

    if (!reportId) {
      return NextResponse.json({ 
        error: 'ID do relatório é obrigatório' 
      }, { status: 400 })
    }

    // Buscar relatório específico com todos os dados
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }

    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        users!inner(name, email),
        report_items(*, row_index)
      `)
      .eq('id', reportId)
      .eq('user_id', session.user.id)
      .single()

    if (reportError) {
      console.error('Erro ao buscar relatório específico:', reportError)
      return NextResponse.json({ 
        error: 'Erro ao buscar relatório' 
      }, { status: 500 })
    }

    if (!report) {
      return NextResponse.json({ 
        error: 'Relatório não encontrado' 
      }, { status: 404 })
    }

    // Buscar observação do dia
    const { data: observation, error: obsError } = await supabaseAdmin
      .from('daily_observations')
      .select(`
        *,
        users!inner(name, email)
      `)
      .eq('date', (report as any).date)
      .single()

    // Observações são opcionais, então não retornamos erro se não encontrar
    if (obsError && obsError.code !== 'PGRST116') {
      console.warn('Erro ao buscar observação:', obsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
        observation
      }
    })

  } catch (error) {
    console.error('Erro ao buscar relatório específico:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
