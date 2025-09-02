import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

interface ReportData {
  quantidade?: number;
  valor?: number;
  form_norm?: string;
  categoria?: string;
  horario?: string;
  vendedor?: string;
  created_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }

    console.log('🏭 Gerando insights de produção...')

    // Buscar dados de produção de múltiplas fontes
    console.log('📊 Buscando dados de processing_history...')
    const { data: reports, error } = await supabaseAdmin
      .from('processing_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Erro ao buscar processing_history:', error)
    }

    console.log('📋 Buscando dados de reports...')
    const { data: reportsTable, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (reportsError) {
      console.error('Erro ao buscar reports:', reportsError)
    }

    console.log('⚡ Buscando last_processing...')
    const { data: lastProcessing, error: lastError } = await supabaseAdmin
      .from('last_processing')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (lastError) {
      console.error('Erro ao buscar last_processing:', lastError)
    }

    // Combinar todos os dados disponíveis
    const allData: ReportData[] = [
      ...(reports || []),
      ...(reportsTable || []),
    ]
    
    console.log(`📈 Dados coletados: ${reports?.length || 0} processing_history, ${reportsTable?.length || 0} reports, ${lastProcessing?.length || 0} last_processing`)

    if (allData.length === 0) {
      return NextResponse.json({
        success: true,
        insights: {
          summary: {
            totalFormulas: 0,
            totalValue: 0,
            totalDays: 0,
            avgFormulasPerDay: 0
          },
          categories: {},
          performance: {
            efficiency: 0,
            capacity_utilization: 0,
            bottlenecks: []
          },
          recommendations: [
            "Processe relatórios para gerar insights de produção",
            "Configure métricas de capacidade para otimização"
          ],
          trends: {
            daily_volume: { current: 0, target: 500, trend: "stable" },
            category_balance: { current: 0, target: 25, trend: "stable" }
          }
        },
        lastProcessing: lastProcessing?.[0] || null,
        dataSources: {
          processing_history: reports?.length || 0,
          reports: reportsTable?.length || 0,
          last_processing: lastProcessing?.length || 0
        }
      })
    }

    // Gerar insights baseados nos dados combinados
    const insights = generateProductionInsights(allData)
    
    // Adicionar informações de processamento recente
    const enrichedInsights = {
      ...insights,
      lastProcessing: lastProcessing?.[0] || null,
      dataSources: {
        processing_history: reports?.length || 0,
        reports: reportsTable?.length || 0,
        last_processing: lastProcessing?.length || 0
      }
    }
    
    console.log('📊 Insights gerados:', { 
      totalDataPoints: allData.length,
      categoriesFound: Object.keys(insights.categories).length,
      recommendations: insights.recommendations.length
    })

    return NextResponse.json({
      success: true,
      insights: enrichedInsights,
      dataPoints: allData.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de insights de produção:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

function generateProductionInsights(reports: ReportData[]) {
  // Análise básica
  const totalFormulas = reports.reduce((sum, report) => sum + (report.quantidade || 0), 0)
  const totalValue = reports.reduce((sum, report) => sum + (report.valor || 0), 0)
  const uniqueDays = getUniqueDays(reports)
  const avgFormulasPerDay = totalFormulas / Math.max(uniqueDays, 1)

  // Análise por categoria
  const categories = reports.reduce((acc, report) => {
    const category = mapCategory(report.form_norm || report.categoria || '')
    acc[category] = (acc[category] || 0) + (report.quantidade || 0)
    return acc
  }, {} as Record<string, number>)

  // Análise temporal (horários)
  const hourlyData = reports.reduce((acc, report) => {
    if (report.horario) {
      const hour = extractHour(report.horario)
      acc[hour] = (acc[hour] || 0) + (report.quantidade || 0)
    }
    return acc
  }, {} as Record<string, number>)

  // Análise de vendedores
  const vendorData = reports.reduce((acc, report) => {
    const vendor = report.vendedor || 'N/A'
    if (!acc[vendor]) {
      acc[vendor] = { formulas: 0, value: 0 }
    }
    acc[vendor].formulas += (report.quantidade || 0)
    acc[vendor].value += (report.valor || 0)
    return acc
  }, {} as Record<string, { formulas: number, value: number }>)

  // Calcular performance
  const performance = calculatePerformance(categories, hourlyData, vendorData, avgFormulasPerDay)

  // Gerar recomendações
  const recommendations = generateRecommendations(categories, hourlyData, vendorData, performance)

  // Calcular tendências
  const trends = calculateTrends(reports, categories, avgFormulasPerDay)

  // Análise de sequenciamento
  const sequencing = analyzeSequencing(reports, categories)

  return {
    summary: {
      totalFormulas: Math.round(totalFormulas),
      totalValue: Math.round(totalValue * 100) / 100,
      totalDays: uniqueDays,
      avgFormulasPerDay: Math.round(avgFormulasPerDay * 10) / 10
    },
    categories,
    hourlyData,
    vendorData,
    performance,
    recommendations,
    trends,
    sequencing,
    insights: {
      peak_hours: Object.entries(hourlyData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => ({ hour, count })),
      
      top_categories: Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, count]) => ({ category, count })),
      
      top_vendors: Object.entries(vendorData)
        .sort(([,a], [,b]) => b.formulas - a.formulas)
        .slice(0, 3)
        .map(([vendor, data]) => ({ vendor, ...data }))
    }
  }
}

