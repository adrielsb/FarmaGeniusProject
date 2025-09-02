import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface FinancialMetrics {
  profitability: {
    totalRevenue: number
    totalCosts: number
    grossProfit: number
    netMargin: number
    profitByCategory: Record<string, number>
    profitBySeller: Record<string, number>
  }
  efficiency: {
    revenuePerHour: number
    costPerUnit: number
    productivityIndex: number
    utilizationRate: number
  }
  trends: {
    revenueGrowth: number
    profitGrowth: number
    volumeGrowth: number
    priceInflation: number
  }
  risks: {
    concentration: {
      topSellerPercentage: number
      topCategoryPercentage: number
      diversificationIndex: number
    }
    volatility: {
      revenueVolatility: number
      volumeVolatility: number
      riskScore: number
    }
  }
  opportunities: {
    underperformingCategories: Array<{
      category: string
      currentRevenue: number
      potentialRevenue: number
      improvementPercentage: number
    }>
    pricingOptimization: Array<{
      category: string
      currentPrice: number
      suggestedPrice: number
      potentialIncrease: number
    }>
    marketShare: {
      currentPosition: string
      growthPotential: number
      recommendations: string[]
    }
  }
  forecasts: {
    nextMonth: {
      predictedRevenue: number
      predictedProfit: number
      confidence: number
    }
    nextQuarter: {
      predictedRevenue: number
      predictedProfit: number
      confidence: number
    }
  }
}

interface ProcessedFinancialData {
  revenue: number;
  volume: number;
  category: string;
  seller: string;
  date: Date;
  estimatedCost: number;
  unitPrice: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30'
    const detailed = searchParams.get('detailed') === 'true'
    
    console.log('💰 Gerando análises financeiras avançadas...', { period, detailed })

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
      .limit(2000)

    if (error) {
      console.error('Erro ao buscar dados históricos:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao buscar dados históricos' 
      }, { status: 500 })
    }

    // Buscar dados de reports e last_processing
    const { data: reports } = await supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    const { data: lastProcessing } = await supabaseAdmin
      .from('last_processing')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100)

    const allData = [
      ...(historicalData || []),
      ...(reports || []),
      ...(lastProcessing || [])
    ]
    
    if (allData.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: createEmptyAnalytics(),
        message: 'Dados insuficientes para análise financeira. Processe mais relatórios.'
      })
    }

    // Gerar análises financeiras
    const analytics = generateFinancialAnalytics(allData, parseInt(period), detailed)
    
    console.log('💎 Análises financeiras geradas:', {
      totalRevenue: analytics.profitability.totalRevenue,
      grossProfit: analytics.profitability.grossProfit,
      opportunities: analytics.opportunities.underperformingCategories.length
    })

    return NextResponse.json({
      success: true,
      analytics,
      dataPoints: allData.length,
      generatedAt: new Date().toISOString(),
      period: parseInt(period),
      detailed
    })

  } catch (error) {
    console.error('Erro na API de análises financeiras:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

function generateFinancialAnalytics(data: any[], days: number, detailed: boolean): FinancialMetrics {
  // Processar dados financeiros
  const processedData = processFinancialData(data, days)
  
  // Calcular métricas de lucratividade
  const profitability = calculateProfitability(processedData)
  
  // Calcular eficiência operacional
  const efficiency = calculateEfficiency(processedData)
  
  // Analisar tendências
  const trends = analyzeTrends(processedData)
  
  // Avaliar riscos
  const risks = assessRisks(processedData)
  
  // Identificar oportunidades
  const opportunities = identifyOpportunities(processedData, detailed)
  
  // Gerar previsões financeiras
  const forecasts = generateFinancialForecasts(processedData, trends)

  return {
    profitability,
    efficiency,
    trends,
    risks,
    opportunities,
    forecasts
  }
}

function processFinancialData(data: any[], days: number): ProcessedFinancialData[] {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
  
  return data
    .filter(item => {
      const itemDate = new Date(item.created_at || item.updated_at || item.processed_at || now)
      return itemDate >= cutoffDate
    })
    .map(item => ({
      ...item,
      revenue: item.total_value || item.valor || 0,
      volume: item.total_quantity || item.quantidade || 1,
      category: mapCategory(item.form_norm || item.categoria || ''),
      seller: item.top_seller || item.vendedor || 'N/A',
      date: new Date(item.created_at || item.updated_at || item.processed_at || now),
      // Estimativa de custos (35-45% da receita dependendo da categoria)
      estimatedCost: (item.total_value || item.valor || 0) * getCostRatio(item.form_norm || item.categoria || ''),
      unitPrice: (item.total_value || item.valor || 0) / Math.max(item.total_quantity || item.quantidade || 1, 1)
    }))
}

function calculateProfitability(data: ProcessedFinancialData[]) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const totalCosts = data.reduce((sum, item) => sum + item.estimatedCost, 0)
  const grossProfit = totalRevenue - totalCosts
  const netMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  // Lucro por categoria
  const profitByCategory = data.reduce((acc, item) => {
    const profit = item.revenue - item.estimatedCost
    acc[item.category] = (acc[item.category] || 0) + profit
    return acc
  }, {} as Record<string, number>)

  // Lucro por vendedor
  const profitBySeller = data.reduce((acc, item) => {
    const profit = item.revenue - item.estimatedCost
    acc[item.seller] = (acc[item.seller] || 0) + profit
    return acc
  }, {} as Record<string, number>)

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netMargin: Math.round(netMargin * 100) / 100,
    profitByCategory,
    profitBySeller
  }
}

