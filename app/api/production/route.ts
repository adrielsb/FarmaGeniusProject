import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = "force-dynamic"

interface ProductionItem {
  id: string
  formaNorm: string
  linha: string
  horario: string
  vendedor: string
  quantidade: number
  valor: number
  categoria: string
  source: string
  reportId: string
  reportDate: string
}

interface ProductionMetrics {
  overview: {
    totalItems: number
    totalQuantity: number
    totalValue: number
    avgValuePerItem: number
    estimatedProductionTime: {
      totalMinutes: number
      hours: number
      minutes: number
    }
    efficiency: number
  }
  categories: {
    distribution: Record<string, { count: number, quantity: number, value: number }>
    timeEstimates: Record<string, number>
  }
  schedule: {
    hourlyDistribution: Record<string, number>
    peakHours: string[]
    currentLoad: number
    recommendedSequence: any[]
  }
  vendors: {
    performance: Record<string, { count: number, quantity: number, value: number, avgTime: number }>
    ranking: { name: string, score: number }[]
  }
  bottlenecks: {
    identified: string[]
    solutions: string[]
    priorityQueue: any[]
  }
  quality: {
    consistencyScore: number
    riskFactors: string[]
    recommendations: string[]
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const period = parseInt(searchParams.get('period') || '7') // Últimos 7 dias
    const reportId = searchParams.get('reportId') // Filtrar por relatório específico

    // Buscar relatórios e seus itens
    let reportsQuery = supabaseAdmin
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
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    // Filtrar por período
    if (period > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - period)
      reportsQuery = reportsQuery.gte('created_at', cutoffDate.toISOString())
    }

    // Filtrar por relatório específico se fornecido
    if (reportId) {
      reportsQuery = reportsQuery.eq('id', reportId)
    }

    const { data: reports, error: reportsError } = await reportsQuery

    if (reportsError) {
      console.error('Erro ao buscar relatórios:', reportsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar dados de produção: ' + reportsError.message 
      }, { status: 500 })
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum relatório encontrado para análise de produção' 
      })
    }

    // Buscar itens dos relatórios
    const reportIds = reports.map((r: any) => r.id)
    const { data: reportItems, error: itemsError } = await supabaseAdmin
      .from('report_items')
      .select('*')
      .in('report_id', reportIds)
      .order('row_index', { ascending: true })

    if (itemsError) {
      console.error('Erro ao buscar itens dos relatórios:', itemsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar itens de produção: ' + itemsError.message 
      }, { status: 500 })
    }

    // Converter para formato de produção
    const productionItems: ProductionItem[] = (reportItems || []).map((item: any, index) => {
      const report = reports.find((r: any) => r.id === item.report_id)
      return {
        id: `${item.report_id}_${index}`,
        formaNorm: item.form_norm || 'Fórmula',
        linha: item.linha || '',
        horario: item.horario || '',
        vendedor: item.vendedor || 'N/A',
        quantidade: item.quantidade || 1,
        valor: item.valor || 0,
        categoria: item.categoria || mapCategory(item.form_norm || ''),
        source: item.source_file || 'upload',
        reportId: item.report_id,
        reportDate: (report as any)?.date || ''
      }
    })

    // Calcular métricas de produção
    const metrics = calculateProductionMetrics(productionItems, reports)

    console.log(`✅ Gestão de produção gerada com ${productionItems.length} itens de ${reports.length} relatórios`)

    return NextResponse.json({
      success: true,
      period,
      totalReports: reports.length,
      totalItems: productionItems.length,
      data: productionItems,
      metrics,
      lastUpdated: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Erro na API de produção:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + error.message 
    }, { status: 500 })
  }
}

