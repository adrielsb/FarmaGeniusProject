import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

interface ReportData {
  id: string
  title: string
  date: string
  status: string
  created_at: string
  total_quantity: number
  total_value: number
  top_seller: string
  sellers_data?: any[]
  processed_data?: any
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const period = parseInt(searchParams.get('period') || '30') // Padrão: últimos 30 dias

    // Buscar todos os relatórios para análise
    const { data: reportsData, error: reportsError } = await supabaseAdmin
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
        sellers_data,
        processed_data,
        solid_count
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error("Erro ao buscar relatórios:", reportsError)
      return NextResponse.json({ 
        error: "Erro ao buscar relatórios: " + reportsError.message 
      }, { status: 500 })
    }

    const reports = (reportsData || []) as ReportData[]

    if (reports.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Nenhum relatório encontrado para análise"
      })
    }

    // Filtrar relatórios por período baseado na data de criação
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - period)
    
    const recentReports = reports.filter(report => 
      new Date(report.created_at) >= cutoffDate
    )

    // Se não há relatórios recentes, usar todos os disponíveis
    const analysisReports = recentReports.length > 0 ? recentReports : reports

    // Calcular métricas executivas
    const executiveMetrics = calculateExecutiveMetrics(analysisReports, period)

    console.log(`✅ Dashboard executivo gerado com ${analysisReports.length} relatórios (período: ${period} dias)`)

    return NextResponse.json({
      success: true,
      period,
      reportsAnalyzed: analysisReports.length,
      totalReports: reports.length,
      metrics: executiveMetrics,
      lastUpdated: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Erro ao gerar dashboard executivo:", error)
    return NextResponse.json({ 
      error: "Erro ao gerar dashboard executivo: " + error.message 
    }, { status: 500 })
  }
}