function calculateEfficiency(data: ProcessedFinancialData[]) {
  if (data.length === 0) {
    return {
      revenuePerHour: 0,
      costPerUnit: 0,
      productivityIndex: 0,
      utilizationRate: 0
    }
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const totalVolume = data.reduce((sum, item) => sum + item.volume, 0)
  const totalCosts = data.reduce((sum, item) => sum + item.estimatedCost, 0)
  
  // Estimar horas trabalhadas (assumindo 8h/dia em dias com produção)
  const uniqueDates = new Set(data.map(item => item.date.toDateString()))
  const estimatedHours = uniqueDates.size * 8
  
  const revenuePerHour = estimatedHours > 0 ? totalRevenue / estimatedHours : 0
  const costPerUnit = totalVolume > 0 ? totalCosts / totalVolume : 0
  
  // Índice de produtividade (receita por unidade de custo)
  const productivityIndex = totalCosts > 0 ? totalRevenue / totalCosts : 0
  
  // Taxa de utilização (baseada na capacidade teórica vs real)
  const theoreticalCapacity = uniqueDates.size * 500 // 500 fórmulas/dia teórico
  const utilizationRate = theoreticalCapacity > 0 ? (totalVolume / theoreticalCapacity) * 100 : 0

  return {
    revenuePerHour: Math.round(revenuePerHour * 100) / 100,
    costPerUnit: Math.round(costPerUnit * 100) / 100,
    productivityIndex: Math.round(productivityIndex * 100) / 100,
    utilizationRate: Math.min(100, Math.round(utilizationRate * 100) / 100)
  }
}

function analyzeTrends(data: ProcessedFinancialData[]) {
  if (data.length < 7) {
    return {
      revenueGrowth: 0,
      profitGrowth: 0,
      volumeGrowth: 0,
      priceInflation: 0
    }
  }

  // Dividir dados em duas metades para comparação
  const sortedData = data.sort((a, b) => a.date.getTime() - b.date.getTime())
  const midPoint = Math.floor(sortedData.length / 2)
  const firstHalf = sortedData.slice(0, midPoint)
  const secondHalf = sortedData.slice(midPoint)

  // Calcular métricas para cada período
  const firstPeriod = {
    revenue: firstHalf.reduce((sum, item) => sum + item.revenue, 0),
    profit: firstHalf.reduce((sum, item) => sum + (item.revenue - item.estimatedCost), 0),
    volume: firstHalf.reduce((sum, item) => sum + item.volume, 0),
    avgPrice: firstHalf.reduce((sum, item) => sum + item.unitPrice, 0) / firstHalf.length
  }

  const secondPeriod = {
    revenue: secondHalf.reduce((sum, item) => sum + item.revenue, 0),
    profit: secondHalf.reduce((sum, item) => sum + (item.revenue - item.estimatedCost), 0),
    volume: secondHalf.reduce((sum, item) => sum + item.volume, 0),
    avgPrice: secondHalf.reduce((sum, item) => sum + item.unitPrice, 0) / secondHalf.length
  }

  // Calcular crescimentos
  const revenueGrowth = firstPeriod.revenue > 0 ? 
    ((secondPeriod.revenue - firstPeriod.revenue) / firstPeriod.revenue) * 100 : 0
  
  const profitGrowth = firstPeriod.profit > 0 ? 
    ((secondPeriod.profit - firstPeriod.profit) / firstPeriod.profit) * 100 : 0
  
  const volumeGrowth = firstPeriod.volume > 0 ? 
    ((secondPeriod.volume - firstPeriod.volume) / firstPeriod.volume) * 100 : 0
  
  const priceInflation = firstPeriod.avgPrice > 0 ? 
    ((secondPeriod.avgPrice - firstPeriod.avgPrice) / firstPeriod.avgPrice) * 100 : 0

  return {
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    profitGrowth: Math.round(profitGrowth * 10) / 10,
    volumeGrowth: Math.round(volumeGrowth * 10) / 10,
    priceInflation: Math.round(priceInflation * 10) / 10
  }
}

function assessRisks(data: ProcessedFinancialData[]) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  
  // Análise de concentração
  const revenueByCategory = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.revenue
    return acc
  }, {} as Record<string, number>)

  const revenueBySeller = data.reduce((acc, item) => {
    acc[item.seller] = (acc[item.seller] || 0) + item.revenue
    return acc
  }, {} as Record<string, number>)

  const topSellerRevenue = Math.max(...Object.values(revenueBySeller))
  const topCategoryRevenue = Math.max(...Object.values(revenueByCategory))
  
  const topSellerPercentage = totalRevenue > 0 ? (topSellerRevenue / totalRevenue) * 100 : 0
  const topCategoryPercentage = totalRevenue > 0 ? (topCategoryRevenue / totalRevenue) * 100 : 0
  
  // Índice de diversificação (baseado na distribuição de receita)
  const categories = Object.keys(revenueByCategory)
  const diversificationIndex = categories.length > 0 ? 
    Math.min(100, (categories.length / 6) * 100) : 0 // 6 categorias ideais

  // Análise de volatilidade
  const dailyRevenues = data.reduce((acc, item) => {
    const dateKey = item.date.toDateString()
    acc[dateKey] = (acc[dateKey] || 0) + item.revenue
    return acc
  }, {} as Record<string, number>)

  const revenues = Object.values(dailyRevenues)
  const revenueVolatility = calculateVolatility(revenues)
  
  const dailyVolumes = data.reduce((acc, item) => {
    const dateKey = item.date.toDateString()
    acc[dateKey] = (acc[dateKey] || 0) + item.volume
    return acc
  }, {} as Record<string, number>)

  const volumes = Object.values(dailyVolumes)
  const volumeVolatility = calculateVolatility(volumes)

  // Score de risco (0-100, onde 0 é baixo risco)
  let riskScore = 0
  riskScore += topSellerPercentage > 60 ? 30 : topSellerPercentage > 40 ? 15 : 0
  riskScore += topCategoryPercentage > 70 ? 25 : topCategoryPercentage > 50 ? 12 : 0
  riskScore += revenueVolatility > 50 ? 25 : revenueVolatility > 30 ? 12 : 0
  riskScore += diversificationIndex < 50 ? 20 : diversificationIndex < 75 ? 10 : 0

  return {
    concentration: {
      topSellerPercentage: Math.round(topSellerPercentage * 10) / 10,
      topCategoryPercentage: Math.round(topCategoryPercentage * 10) / 10,
      diversificationIndex: Math.round(diversificationIndex * 10) / 10
    },
    volatility: {
      revenueVolatility: Math.round(revenueVolatility * 10) / 10,
      volumeVolatility: Math.round(volumeVolatility * 10) / 10,
      riskScore: Math.min(100, riskScore)
    }
  }
}

