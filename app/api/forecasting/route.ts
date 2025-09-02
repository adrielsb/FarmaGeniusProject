import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface ForecastData {
  date: string
  predictedVolume: number
  predictedRevenue: number
  confidence: number
  category: string
  trend: 'up' | 'down' | 'stable'
  seasonality: number
}

interface DemandForecast {
  daily: ForecastData[]
  weekly: ForecastData[]
  monthly: ForecastData[]
  insights: {
    peakDays: string[]
    lowDays: string[]
    growthRate: number
    seasonalPatterns: Record<string, number>
    recommendations: string[]
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30'
    const category = searchParams.get('category') || 'all'
    
    console.log('🔮 Gerando previsões de demanda...', { period, category })

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }

    // Buscar dados históricos para análise
    const { data: historicalData, error } = await supabaseAdmin
      .from('processing_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Erro ao buscar dados históricos:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao buscar dados históricos' 
      }, { status: 500 })
    }

    // Buscar dados de last_processing para complementar
    const { data: recentData } = await supabaseAdmin
      .from('last_processing')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50)

    const allData = [...(historicalData || []), ...(recentData || [])]
    
    if (allData.length === 0) {
      return NextResponse.json({
        success: true,
        forecast: createEmptyForecast(),
        message: 'Dados insuficientes para previsão. Processe mais relatórios.'
      })
    }

    // Gerar previsões
    const forecast = generateDemandForecast(allData, parseInt(period), category)
    
    console.log('📈 Previsões geradas:', {
      dailyForecasts: forecast.daily.length,
      weeklyForecasts: forecast.weekly.length,
      monthlyForecasts: forecast.monthly.length,
      recommendations: forecast.insights.recommendations.length
    })

    return NextResponse.json({
      success: true,
      forecast,
      dataPoints: allData.length,
      generatedAt: new Date().toISOString(),
      period: parseInt(period),
      category
    })

  } catch (error) {
    console.error('Erro na API de previsões:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

function generateDemandForecast(data: any[], days: number, category: string): DemandForecast {
  // Processar dados históricos
  const processedData = processHistoricalData(data, category)
  
  // Calcular tendências
  const trends = calculateTrends(processedData)
  
  // Gerar previsões diárias
  const dailyForecasts = generateDailyForecasts(processedData, trends, days)
  
  // Gerar previsões semanais
  const weeklyForecasts = generateWeeklyForecasts(dailyForecasts)
  
  // Gerar previsões mensais
  const monthlyForecasts = generateMonthlyForecasts(dailyForecasts)
  
  // Gerar insights
  const insights = generateForecastInsights(processedData, dailyForecasts, trends)

  return {
    daily: dailyForecasts,
    weekly: weeklyForecasts,
    monthly: monthlyForecasts,
    insights
  }
}

function processHistoricalData(data: any[], category: string) {
  // Agrupar dados por dia
  const dailyData = data.reduce((acc, item) => {
    let date: string
    
    // Extrair data do item
    if (item.report_date) {
      date = item.report_date
    } else if (item.created_at) {
      date = new Date(item.created_at).toLocaleDateString('pt-BR')
    } else {
      date = new Date().toLocaleDateString('pt-BR')
    }

    if (!acc[date]) {
      acc[date] = {
        date,
        volume: 0,
        revenue: 0,
        categories: {}
      }
    }

    // Somar volume e receita
    const volume = item.total_quantity || item.quantidade || 1
    const revenue = item.total_value || item.valor || 0

    acc[date].volume += volume
    acc[date].revenue += revenue

    // Agrupar por categoria se especificada
    if (category !== 'all') {
      const itemCategory = mapCategory(item.form_norm || item.categoria || '')
      if (!acc[date].categories[itemCategory]) {
        acc[date].categories[itemCategory] = { volume: 0, revenue: 0 }
      }
      acc[date].categories[itemCategory].volume += volume
      acc[date].categories[itemCategory].revenue += revenue
    }

    return acc
  }, {} as Record<string, any>)

  return Object.values(dailyData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

function calculateTrends(data: any[]) {
  if (data.length < 2) {
    return { volumeTrend: 0, revenueTrend: 0, consistency: 50 }
  }

  // Calcular tendência de volume
  const volumes = data.map(d => d.volume)
  const volumeTrend = calculateLinearTrend(volumes)
  
  // Calcular tendência de receita
  const revenues = data.map(d => d.revenue)
  const revenueTrend = calculateLinearTrend(revenues)
  
  // Calcular consistência (menor desvio padrão = maior consistência)
  const consistency = calculateConsistency(volumes)

  return { volumeTrend, revenueTrend, consistency }
}

function generateDailyForecasts(data: any[], trends: any, days: number): ForecastData[] {
  const forecasts: ForecastData[] = []
  const lastDate = data.length > 0 ? new Date(data[data.length - 1].date) : new Date()
  
  // Calcular médias dos últimos dados
  const recentData = data.slice(-7) // Últimos 7 dias
  const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / Math.max(recentData.length, 1)
  const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / Math.max(recentData.length, 1)

  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)
    
    // Aplicar tendência e sazonalidade
    const dayOfWeek = forecastDate.getDay()
    const seasonalMultiplier = getSeasonalMultiplier(dayOfWeek, forecastDate.getMonth())
    
    const baseVolume = avgVolume * (1 + (trends.volumeTrend * i * 0.01))
    const baseRevenue = avgRevenue * (1 + (trends.revenueTrend * i * 0.01))
    
    const predictedVolume = Math.round(baseVolume * seasonalMultiplier)
    const predictedRevenue = Math.round(baseRevenue * seasonalMultiplier * 100) / 100
    
    // Calcular confiança baseada na consistência dos dados
    const confidence = Math.min(95, Math.max(30, trends.consistency + (data.length * 2)))
    
    forecasts.push({
      date: forecastDate.toLocaleDateString('pt-BR'),
      predictedVolume,
      predictedRevenue,
      confidence,
      category: 'all',
      trend: trends.volumeTrend > 5 ? 'up' : trends.volumeTrend < -5 ? 'down' : 'stable',
      seasonality: seasonalMultiplier
    })
  }

  return forecasts
}

function generateWeeklyForecasts(dailyForecasts: ForecastData[]): ForecastData[] {
  const weeklyForecasts: ForecastData[] = []
  
  // Agrupar por semana
  for (let i = 0; i < dailyForecasts.length; i += 7) {
    const weekData = dailyForecasts.slice(i, i + 7)
    if (weekData.length === 0) continue
    
    const totalVolume = weekData.reduce((sum, day) => sum + day.predictedVolume, 0)
    const totalRevenue = weekData.reduce((sum, day) => sum + day.predictedRevenue, 0)
    const avgConfidence = weekData.reduce((sum, day) => sum + day.confidence, 0) / weekData.length
    
    const weekStart = new Date(weekData[0].date.split('/').reverse().join('-'))
    const weekEnd = new Date(weekData[weekData.length - 1].date.split('/').reverse().join('-'))
    
    weeklyForecasts.push({
      date: `${weekData[0].date} - ${weekData[weekData.length - 1].date}`,
      predictedVolume: totalVolume,
      predictedRevenue: Math.round(totalRevenue * 100) / 100,
      confidence: Math.round(avgConfidence),
      category: 'all',
      trend: weekData[0].trend,
      seasonality: 1
    })
  }
  
  return weeklyForecasts
}

function generateMonthlyForecasts(dailyForecasts: ForecastData[]): ForecastData[] {
  const monthlyForecasts: ForecastData[] = []
  
  // Agrupar por mês
  const monthlyData: Record<string, ForecastData[]> = {}
  
  dailyForecasts.forEach(forecast => {
    const [day, month, year] = forecast.date.split('/')
    const monthKey = `${month}/${year}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = []
    }
    monthlyData[monthKey].push(forecast)
  })
  
  Object.entries(monthlyData).forEach(([monthKey, forecasts]) => {
    const totalVolume = forecasts.reduce((sum, day) => sum + day.predictedVolume, 0)
    const totalRevenue = forecasts.reduce((sum, day) => sum + day.predictedRevenue, 0)
    const avgConfidence = forecasts.reduce((sum, day) => sum + day.confidence, 0) / forecasts.length
    
    monthlyForecasts.push({
      date: monthKey,
      predictedVolume: totalVolume,
      predictedRevenue: Math.round(totalRevenue * 100) / 100,
      confidence: Math.round(avgConfidence),
      category: 'all',
      trend: forecasts[0].trend,
      seasonality: 1
    })
  })
  
  return monthlyForecasts
}

function generateForecastInsights(historical: any[], forecasts: ForecastData[], trends: any) {
  // Identificar dias de pico e baixa
  const sortedForecasts = [...forecasts].sort((a, b) => b.predictedVolume - a.predictedVolume)
  const peakDays = sortedForecasts.slice(0, 3).map(f => f.date)
  const lowDays = sortedForecasts.slice(-3).map(f => f.date)
  
  // Calcular taxa de crescimento
  const growthRate = trends.volumeTrend
  
  // Padrões sazonais
  const seasonalPatterns: Record<string, number> = {
    'Segunda-feira': 0.9,
    'Terça-feira': 1.1,
    'Quarta-feira': 1.2,
    'Quinta-feira': 1.15,
    'Sexta-feira': 1.0,
    'Sábado': 0.7,
    'Domingo': 0.4
  }
  
  // Gerar recomendações
  const recommendations: string[] = []
  
  if (growthRate > 10) {
    recommendations.push('Tendência de crescimento forte detectada. Considere aumentar capacidade de produção.')
  } else if (growthRate < -10) {
    recommendations.push('Tendência de queda detectada. Revisar estratégias de marketing e vendas.')
  }
  
  if (trends.consistency < 60) {
    recommendations.push('Alta variabilidade na demanda. Implementar sistema de gestão de estoque dinâmico.')
  }
  
  recommendations.push('Otimizar produção para terça e quarta-feira (dias de maior demanda).')
  recommendations.push('Reduzir capacidade nos finais de semana para otimizar custos.')
  
  return {
    peakDays,
    lowDays,
    growthRate: Math.round(growthRate * 10) / 10,
    seasonalPatterns,
    recommendations
  }
}

// Funções auxiliares
function calculateLinearTrend(values: number[]): number {
  if (values.length < 2) return 0
  
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i + 1)
  const y = values
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + (xi * y[i]), 0)
  const sumXX = x.reduce((sum, xi) => sum + (xi * xi), 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const avgY = sumY / n
  
  return (slope / avgY) * 100 // Retorna como porcentagem
}

function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 50
  
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / avg
  
  return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)))
}

function getSeasonalMultiplier(dayOfWeek: number, month: number): number {
  // Multiplicadores por dia da semana (0 = domingo, 6 = sábado)
  const weekMultipliers = [0.4, 0.9, 1.1, 1.2, 1.15, 1.0, 0.7]
  
  // Multiplicadores por mês (sazonalidade farmacêutica)
  const monthMultipliers = [0.9, 0.95, 1.1, 1.05, 1.0, 0.9, 0.85, 0.9, 1.05, 1.1, 1.0, 1.2]
  
  return weekMultipliers[dayOfWeek] * monthMultipliers[month]
}

function mapCategory(formula: string): string {
  const f = formula.toUpperCase()
  if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO')) return 'LÍQUIDOS'
  if (f.includes('HOMEOPATIA') || f.includes('FLORAL')) return 'HOMEOPATIA'
  if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ')) return 'SÓLIDOS'
  if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL')) return 'SEMI-SÓLIDOS'
  return 'OUTROS'
}

function createEmptyForecast(): DemandForecast {
  return {
    daily: [],
    weekly: [],
    monthly: [],
    insights: {
      peakDays: [],
      lowDays: [],
      growthRate: 0,
      seasonalPatterns: {},
      recommendations: [
        'Processe mais relatórios para gerar previsões precisas',
        'Mantenha consistência no processamento diário',
        'Configure alertas de capacidade para otimização'
      ]
    }
  }
}