function calculatePerformance(categories: Record<string, number>, hourlyData: Record<string, number>, vendorData: Record<string, any>, avgFormulas: number) {
  const totalFormulas = Object.values(categories).reduce((a, b) => a + b, 0)
  
  // Eficiência baseada na distribuição de categorias
  const categoryKeys = Object.keys(categories)
  const idealDistribution = 100 / categoryKeys.length
  const actualDistributions = categoryKeys.map(cat => (categories[cat] / totalFormulas) * 100)
  const categoryBalance = actualDistributions.reduce((sum, dist) => sum + Math.abs(dist - idealDistribution), 0) / categoryKeys.length
  const efficiency = Math.max(0, 100 - categoryBalance)

  // Utilização de capacidade (assumindo 500 fórmulas/dia como target)
  const capacity_utilization = Math.min(100, (avgFormulas / 500) * 100)

  // Identificar gargalos
  const bottlenecks = []
  if (capacity_utilization > 90) bottlenecks.push("Capacidade próxima do limite")
  if (categoryBalance > 30) bottlenecks.push("Desbalanceamento entre categorias")
  if (Object.keys(hourlyData).length < 3) bottlenecks.push("Concentração em poucos horários")

  return {
    efficiency: Math.round(efficiency * 10) / 10,
    capacity_utilization: Math.round(capacity_utilization * 10) / 10,
    category_balance: Math.round(categoryBalance * 10) / 10,
    bottlenecks
  }
}

function generateRecommendations(categories: Record<string, number>, hourlyData: Record<string, number>, vendorData: Record<string, any>, performance: any) {
  const recommendations = []

  // Recomendações baseadas na performance
  if (performance.efficiency < 70) {
    recommendations.push("Revisar distribuição de categorias para melhor balanceamento")
  }

  if (performance.capacity_utilization < 60) {
    recommendations.push("Capacidade subutilizada - considere aumentar o volume de produção")
  } else if (performance.capacity_utilization > 90) {
    recommendations.push("Capacidade próxima do limite - considere expandir recursos")
  }

  // Recomendações por categoria
  const sortedCategories = Object.entries(categories).sort(([,a], [,b]) => b - a)
  if (sortedCategories.length > 0) {
    const [topCategory] = sortedCategories[0]
    recommendations.push(`Categoria predominante: ${topCategory} - otimize setup para esta categoria`)
  }

  // Recomendações por horário
  const peakHours = Object.entries(hourlyData).sort(([,a], [,b]) => b - a).slice(0, 2)
  if (peakHours.length > 0) {
    recommendations.push(`Horários de pico: ${peakHours.map(([h]) => h).join(", ")} - aloque mais recursos`)
  }

  // Recomendações por vendedor
  const vendorCount = Object.keys(vendorData).length
  if (vendorCount < 3) {
    recommendations.push("Poucos vendedores ativos - considere distribuir carga de trabalho")
  }

  return recommendations
}