function identifyOpportunities(data: ProcessedFinancialData[], detailed: boolean) {
  // Analisar categorias com baixo desempenho
  const categoryStats = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { revenue: 0, volume: 0, items: [] as ProcessedFinancialData[] }
    }
    acc[item.category].revenue += item.revenue
    acc[item.category].volume += item.volume
    acc[item.category].items.push(item)
    return acc
  }, {} as Record<string, { revenue: number; volume: number; items: ProcessedFinancialData[] }>)

  const avgCategoryRevenue = Object.values(categoryStats).reduce((sum, cat) => 
    sum + cat.revenue, 0) / Math.max(Object.keys(categoryStats).length, 1)

  const underperformingCategories = Object.entries(categoryStats)
    .filter(([_, stats]) => stats.revenue < avgCategoryRevenue * 0.7)
    .map(([category, stats]) => ({
      category,
      currentRevenue: Math.round(stats.revenue * 100) / 100,
      potentialRevenue: Math.round(avgCategoryRevenue * 100) / 100,
      improvementPercentage: Math.round(((avgCategoryRevenue - stats.revenue) / stats.revenue) * 100)
    }))

  // Análise de otimização de preços
  const pricingOptimization = Object.entries(categoryStats)
    .map(([category, stats]) => {
      const avgPrice = stats.revenue / stats.volume
      const marketMultiplier = getPricingMultiplier(category)
      const suggestedPrice = avgPrice * marketMultiplier
      
      return {
        category,
        currentPrice: Math.round(avgPrice * 100) / 100,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        potentialIncrease: Math.round(((suggestedPrice - avgPrice) / avgPrice) * 100 * 10) / 10
      }
    })
    .filter(item => item.potentialIncrease > 5)

  // Análise de market share
  const totalMarketSize = data.reduce((sum, item) => sum + item.revenue, 0) * 3 // Assumindo 33% de market share
  const currentRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const marketSharePercentage = totalMarketSize > 0 ? (currentRevenue / totalMarketSize) * 100 : 0
  
  const recommendations = []
  if (marketSharePercentage < 25) recommendations.push('Expandir base de clientes através de marketing digital')
  if (marketSharePercentage < 40) recommendations.push('Desenvolver parcerias estratégicas com clínicas')
  recommendations.push('Investir em categorias de alta margem (Homeopatia e Cosméticos)')
  recommendations.push('Implementar programa de fidelidade para clientes frequentes')

  return {
    underperformingCategories: underperformingCategories.slice(0, 5),
    pricingOptimization: pricingOptimization.slice(0, 5),
    marketShare: {
      currentPosition: marketSharePercentage > 50 ? 'Líder' : marketSharePercentage > 30 ? 'Forte' : 'Emergente',
      growthPotential: Math.round((100 - marketSharePercentage) * 10) / 10,
      recommendations
    }
  }
}

