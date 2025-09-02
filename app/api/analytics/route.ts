
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { CacheService } from '@/lib/cache'

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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // dias
    const analysisType = searchParams.get('type') || 'all'

    // Verificar cache primeiro (implementação simplificada por enquanto)
    // const cachedData = await CacheService.getAnalytics(session.user.id as string, period)
    // if (cachedData) {
    //   return NextResponse.json(cachedData)
    // }

    // Data de referência para análises
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Buscar relatórios do período usando Supabase
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        date,
        status,
        created_at,
        total_quantity,
        total_value,
        top_seller,
        user_id,
        report_items (
          id,
          form_norm,
          horario,
          vendedor,
          quantidade,
          valor,
          categoria,
          source_file
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (reportsError) {
      console.error('Erro ao buscar relatórios:', reportsError)
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    // Buscar todos os relatórios para comparações históricas
    const { data: allReports, error: allReportsError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        title,
        date,
        status,
        created_at,
        total_quantity,
        total_value,
        top_seller,
        user_id,
        report_items (
          id,
          form_norm,
          horario,
          vendedor,
          quantidade,
          valor,
          categoria,
          source_file
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    if (allReportsError) {
      console.error('Erro ao buscar todos os relatórios:', allReportsError)
      return NextResponse.json({ error: 'Erro ao buscar dados históricos' }, { status: 500 })
    }

    // Se não há dados suficientes, retornar vazio
    const useRealData = reports && reports.length > 0
    
    if (!useRealData) {
      console.log('Nenhum relatório encontrado')
      return NextResponse.json({
        success: false,
        data: null,
        period: {
          days: parseInt(period),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalReports: 0,
          totalHistoricalReports: allReports?.length || 0
        },
        message: 'Nenhum relatório encontrado para análise'
      })
    }
    
    console.log(`Processando ${reports.length} relatórios do período atual e ${allReports?.length || 0} históricos`)

    const analytics = {
      // 1. ANÁLISES DE TENDÊNCIAS
      trends: calculateTrends(reports, allReports),
      
      // 2. ANÁLISES DE VENDEDORES
      sellers: calculateSellerAnalytics(reports, allReports),
      
      // 3. ANÁLISES TEMPORAIS
      temporal: calculateTemporalAnalytics(reports),
      
      // 4. ANÁLISES FINANCEIRAS
      financial: calculateFinancialAnalytics(reports, allReports),
      
      // 5. INSIGHTS E ALERTAS
      insights: calculateInsights(reports, allReports),
      
      // 6. MÉTRICAS GERAIS
      summary: calculateSummaryMetrics(reports, allReports),
      
      // 7. COMPARATIVOS
      comparisons: calculateComparisons(reports, allReports)
    }

    const response = {
      success: true,
      data: analytics,
      period: {
        days: parseInt(period),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalReports: reports.length,
        totalHistoricalReports: allReports.length
      }
    }

    // Salvar no cache (implementação simplificada por enquanto)
    // await CacheService.setAnalytics(session.user.id as string, period, response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// Função para calcular tendências
function calculateTrends(currentReports: any[], allReports: any[]) {
  // Categorias farmacêuticas (baseado no mapeamento original)
  const categories = [
    'LÍQUIDOS', 'CREMES E POMADAS', 'COMPRIMIDOS', 'CÁPSULAS',
    'GOTAS', 'XAROPES', 'INJETÁVEIS', 'COMPRIMIDOS EFERVESCENTES',
    'SACHÊS', 'COMPRIMIDOS MASTIGÁVEIS', 'PÍLULAS', 'DRÁGEAS',
    'AMPOLAS', 'SUPOSITÓRIOS', 'ADESIVOS', 'SPRAYS',
    'INALADORES', 'OUTROS'
  ]

  // Tendências por categoria ao longo do tempo
  const categoryTrends = categories.map(category => {
    const reportsByDate = currentReports.map(report => ({
      date: report.date,
      quantity: report.report_items?.filter((item: any) => 
        item.categoria?.toUpperCase().includes(category) || item.form_norm?.toUpperCase().includes(category)
      ).length || 0,
      value: report.report_items?.filter((item: any) => 
        item.categoria?.toUpperCase().includes(category) || item.form_norm?.toUpperCase().includes(category)
      ).reduce((sum: number, item: any) => sum + (parseFloat(item.valor) || 0), 0) || 0
    }))

    return {
      category,
      data: reportsByDate,
      totalQuantity: reportsByDate.reduce((sum, r) => sum + r.quantity, 0),
      totalValue: reportsByDate.reduce((sum, r) => sum + r.value, 0),
      avgDaily: reportsByDate.length > 0 ? 
        reportsByDate.reduce((sum, r) => sum + r.quantity, 0) / reportsByDate.length : 0
    }
  }).filter(trend => trend.totalQuantity > 0)
  .sort((a, b) => b.totalValue - a.totalValue)

  // Tendência geral de crescimento
  const monthlyGrowth = calculateMonthlyGrowth(allReports)
  
  return {
    categoryTrends: categoryTrends.slice(0, 10), // Top 10 categorias
    monthlyGrowth,
    totalCategories: categoryTrends.length
  }
}

// Função para calcular analytics de vendedores
function calculateSellerAnalytics(currentReports: any[], allReports: any[]) {
  const sellerStats = new Map()

  // Processar dados atuais
  currentReports.forEach(report => {
    report.report_items?.forEach((item: any) => {
      const seller = item.vendedor || 'Não Identificado'
      
      if (!sellerStats.has(seller)) {
        sellerStats.set(seller, {
          name: seller,
          totalQuantity: 0,
          totalValue: 0,
          uniqueDays: new Set(),
          categories: new Map(),
          hourlyDistribution: {},
          efficiency: 0
        })
      }

      const stats = sellerStats.get(seller)
      stats.totalQuantity += parseInt(item.quantidade) || 1
      stats.totalValue += parseFloat(item.valor) || 0
      stats.uniqueDays.add(report.date)
      
      // Distribuição por categoria
      const category = item.categoria || 'Outros'
      stats.categories.set(category, (stats.categories.get(category) || 0) + 1)
      
      // Distribuição por horário
      const hour = item.horario || 'N/A'
      stats.hourlyDistribution[hour] = (stats.hourlyDistribution[hour] || 0) + 1
    })
  })

  // Calcular eficiência e ranking
  const sellerAnalytics = Array.from(sellerStats.values()).map((stats: any) => ({
    ...stats,
    uniqueDays: stats.uniqueDays.size,
    avgValuePerDay: stats.uniqueDays.size > 0 ? stats.totalValue / stats.uniqueDays.size : 0,
    avgQuantityPerDay: stats.uniqueDays.size > 0 ? stats.totalQuantity / stats.uniqueDays.size : 0,
    avgTicket: stats.totalQuantity > 0 ? stats.totalValue / stats.totalQuantity : 0,
    categories: Array.from(stats.categories.entries()).map((entry: any) => ({ 
      category: entry[0], 
      count: entry[1] 
    })).sort((a: any, b: any) => b.count - a.count).slice(0, 5)
  })).sort((a, b) => b.totalValue - a.totalValue)

  // Comparação com período anterior
  const previousPeriodComparison = calculateSellerGrowth(allReports, sellerAnalytics)

  return {
    ranking: sellerAnalytics.slice(0, 10),
    totalSellers: sellerAnalytics.length,
    topPerformer: sellerAnalytics[0] || null,
    growthComparison: previousPeriodComparison
  }
}

// Função para análises temporais
function calculateTemporalAnalytics(reports: any[]) {
  const hourlyStats: Record<string, number> = {}
  const dailyStats: Record<string, number> = {}
  const bucketStats: Record<string, number> = {}

  // Buckets de horário (baseado no código original)
  const buckets = [
    "06:00-07:00", "07:00-08:00", "08:00-09:00", "09:00-10:00",
    "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", 
    "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"
  ]

  reports.forEach(report => {
    const date = new Date(report.created_at)
    const dayOfWeek = date.getDay()
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek]

    report.report_items?.forEach((item: any) => {
      // Análise por horário
      const hour = item.horario || 'N/A'
      hourlyStats[hour] = (hourlyStats[hour] || 0) + (parseInt(item.quantidade) || 1)
      
      // Análise por dia da semana
      dailyStats[dayName] = (dailyStats[dayName] || 0) + (parseInt(item.quantidade) || 1)
      
      // Análise por bucket
      bucketStats[hour] = (bucketStats[hour] || 0) + (parseFloat(item.valor) || 0)
    })
  })

  // Identificar horários de pico
  const sortedHours = Object.entries(hourlyStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 6)

  // Heat map data
  const heatmapData = buckets.map(bucket => ({
    bucket,
    value: bucketStats[bucket] || 0,
    intensity: bucketStats[bucket] ? (bucketStats[bucket] / Math.max(...Object.values(bucketStats) as number[])) : 0
  }))

  return {
    hourlyDistribution: hourlyStats,
    dailyDistribution: dailyStats,
    peakHours: sortedHours,
    heatmapData,
    totalBuckets: buckets.length
  }
}

// Função para análises financeiras
function calculateFinancialAnalytics(currentReports: any[], allReports: any[]) {
  const categoryFinancials = new Map()
  
  // Análise ABC dos produtos
  const productAnalysis = new Map()
  
  currentReports.forEach(report => {
    report.report_items?.forEach((item: any) => {
      const category = item.categoria || 'Outros'
      const product = item.form_norm || 'N/A'
      const value = parseFloat(item.valor) || 0
      const quantity = parseInt(item.quantidade) || 1

      // Por categoria
      if (!categoryFinancials.has(category)) {
        categoryFinancials.set(category, { totalValue: 0, totalQuantity: 0, items: [] })
      }
      const catStats = categoryFinancials.get(category)
      catStats.totalValue += value
      catStats.totalQuantity += quantity
      catStats.items.push({ value, quantity })

      // Por produto
      if (!productAnalysis.has(product)) {
        productAnalysis.set(product, { totalValue: 0, totalQuantity: 0, category })
      }
      const prodStats = productAnalysis.get(product)
      prodStats.totalValue += value
      prodStats.totalQuantity += quantity
    })
  })

  // Calcular análise ABC
  const products = Array.from(productAnalysis.entries())
    .map(([product, stats]) => ({ product, ...stats }))
    .sort((a, b) => b.totalValue - a.totalValue)

  const totalValue = products.reduce((sum, p) => sum + p.totalValue, 0)
  let cumulativeValue = 0
  
  const abcAnalysis = products.map(product => {
    cumulativeValue += product.totalValue
    const cumulativePercent = (cumulativeValue / totalValue) * 100
    
    let classification = 'C'
    if (cumulativePercent <= 80) classification = 'A'
    else if (cumulativePercent <= 95) classification = 'B'

    return {
      ...product,
      valuePercent: (product.totalValue / totalValue) * 100,
      cumulativePercent,
      classification
    }
  })

  // Análise de rentabilidade por categoria
  const categoryRentability = Array.from(categoryFinancials.entries())
    .map(([category, stats]) => ({
      category,
      ...stats,
      avgValue: stats.totalQuantity > 0 ? stats.totalValue / stats.totalQuantity : 0,
      valuePercent: (stats.totalValue / totalValue) * 100
    }))
    .sort((a, b) => b.totalValue - a.totalValue)

  return {
    abcAnalysis: abcAnalysis.slice(0, 20),
    categoryRentability,
    paretoProducts: abcAnalysis.filter(p => p.classification === 'A'),
    totalValue,
    totalProducts: products.length
  }
}

// Função para calcular insights
function calculateInsights(currentReports: any[], allReports: any[]) {
  const insights = []
  const alerts = []
  const recommendations = []

  // Insights automáticos baseados nos dados
  if (currentReports.length > 0) {
    const latestReport = currentReports[currentReports.length - 1]
    const totalValue = currentReports.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0)
    const totalQuantity = currentReports.reduce((sum, r) => sum + (parseInt(r.total_quantity) || 0), 0)
    const avgValue = currentReports.length > 0 ? totalValue / currentReports.length : 0

    insights.push({
      type: 'performance',
      title: 'Performance do Período',
      description: `Total de ${totalQuantity.toLocaleString()} itens processados, gerando R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      value: totalValue,
      trend: 'positive'
    })

    // Detectar anomalias
    if (allReports.length > currentReports.length) {
      const previousPeriod = allReports.slice(-currentReports.length * 2, -currentReports.length)
      const prevAvg = previousPeriod.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0) / previousPeriod.length
      
      if (avgValue > prevAvg * 1.2) {
        alerts.push({
          type: 'positive',
          title: 'Crescimento Significativo',
          description: `Vendas aumentaram ${((avgValue - prevAvg) / prevAvg * 100).toFixed(1)}% comparado ao período anterior`,
          severity: 'success'
        })
      } else if (avgValue < prevAvg * 0.8) {
        alerts.push({
          type: 'negative',
          title: 'Queda nas Vendas',
          description: `Vendas diminuíram ${((prevAvg - avgValue) / prevAvg * 100).toFixed(1)}% comparado ao período anterior`,
          severity: 'warning'
        })
      }
    }

    // Recomendações
    if (latestReport.top_seller) {
      recommendations.push({
        type: 'seller',
        title: 'Top Performer',
        description: `${latestReport.top_seller} está liderando as vendas. Considere estudar suas estratégias.`,
        priority: 'high'
      })
    }
  }

  return {
    insights,
    alerts,
    recommendations,
    summary: {
      totalInsights: insights.length,
      totalAlerts: alerts.length,
      totalRecommendations: recommendations.length
    }
  }
}

// Funções auxiliares
function calculateSummaryMetrics(currentReports: any[], allReports: any[]) {
  const current = {
    totalReports: currentReports.length,
    totalValue: currentReports.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0),
    totalQuantity: currentReports.reduce((sum, r) => sum + (parseInt(r.total_quantity) || 0), 0),
    avgReportValue: 0
  }
  
  current.avgReportValue = current.totalReports > 0 ? current.totalValue / current.totalReports : 0

  const historical = {
    totalReports: allReports.length,
    totalValue: allReports.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0),
    totalQuantity: allReports.reduce((sum, r) => sum + (parseInt(r.total_quantity) || 0), 0),
    avgReportValue: 0
  }
  
  historical.avgReportValue = historical.totalReports > 0 ? historical.totalValue / historical.totalReports : 0

  return { current, historical }
}

function calculateComparisons(currentReports: any[], allReports: any[]) {
  const currentPeriodDays = currentReports.length
  if (allReports.length < currentPeriodDays * 2) {
    return { available: false, message: 'Dados insuficientes para comparação' }
  }

  const previousReports = allReports.slice(-(currentPeriodDays * 2), -currentPeriodDays)
  
  const current = {
    value: currentReports.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0),
    quantity: currentReports.reduce((sum, r) => sum + (parseInt(r.total_quantity) || 0), 0)
  }
  
  const previous = {
    value: previousReports.reduce((sum, r) => sum + (parseFloat(r.total_value) || 0), 0),
    quantity: previousReports.reduce((sum, r) => sum + (parseInt(r.total_quantity) || 0), 0)
  }

  return {
    available: true,
    valueGrowth: previous.value > 0 ? ((current.value - previous.value) / previous.value * 100) : 0,
    quantityGrowth: previous.quantity > 0 ? ((current.quantity - previous.quantity) / previous.quantity * 100) : 0,
    current,
    previous
  }
}

function calculateMonthlyGrowth(allReports: any[]) {
  // Agrupar por mês
  const monthlyData = new Map()
  
  allReports.forEach(report => {
    const date = new Date(report.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { value: 0, quantity: 0, count: 0 })
    }
    
    const monthStats = monthlyData.get(monthKey)
    monthStats.value += parseFloat(report.total_value) || 0
    monthStats.quantity += parseInt(report.total_quantity) || 0
    monthStats.count += 1
  })

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function calculateSellerGrowth(allReports: any[], currentSellers: any[]) {
  // Implementação simplificada - pode ser expandida
  return {
    available: allReports.length > 0,
    topGrower: currentSellers[0]?.name || null,
    avgGrowth: 0
  }
}