function calculateTrends(reports: ReportData[], categories: Record<string, number>, avgFormulas: number) {
  // Dividir dados em dois períodos
  const midPoint = Math.floor(reports.length / 2)
  const recentReports = reports.slice(0, midPoint)
  const olderReports = reports.slice(midPoint)

  const recentAvg = recentReports.reduce((sum, r) => sum + (r.quantidade || 0), 0) / Math.max(recentReports.length, 1)
  const olderAvg = olderReports.reduce((sum, r) => sum + (r.quantidade || 0), 0) / Math.max(olderReports.length, 1)

  const volumeTrend = recentAvg > olderAvg ? "up" : recentAvg < olderAvg ? "down" : "stable"
  const volumeChange = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

  return {
    daily_volume: {
      current: Math.round(avgFormulas * 10) / 10,
      target: 500,
      trend: volumeTrend,
      change: Math.round(volumeChange * 10) / 10
    },
    category_balance: {
      current: Object.keys(categories).length,
      target: 5,
      trend: "stable"
    }
  }
}

function analyzeSequencing(reports: ReportData[], categories: Record<string, number>) {
  const categoryOrder = ['LÍQUIDOS', 'HOMEOPATIA', 'SÓLIDOS', 'SEMI-SÓLIDOS', 'OUTROS']
  
  // Calcular tempo estimado por categoria
  const estimatedTimes = Object.entries(categories).map(([category, count]) => ({
    category,
    count,
    estimatedMinutes: count * getCategoryTime(category),
    order: categoryOrder.indexOf(category)
  })).sort((a, b) => a.order - b.order)

  const totalEstimatedTime = estimatedTimes.reduce((sum, cat) => sum + cat.estimatedMinutes, 0)

  return {
    suggested_order: estimatedTimes,
    total_estimated_time: {
      minutes: totalEstimatedTime,
      hours: Math.floor(totalEstimatedTime / 60),
      remaining_minutes: totalEstimatedTime % 60
    },
    efficiency_tips: [
      "Processar líquidos primeiro reduz tempo de limpeza",
      "Agrupar categorias similares otimiza setup",
      "Homeopatia requer menos tempo de setup"
    ]
  }
}

// Funções auxiliares
function getUniqueDays(reports: ReportData[]): number {
  const dates = new Set()
  reports.forEach(report => {
    if (report.created_at) {
      const date = new Date(report.created_at).toDateString()
      dates.add(date)
    }
  })
  return Math.max(dates.size, 1)
}

function mapCategory(formula: string): string {
  const f = formula.toUpperCase()
  if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO')) return 'LÍQUIDOS'
  if (f.includes('HOMEOPATIA') || f.includes('FLORAL')) return 'HOMEOPATIA'
  if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ')) return 'SÓLIDOS'
  if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL')) return 'SEMI-SÓLIDOS'
  return 'OUTROS'
}

function extractHour(horario: string): string {
  const match = horario.match(/(\d{1,2}):?\d{0,2}/)
  return match ? `${match[1]}:00` : '12:00'
}

function getCategoryTime(category: string): number {
  const times = {
    'LÍQUIDOS': 8,
    'HOMEOPATIA': 5,
    'SÓLIDOS': 15,
    'SEMI-SÓLIDOS': 20,
    'OUTROS': 12
  }
  return times[category as keyof typeof times] || 10
}