function generateFinancialForecasts(data: ProcessedFinancialData[], trends: any) {
  if (data.length === 0) {
    return {
      nextMonth: { predictedRevenue: 0, predictedProfit: 0, confidence: 0 },
      nextQuarter: { predictedRevenue: 0, predictedProfit: 0, confidence: 0 }
    }
  }

  const currentMonthlyRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const currentMonthlyProfit = data.reduce((sum, item) => sum + (item.revenue - item.estimatedCost), 0)
  
  // Previsão para próximo mês
  const nextMonthRevenue = currentMonthlyRevenue * (1 + (trends.revenueGrowth / 100))
  const nextMonthProfit = currentMonthlyProfit * (1 + (trends.profitGrowth / 100))
  
  // Previsão para próximo trimestre
  const nextQuarterRevenue = nextMonthRevenue * 3 * (1 + (trends.revenueGrowth / 100) * 0.5)
  const nextQuarterProfit = nextMonthProfit * 3 * (1 + (trends.profitGrowth / 100) * 0.5)
  
  // Confiança baseada na consistência dos dados
  const confidence = Math.min(95, Math.max(40, 70 + (data.length / 10)))

  return {
    nextMonth: {
      predictedRevenue: Math.round(nextMonthRevenue * 100) / 100,
      predictedProfit: Math.round(nextMonthProfit * 100) / 100,
      confidence: Math.round(confidence)
    },
    nextQuarter: {
      predictedRevenue: Math.round(nextQuarterRevenue * 100) / 100,
      predictedProfit: Math.round(nextQuarterProfit * 100) / 100,
      confidence: Math.round(confidence * 0.85) // Menor confiança para prazo maior
    }
  }
}

