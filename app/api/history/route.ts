
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Removida verificação de autenticação - qualquer um pode ver histórico
    // if (!session?.user || !session.user.id) {
    //   return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    // }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100') // Aumentar limite padrão
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') // 'today', 'week', 'month', 'all'
    const startDay = parseInt(searchParams.get('startDay') || '0')
    const endDay = parseInt(searchParams.get('endDay') || '0')
    const month = searchParams.get('month') // Para filtro por dias de um mês específico

    // Construir query com filtros
    let query = supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        date,
        status,
        created_at,
        total_quantity,
        total_value,
        top_seller
      `)

    // Aplicar filtros de data baseados na data do relatório (DD/MM)
    if (startDate && endDate) {
      // Filtro por range de datas específico - converter para formato DD/MM
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      const startDateStr = `${String(startDateObj.getDate()).padStart(2, '0')}/${String(startDateObj.getMonth() + 1).padStart(2, '0')}`
      const endDateStr = `${String(endDateObj.getDate()).padStart(2, '0')}/${String(endDateObj.getMonth() + 1).padStart(2, '0')}`
      
      // Para range de datas, vamos filtrar no backend usando SQL LIKE ou no frontend
      // Por enquanto, vamos buscar todos e filtrar no frontend
    } else if (period) {
      // Filtros predefinidos baseados na data do relatório
      const today = new Date()
      
      switch (period) {
        case 'today':
          const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`
          query = query.eq('date', todayStr)
          break
        case 'week':
          // Para semana, buscar todas e filtrar no frontend
          break
        case 'month':
          // Para mês atual, filtrar por mês no formato MM
          const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
          query = query.like('date', `%/${currentMonth}`)
          break
        case 'all':
          // Sem filtro de data
          break
        default:
          // Padrão: mês atual
          const defaultMonth = String(today.getMonth() + 1).padStart(2, '0')
          query = query.like('date', `%/${defaultMonth}`)
          break
      }
    } else {
      // Filtro padrão: mês atual
      const today = new Date()
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
      query = query.like('date', `%/${currentMonth}`)
    }

    const { data: reportsData, error: reportsError } = await query
      .order('created_at', { ascending: false }) // Ordenar por data de criação primeiro, depois ajustamos no frontend

    if (reportsError) {
      console.error("Erro ao buscar relatórios:", reportsError)
      return NextResponse.json({ 
        error: "Erro ao buscar relatórios: " + reportsError.message 
      }, { status: 500 })
    }

    // Mapear campos de snake_case para camelCase para o frontend
    let reports = reportsData?.map(report => ({
      id: (report as any).id,
      title: (report as any).title,
      date: (report as any).date,
      status: (report as any).status,
      createdAt: (report as any).created_at,
      totalQuantity: (report as any).total_quantity,
      totalValue: (report as any).total_value,
      topSeller: (report as any).top_seller,
      formulasProcessed: (report as any).total_quantity // formulasProcessed é o mesmo que totalQuantity
    })) || []

    // Aplicar filtros adicionais no backend para casos complexos
    if (startDay > 0 && endDay > 0) {
      // Filtro por range de dias (ex: dia 1 ao 15)
      const filterMonth = month || String(new Date().getMonth() + 1).padStart(2, '0') // Padrão mês atual se não especificado
      
      reports = reports.filter(report => {
        const [day, reportMonth] = report.date.split('/').map(Number)
        const filterMonthNum = parseInt(filterMonth)
        
        // Verificar se é do mês correto e se o dia está no range
        return reportMonth === filterMonthNum && day >= startDay && day <= endDay
      })
    } else if (startDate && endDate) {
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      const startDateStr = `${String(startDateObj.getDate()).padStart(2, '0')}/${String(startDateObj.getMonth() + 1).padStart(2, '0')}`
      const endDateStr = `${String(endDateObj.getDate()).padStart(2, '0')}/${String(endDateObj.getMonth() + 1).padStart(2, '0')}`
      
      reports = reports.filter(report => {
        // Converter data do relatório para comparação
        const [day, month] = report.date.split('/').map(Number)
        const [startDay, startMonth] = startDateStr.split('/').map(Number)
        const [endDay, endMonth] = endDateStr.split('/').map(Number)
        
        // Comparar mês primeiro, depois dia
        if (month < startMonth || month > endMonth) return false
        if (month === startMonth && day < startDay) return false
        if (month === endMonth && day > endDay) return false
        
        return true
      })
    } else if (period === 'week') {
      // Filtro de semana: últimos 7 dias baseado na data do relatório
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      
      reports = reports.filter(report => {
        const [day, month] = report.date.split('/').map(Number)
        const reportDate = new Date(today.getFullYear(), month - 1, day)
        return reportDate >= weekAgo && reportDate <= today
      })
    }

    // Aplicar paginação após filtros
    const paginatedReports = reports.slice(offset, offset + limit)

    const filterInfo = startDay > 0 && endDay > 0 ? 
      `dias ${startDay}-${endDay}/${month || '07'}` : 
      (period || 'custom')
    
    console.log(`✅ Histórico filtrado: ${paginatedReports.length} de ${reports.length} relatórios (filtro: ${filterInfo}) *o historico pode ser visualizado por todos os usuarios*`)

    return NextResponse.json({ 
      success: true,
      reports: paginatedReports,
      pagination: {
        limit,
        offset,
        total: reports.length,
        hasMore: (offset + limit) < reports.length
      }
    })
  } catch (error: any) {
    console.error("Error fetching history:", error)
    return NextResponse.json({ 
      error: "Erro ao buscar histórico: " + error.message 
    }, { status: 500 })
  }
}