function calculateProductionMetrics(items: ProductionItem[], reports: any[]): ProductionMetrics {
  if (items.length === 0) {
    return getEmptyProductionMetrics()
  }

  // Métricas gerais
  const totalItems = items.length
  const totalQuantity = items.reduce((sum, item) => sum + item.quantidade, 0)
  const totalValue = items.reduce((sum, item) => sum + item.valor, 0)
  const avgValuePerItem = totalItems > 0 ? totalValue / totalItems : 0

  // Análise de categorias
  const categoryDistribution: Record<string, { count: number, quantity: number, value: number }> = {}
  const timeEstimates: Record<string, number> = {}

  items.forEach(item => {
    const category = item.categoria || mapCategory(item.formaNorm)
    if (!categoryDistribution[category]) {
      categoryDistribution[category] = { count: 0, quantity: 0, value: 0 }
      timeEstimates[category] = getCategoryTime(category)
    }
    categoryDistribution[category].count++
    categoryDistribution[category].quantity += item.quantidade
    categoryDistribution[category].value += item.valor
  })

  // Tempo estimado de produção
  let totalMinutes = 0
  Object.entries(categoryDistribution).forEach(([category, data]) => {
    totalMinutes += timeEstimates[category] * data.quantity
  })

  // Distribuição horária
  const hourlyDistribution: Record<string, number> = {}
  items.forEach(item => {
    if (item.horario) {
      const hour = item.horario.split(':')[0] + ':00'
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
    }
  })

  // Identificar horários de pico
  const peakHours = Object.entries(hourlyDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour)

  // Performance dos vendedores
  const vendorPerformance: Record<string, { count: number, quantity: number, value: number, avgTime: number }> = {}
  items.forEach(item => {
    const vendor = item.vendedor || 'N/A'
    if (!vendorPerformance[vendor]) {
      vendorPerformance[vendor] = { count: 0, quantity: 0, value: 0, avgTime: 0 }
    }
    vendorPerformance[vendor].count++
    vendorPerformance[vendor].quantity += item.quantidade
    vendorPerformance[vendor].value += item.valor
  })

  // Calcular tempo médio por vendedor
  Object.keys(vendorPerformance).forEach(vendor => {
    const vendorItems = items.filter(item => item.vendedor === vendor)
    let totalVendorTime = 0
    vendorItems.forEach(item => {
      const category = item.categoria || mapCategory(item.formaNorm)
      totalVendorTime += getCategoryTime(category) * item.quantidade
    })
    vendorPerformance[vendor].avgTime = totalVendorTime / Math.max(1, vendorPerformance[vendor].quantity)
  })

  // Ranking de vendedores
  const vendorRanking = Object.entries(vendorPerformance)
    .map(([name, perf]) => ({
      name,
      score: (perf.value / Math.max(1, perf.avgTime)) * 100 // Score baseado em valor/tempo
    }))
    .sort((a, b) => b.score - a.score)

  // Identificação de gargalos
  const bottlenecks: string[] = []
  const solutions: string[] = []

  // Gargalo por categoria com muito tempo
  Object.entries(categoryDistribution).forEach(([category, data]) => {
    const avgTime = timeEstimates[category]
    const totalCategoryTime = avgTime * data.quantity
    if (totalCategoryTime > totalMinutes * 0.3) { // Mais de 30% do tempo total
      bottlenecks.push(`Alta concentração em ${category}`)
      solutions.push(`Considerar paralelização para ${category}`)
    }
  })

  // Gargalo por horário
  const maxHourlyLoad = Math.max(...Object.values(hourlyDistribution))
  const avgHourlyLoad = Object.values(hourlyDistribution).reduce((a, b) => a + b, 0) / Object.keys(hourlyDistribution).length
  if (maxHourlyLoad > avgHourlyLoad * 2) {
    bottlenecks.push('Sobrecarga em horários específicos')
    solutions.push('Redistribuir produção ao longo do dia')
  }

  // Sequência recomendada (mais rápidos primeiro)
  const recommendedSequence = Object.entries(categoryDistribution)
    .sort((a, b) => timeEstimates[a[0]] - timeEstimates[b[0]])
    .map(([category, data]) => ({
      category,
      priority: timeEstimates[category] < 10 ? 'Alta' : timeEstimates[category] < 15 ? 'Média' : 'Baixa',
      estimatedTime: timeEstimates[category],
      quantity: data.quantity
    }))

  // Score de qualidade baseado em consistência
  const vendorCount = Object.keys(vendorPerformance).length
  const categoryCount = Object.keys(categoryDistribution).length
  const timeVariance = Object.values(timeEstimates).reduce((sum, time) => sum + Math.pow(time - 12, 2), 0) / Object.keys(timeEstimates).length
  const consistencyScore = Math.max(0, 100 - (timeVariance * 2) - (vendorCount > 5 ? 10 : 0))

  // Fatores de risco
  const riskFactors: string[] = []
  const recommendations: string[] = []

  if (vendorCount < 2) {
    riskFactors.push('Dependência de poucos vendedores')
    recommendations.push('Diversificar equipe de vendas')
  }

  if (Object.keys(categoryDistribution).length > 4) {
    riskFactors.push('Alta diversidade de categorias')
    recommendations.push('Especializar produção por categoria')
  }

  if (totalMinutes > 480) { // Mais de 8 horas
    riskFactors.push('Tempo de produção elevado')
    recommendations.push('Otimizar sequenciamento de produção')
  }

  // Carga atual (assumindo 8h de trabalho)
  const currentLoad = Math.min(100, (totalMinutes / 480) * 100)
  const efficiency = Math.max(20, 100 - (bottlenecks.length * 15))

  return {
    overview: {
      totalItems,
      totalQuantity,
      totalValue,
      avgValuePerItem,
      estimatedProductionTime: {
        totalMinutes,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60
      },
      efficiency
    },
    categories: {
      distribution: categoryDistribution,
      timeEstimates
    },
    schedule: {
      hourlyDistribution,
      peakHours,
      currentLoad,
      recommendedSequence
    },
    vendors: {
      performance: vendorPerformance,
      ranking: vendorRanking
    },
    bottlenecks: {
      identified: bottlenecks,
      solutions,
      priorityQueue: recommendedSequence
    },
    quality: {
      consistencyScore,
      riskFactors,
      recommendations
    }
  }
}