// Funções auxiliares
function getCostRatio(category: string): number {
  // Ratios de custo por categoria (baseado em padrões da indústria farmacêutica)
  const costRatios: Record<string, number> = {
    'LÍQUIDOS': 0.35,
    'HOMEOPATIA': 0.25,
    'SÓLIDOS': 0.40,
    'SEMI-SÓLIDOS': 0.38,
    'CÁPSULAS': 0.42,
    'OUTROS': 0.37
  }
  
  return costRatios[mapCategory(category)] || 0.37
}

function getPricingMultiplier(category: string): number {
  // Multiplicadores para otimização de preços
  const multipliers: Record<string, number> = {
    'LÍQUIDOS': 1.15,
    'HOMEOPATIA': 1.25,
    'SÓLIDOS': 1.10,
    'SEMI-SÓLIDOS': 1.12,
    'CÁPSULAS': 1.08,
    'OUTROS': 1.10
  }
  
  return multipliers[category] || 1.10
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  return mean > 0 ? (stdDev / mean) * 100 : 0
}

function mapCategory(formula: string): string {
  const f = formula.toUpperCase()
  if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO')) return 'LÍQUIDOS'
  if (f.includes('HOMEOPATIA') || f.includes('FLORAL')) return 'HOMEOPATIA'
  if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ')) return 'SÓLIDOS'
  if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL')) return 'SEMI-SÓLIDOS'
  return 'OUTROS'
}

function createEmptyAnalytics(): FinancialMetrics {
  return {
    profitability: {
      totalRevenue: 0,
      totalCosts: 0,
      grossProfit: 0,
      netMargin: 0,
      profitByCategory: {},
      profitBySeller: {}
    },
    efficiency: {
      revenuePerHour: 0,
      costPerUnit: 0,
      productivityIndex: 0,
      utilizationRate: 0
    },
    trends: {
      revenueGrowth: 0,
      profitGrowth: 0,
      volumeGrowth: 0,
      priceInflation: 0
    },
    risks: {
      concentration: {
        topSellerPercentage: 0,
        topCategoryPercentage: 0,
        diversificationIndex: 0
      },
      volatility: {
        revenueVolatility: 0,
        volumeVolatility: 0,
        riskScore: 0
      }
    },
    opportunities: {
      underperformingCategories: [],
      pricingOptimization: [],
      marketShare: {
        currentPosition: 'Indefinido',
        growthPotential: 100,
        recommendations: [
          'Processe mais relatórios para análises precisas',
          'Configure categorias de produtos corretamente',
          'Implemente controle de custos detalhado'
        ]
      }
    },
    forecasts: {
      nextMonth: {
        predictedRevenue: 0,
        predictedProfit: 0,
        confidence: 0
      },
      nextQuarter: {
        predictedRevenue: 0,
        predictedProfit: 0,
        confidence: 0
      }
    }
  }
}