function calculateExecutiveMetrics(reports: ReportData[], period: number) {
  if (reports.length === 0) {
    return getEmptyMetrics()
  }

  // Ordenar por data de criação para análise temporal
  const sortedReports = [...reports].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Dividir em períodos para comparação (atual vs anterior)
  const midPoint = Math.floor(sortedReports.length / 2)
  const olderReports = sortedReports.slice(0, midPoint)
  const newerReports = sortedReports.slice(midPoint)

  // Métricas financeiras
  const totalRevenue = reports.reduce((sum, r) => sum + (r.total_value || 0), 0)
  const totalQuantity = reports.reduce((sum, r) => sum + (r.total_quantity || 0), 0)
  
  const avgRevenuePerFormula = totalQuantity > 0 ? totalRevenue / totalQuantity : 0
  const avgDailyRevenue = totalRevenue / Math.max(1, period)

  // Crescimento comparando períodos
  const olderRevenue = olderReports.reduce((sum, r) => sum + (r.total_value || 0), 0)
  const newerRevenue = newerReports.reduce((sum, r) => sum + (r.total_value || 0), 0)
  const revenueGrowth = olderRevenue > 0 ? ((newerRevenue - olderRevenue) / olderRevenue) * 100 : 0

  const olderQuantity = olderReports.reduce((sum, r) => sum + (r.total_quantity || 0), 0)
  const newerQuantity = newerReports.reduce((sum, r) => sum + (r.total_quantity || 0), 0)
  const volumeGrowth = olderQuantity > 0 ? ((newerQuantity - olderQuantity) / olderQuantity) * 100 : 0

  // Análise de vendedores
  const allSellers = new Set<string>()
  const sellerPerformance = new Map<string, { total: number, count: number }>()
  
  reports.forEach(report => {
    if (report.top_seller) {
      allSellers.add(report.top_seller)
      const current = sellerPerformance.get(report.top_seller) || { total: 0, count: 0 }
      sellerPerformance.set(report.top_seller, {
        total: current.total + (report.total_value || 0),
        count: current.count + 1
      })
    }
  })

  const topSeller = Array.from(sellerPerformance.entries())
    .sort((a, b) => b[1].total - a[1].total)[0]?.[0] || "N/A"

  // Métricas operacionais
  const avgFormulasPerDay = totalQuantity / Math.max(1, period)
  const utilizationRate = Math.min(100, (avgFormulasPerDay / 50) * 100) // Assumindo capacidade máxima de 50 fórmulas/dia
  
  // Análise de qualidade (baseada na consistência)
  const dailyRevenues = reports.map(r => r.total_value || 0)
  const avgRevenue = dailyRevenues.reduce((a, b) => a + b, 0) / dailyRevenues.length
  const variance = dailyRevenues.reduce((sum, revenue) => sum + Math.pow(revenue - avgRevenue, 2), 0) / dailyRevenues.length
  const stdDeviation = Math.sqrt(variance)
  const volatility = avgRevenue > 0 ? (stdDeviation / avgRevenue) * 100 : 0
  const qualityScore = Math.max(0, 100 - volatility)

  // Previsões simples baseadas em tendência
  const nextMonthRevenue = totalRevenue * (1 + revenueGrowth / 100) * (30 / period)
  const confidence = Math.max(20, Math.min(95, 80 - volatility / 2))

  // Oportunidades e riscos
  const riskScore = Math.min(100, volatility + (allSellers.size < 3 ? 30 : 0))
  const concentrationRisk = sellerPerformance.size > 0 ? 
    (Array.from(sellerPerformance.values())[0]?.total / totalRevenue) * 100 : 0

  return {
    financial: {
      totalRevenue,
      grossProfit: totalRevenue * 0.3, // Assumindo margem de 30%
      netMargin: 30,
      revenueGrowth,
      profitGrowth: revenueGrowth * 0.8, // Lucro cresce um pouco menos que receita
      avgRevenuePerFormula,
      avgDailyRevenue
    },
    operational: {
      totalVolume: totalQuantity,
      utilizationRate,
      efficiencyGain: Math.max(-10, Math.min(20, revenueGrowth / 2)),
      qualityScore,
      avgFormulasPerDay,
      uniqueSellers: allSellers.size
    },
    forecasting: {
      nextMonthRevenue,
      nextMonthVolume: totalQuantity * (1 + volumeGrowth / 100) * (30 / period),
      growthTrend: revenueGrowth > 5 ? 'up' : revenueGrowth < -5 ? 'down' : 'stable',
      confidence
    },
    optimization: {
      potentialSavings: totalRevenue * 0.1, // Assumindo 10% de potencial de economia
      setupReduction: Math.min(25, utilizationRate / 4),
      bottlenecks: utilizationRate > 80 ? 2 : utilizationRate > 60 ? 1 : 0,
      recommendations: 3 + (utilizationRate > 80 ? 2 : 0) + (volatility > 30 ? 1 : 0)
    },
    risks: {
      riskScore,
      concentration: concentrationRisk,
      volatility,
      alerts: [
        ...(volatility > 40 ? ['Alta volatilidade na receita'] : []),
        ...(concentrationRisk > 50 ? ['Alta concentração em poucos vendedores'] : []),
        ...(utilizationRate > 85 ? ['Capacidade próxima do limite'] : []),
        ...(allSellers.size < 3 ? ['Poucos vendedores ativos'] : [])
      ]
    },
    opportunities: {
      underperformingCategories: Math.floor(Math.random() * 3) + 1, // Placeholder
      pricingOptimization: Math.floor(avgRevenuePerFormula < 100 ? 5 : 2),
      marketGrowth: Math.max(5, revenueGrowth + 10),
      roi: 2.5 + (revenueGrowth / 20)
    },
    summary: {
      topSeller,
      totalReports: reports.length,
      analysisPeriod: period,
      dataQuality: qualityScore > 70 ? 'Alta' : qualityScore > 50 ? 'Média' : 'Baixa'
    }
  }
}

function getEmptyMetrics() {
  return {
    financial: {
      totalRevenue: 0,
      grossProfit: 0,
      netMargin: 0,
      revenueGrowth: 0,
      profitGrowth: 0,
      avgRevenuePerFormula: 0,
      avgDailyRevenue: 0
    },
    operational: {
      totalVolume: 0,
      utilizationRate: 0,
      efficiencyGain: 0,
      qualityScore: 0,
      avgFormulasPerDay: 0,
      uniqueSellers: 0
    },
    forecasting: {
      nextMonthRevenue: 0,
      nextMonthVolume: 0,
      growthTrend: 'stable',
      confidence: 0
    },
    optimization: {
      potentialSavings: 0,
      setupReduction: 0,
      bottlenecks: 0,
      recommendations: 0
    },
    risks: {
      riskScore: 0,
      concentration: 0,
      volatility: 0,
      alerts: []
    },
    opportunities: {
      underperformingCategories: 0,
      pricingOptimization: 0,
      marketGrowth: 0,
      roi: 0
    },
    summary: {
      topSeller: "N/A",
      totalReports: 0,
      analysisePeriod: 0,
      dataQuality: 'Baixa'
    }
  }
}