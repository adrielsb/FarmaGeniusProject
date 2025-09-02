export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

interface ProductionMetric {
  id?: string
  timeSlot: string
  category: string
  capacity: number
  isActive: boolean
}

interface DailyCapacityConfig {
  id?: string
  totalCapacity: number
  isActive: boolean
}

interface UserSetting {
  id?: string;
  user_id: string;
  setting_key: string;
  setting_value: string;
  created_at?: string;
  updated_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: userSettings, error } = await supabaseAdmin
      .from('user_settings')
      .select('setting_value')
      .eq('user_id', session.user.id)
      .eq('setting_key', 'production_metrics')
      .single<{setting_value: string}>()

    if (error || !userSettings) {
        const metrics: ProductionMetric[] = generateDefaultMetrics()
        const dailyCapacity: DailyCapacityConfig = { totalCapacity: 500, isActive: true }
        return NextResponse.json({
          success: true,
          metrics,
          dailyCapacity
        })
    }

    const { metrics, dailyCapacity } = JSON.parse(userSettings.setting_value)

    return NextResponse.json({
      success: true,
      metrics,
      dailyCapacity
    })

  } catch (error) {
    console.error('Erro na API de métricas de produção:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
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

    const body = await request.json()
    const { metrics, dailyCapacity }: { 
      metrics?: ProductionMetric[], 
      dailyCapacity?: DailyCapacityConfig 
    } = body

    console.log('📊 Recebido no POST:', { 
      hasMetrics: !!metrics, 
      isMetricsArray: Array.isArray(metrics), 
      metricsLength: metrics?.length, 
      hasDailyCapacity: !!dailyCapacity 
    })

    // Validar se pelo menos um dos campos foi enviado
    if (!metrics && !dailyCapacity) {
      console.log('❌ Nenhum dado fornecido')
      return NextResponse.json({ error: "Nenhum dado fornecido" }, { status: 400 })
    }

    // Se metrics foi enviado, deve ser um array
    if (metrics && !Array.isArray(metrics)) {
      console.log('❌ Métricas não é um array:', typeof metrics)
      return NextResponse.json({ error: "Métricas devem ser um array" }, { status: 400 })
    }

    // Buscar configuração existente primeiro
    const { data: existingSetting } = await supabaseAdmin
      .from('user_settings')
      .select('setting_value')
      .eq('user_id', session.user.id)
      .eq('setting_key', 'production_metrics')
      .single<{setting_value: string}>()

    // Usar dados existentes como base
    let existingData: any = { metrics: [], dailyCapacity: { totalCapacity: 500, isActive: true } }
    if (existingSetting && existingSetting.setting_value) {
      try {
        existingData = JSON.parse(existingSetting.setting_value)
      } catch (e) {
        console.log('Erro ao parsear configuração existente:', e)
      }
    }

    // Processar métricas (usar existente se não fornecido)
    let createdMetrics: any[] = existingData.metrics || []
    if (metrics && Array.isArray(metrics)) {
      createdMetrics = metrics.map((metric, index) => ({
        id: `metric_${index + 1}`,
        timeSlot: metric.timeSlot,
        category: metric.category,
        capacity: metric.capacity,
        isActive: metric.isActive
      }))
    }

    // Processar capacidade diária (usar existente se não fornecido)
    let savedDailyCapacity = existingData.dailyCapacity || { totalCapacity: 500, isActive: true }
    if (dailyCapacity) {
      savedDailyCapacity = {
        totalCapacity: dailyCapacity.totalCapacity,
        isActive: dailyCapacity.isActive
      }
    }

    // Configurações das métricas de produção
    const settingsData: UserSetting = {
      user_id: session.user.id,
      setting_key: 'production_metrics',
      setting_value: JSON.stringify({
        metrics: createdMetrics,
        dailyCapacity: savedDailyCapacity,
        updatedAt: new Date().toISOString()
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Verificar se já existe uma configuração
    const { data: checkExisting } = await supabaseAdmin
      .from('user_settings')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('setting_key', 'production_metrics')
      .single<UserSetting>()

    if (checkExisting) {
      // Atualizar configuração existente
      await (supabaseAdmin as any)
        .from('user_settings')
        .update({
          setting_value: settingsData.setting_value,
          updated_at: settingsData.updated_at
        })
        .eq('user_id', session.user.id)
        .eq('setting_key', 'production_metrics')
    } else {
      // Criar nova configuração
      await (supabaseAdmin as any)
        .from('user_settings')
        .insert([{
          user_id: settingsData.user_id,
          setting_key: settingsData.setting_key,
          setting_value: settingsData.setting_value,
          created_at: settingsData.created_at,
          updated_at: settingsData.updated_at
        }])
    }

    console.log('✅ Métricas salvas com sucesso:', { 
      metricsCount: createdMetrics.length, 
      dailyCapacity: savedDailyCapacity 
    })

    return NextResponse.json({
      metrics: createdMetrics,
      dailyCapacity: savedDailyCapacity
    })
  } catch (error) {
    console.error("Erro ao salvar métricas de produção:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

function calculateProductionMetrics(reports: any[]) {
  const totalFormulas = reports.reduce((sum, report) => sum + (report.quantidade || 0), 0)
  const totalValue = reports.reduce((sum, report) => sum + (report.valor || 0), 0)
  const totalDays = getUniqueDays(reports)
  const avgFormulasPerDay = totalFormulas / totalDays
  
  // Análise por categoria
  const categoryDistribution = reports.reduce((acc, report) => {
    const category = mapCategory(report.categoria || report.form_norm || '')
    acc[category] = (acc[category] || 0) + (report.quantidade || 0)
    return acc
  }, {} as Record<string, number>)

  // Análise temporal
  const hourlyDistribution = reports.reduce((acc, report) => {
    if (report.horario) {
      const hour = extractHour(report.horario)
      acc[hour] = (acc[hour] || 0) + (report.quantidade || 0)
    }
    return acc
  }, {} as Record<string, number>)

  // Análise de vendedores
  const vendorPerformance = reports.reduce((acc, report) => {
    const vendor = report.vendedor || 'N/A'
    if (!acc[vendor]) {
      acc[vendor] = { formulas: 0, value: 0 }
    }
    acc[vendor].formulas += (report.quantidade || 0)
    acc[vendor].value += (report.valor || 0)
    return acc
  }, {} as Record<string, { formulas: number, value: number }>)

  // Calcular métricas específicas
  const metrics = {
    // Performance
    throughput: {
      current: Math.round((totalFormulas / totalDays) * 10) / 10,
      target: 500,
      unit: 'fórmulas/dia',
      category: 'performance'
    },
    
    daily_volume: {
      current: Math.round(avgFormulasPerDay),
      target: 500,
      unit: 'fórmulas',
      category: 'performance'
    },

    // Eficiência
    category_balance: {
      current: calculateCategoryBalance(categoryDistribution),
      target: 25,
      unit: '% desvio',
      category: 'efficiency'
    },

    avg_value_per_formula: {
      current: Math.round((totalValue / totalFormulas) * 100) / 100,
      target: 150,
      unit: 'R$',
      category: 'efficiency'
    },

    // Capacidade
    peak_hour_load: {
      current: Math.max(...(Object.values(hourlyDistribution).length > 0 ? Object.values(hourlyDistribution).map(v => Number(v)) : [0])),
      target: 60,
      unit: 'fórmulas/hora',
      category: 'capacity'
    },

    vendor_distribution: {
      current: Object.keys(vendorPerformance).length,
      target: 8,
      unit: 'vendedores ativos',
      category: 'capacity'
    },

    // Qualidade
    consistency_score: {
      current: calculateConsistencyScore(reports),
      target: 85,
      unit: '% consistência',
      category: 'quality'
    }
  }

  return {
    summary: {
      totalFormulas,
      totalValue,
      totalDays,
      avgFormulasPerDay: Math.round(avgFormulasPerDay),
      avgValuePerDay: Math.round(totalValue / totalDays)
    },
    metrics,
    distributions: {
      categories: categoryDistribution,
      hourly: hourlyDistribution,
      vendors: vendorPerformance
    }
  }
}

function calculateTrends(reports: any[]) {
  // Dividir dados em dois períodos para comparação
  const midPoint = Math.floor(reports.length / 2)
  const currentPeriod = reports.slice(0, midPoint)
  const previousPeriod = reports.slice(midPoint)

  const currentMetrics = calculateProductionMetrics(currentPeriod)
  const previousMetrics = calculateProductionMetrics(previousPeriod)

  return {
    throughput: {
      change: ((currentMetrics.summary.avgFormulasPerDay - previousMetrics.summary.avgFormulasPerDay) / previousMetrics.summary.avgFormulasPerDay * 100),
      direction: currentMetrics.summary.avgFormulasPerDay > previousMetrics.summary.avgFormulasPerDay ? 'up' : 'down'
    },
    value: {
      change: ((currentMetrics.summary.avgValuePerDay - previousMetrics.summary.avgValuePerDay) / previousMetrics.summary.avgValuePerDay * 100),
      direction: currentMetrics.summary.avgValuePerDay > previousMetrics.summary.avgValuePerDay ? 'up' : 'down'
    }
  }
}

function getUniqueDays(reports: any[]): number {
  const dates = new Set()
  reports.forEach(report => {
    if (report.created_at) {
      const date = new Date(report.created_at).toDateString()
      dates.add(date)
    }
  })
  return Math.max(dates.size, 1) // Evitar divisão por zero
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
  // Extrair hora do formato "16:00 AS 17:00" ou "16:00"
  const match = horario.match(/(\d{1,2}):?\d{0,2}/)
  return match ? `${match[1]}:00` : '12:00'
}

function calculateCategoryBalance(categories: Record<string, number>): number {
  const values = Object.values(categories)
  if (values.length === 0) return 0
  
  const total = values.reduce((a, b) => a + b, 0)
  const percentages = values.map(v => (v / total) * 100)
  const idealPercentage = 100 / values.length
  const deviations = percentages.map(p => Math.abs(p - idealPercentage))
  
  return Math.round(deviations.reduce((a, b) => a + b, 0) / values.length * 10) / 10
}

function calculateConsistencyScore(reports: any[]): number {
  // Calcular score de consistência baseado na variação diária
  const dailyVolumes = reports.reduce((acc, report) => {
    const date = new Date(report.created_at || Date.now()).toDateString()
    acc[date] = (acc[date] || 0) + (report.quantidade || 0)
    return acc
  }, {} as Record<string, number>)

  const volumes = Object.values(dailyVolumes) as number[]
  if (volumes.length === 0) return 0

  const avg = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length
  const variance = volumes.reduce((acc: number, vol: number) => acc + Math.pow(vol - avg, 2), 0) / volumes.length
  const standardDeviation = Math.sqrt(variance)
  
  // Converter para score de consistência (menor desvio = maior consistência)
  const consistency = Math.max(0, 100 - (standardDeviation / avg * 100))
  return Math.round(consistency * 10) / 10
}

function generateDefaultMetrics(): ProductionMetric[] {
  const DEFAULT_TIME_SLOTS = [
    "7:00 AS 8:00",
    "10:00 AS 13:00", 
    "14:00",
    "15:00",
    "16:00 AS 17:00",
    "OUTROS"
  ]

  const DEFAULT_CATEGORIES = [
    "SÓLIDOS",
    "LÍQUIDOS",
    "SEMI-SÓLIDOS",
    "CÁPSULAS",
    "HOMEOPATIA",
    "OUTROS"
  ]

  const metrics: ProductionMetric[] = []
  
  DEFAULT_TIME_SLOTS.forEach(timeSlot => {
    DEFAULT_CATEGORIES.forEach(category => {
      const capacity = getDefaultCapacityForMetric(timeSlot, category)
      metrics.push({
        id: `metric_${timeSlot}_${category}`,
        timeSlot,
        category,
        capacity,
        isActive: true
      })
    })
  })
  
  return metrics
}

function getDefaultCapacityForMetric(timeSlot: string, category: string): number {
  // Capacidades base por categoria
  const baseCapacities: Record<string, number> = {
    'SÓLIDOS': 60,
    'LÍQUIDOS': 80,
    'SEMI-SÓLIDOS': 40,
    'CÁPSULAS': 100,
    'HOMEOPATIA': 120,
    'OUTROS': 50
  }

  // Multiplicadores por horário
  const timeMultipliers: Record<string, number> = {
    '7:00 AS 8:00': 0.5,
    '10:00 AS 13:00': 1.5, 
    '14:00': 0.8,
    '15:00': 0.8,
    '16:00 AS 17:00': 1.2,
    'OUTROS': 1.0
  }

  const base = baseCapacities[category] || 50
  const multiplier = timeMultipliers[timeSlot] || 1.0
  
  return Math.round(base * multiplier)
}