function getEmptyProductionMetrics(): ProductionMetrics {
  return {
    overview: {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      avgValuePerItem: 0,
      estimatedProductionTime: {
        totalMinutes: 0,
        hours: 0,
        minutes: 0
      },
      efficiency: 0
    },
    categories: {
      distribution: {},
      timeEstimates: {}
    },
    schedule: {
      hourlyDistribution: {},
      peakHours: [],
      currentLoad: 0,
      recommendedSequence: []
    },
    vendors: {
      performance: {},
      ranking: []
    },
    bottlenecks: {
      identified: [],
      solutions: [],
      priorityQueue: []
    },
    quality: {
      consistencyScore: 0,
      riskFactors: [],
      recommendations: []
    }
  }
}

function mapCategory(formula: string): string {
  if (!formula) return 'OUTROS'
  const f = formula.toUpperCase()
  
  if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO') || f.includes('XAROPE')) return 'LÍQUIDOS'
  if (f.includes('HOMEOPATIA') || f.includes('FLORAL') || f.includes('DILUIÇÃO')) return 'HOMEOPATIA'
  if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ') || f.includes('PÓ')) return 'SÓLIDOS'
  if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL') || f.includes('UNGUE')) return 'SEMI-SÓLIDOS'
  if (f.includes('INJETÁVEL') || f.includes('AMPOLA')) return 'INJETÁVEIS'
  
  return 'OUTROS'
}

function getCategoryTime(category: string): number {
  const times = {
    'LÍQUIDOS': 8,
    'HOMEOPATIA': 5,
    'SÓLIDOS': 15,
    'SEMI-SÓLIDOS': 20,
    'INJETÁVEIS': 25,
    'OUTROS': 12
  }
  return times[category as keyof typeof times] || 10
}