import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface OptimizationResult {
  scheduling: {
    optimizedSequence: Array<{
      category: string
      timeSlot: string
      priority: number
      estimatedTime: number
      setupTime: number
      efficiency: number
    }>
    totalTime: number
    setupReduction: number
    efficiencyGain: number
  }
  capacity: {
    currentUtilization: number
    optimalUtilization: number
    bottlenecks: Array<{
      resource: string
      currentCapacity: number
      recommendedCapacity: number
      impact: string
    }>
    recommendations: string[]
  }
  workforce: {
    sellerPerformance: Array<{
      seller: string
      efficiency: number
      utilization: number
      recommendations: string[]
    }>
    loadBalancing: Array<{
      timeSlot: string
      currentLoad: number
      optimalLoad: number
      adjustment: string
    }>
  }
  quality: {
    errorRates: Record<string, number>
    qualityScore: number
    improvementAreas: Array<{
      area: string
      currentScore: number
      targetScore: number
      actions: string[]
    }>
  }
  costs: {
    currentCosts: number
    optimizedCosts: number
    savings: number
    costBreakdown: Record<string, number>
    optimizationStrategies: Array<{
      strategy: string
      potentialSavings: number
      implementationCost: number
      roi: number
    }>
  }
}

interface ProcessedOptimizationData {
  category: string;
  timeSlot: string;
  seller: string;
  volume: number;
  value: number;
  date: Date;
  setupTime: number;
  processingTime: number;
  complexity: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const optimization_type = searchParams.get('type') || 'full'
    const time_horizon = parseInt(searchParams.get('horizon') || '7')
    
    console.log('⚡ Executando otimização inteligente de produção...', { optimization_type, time_horizon })

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }

    // Buscar dados de produção para análise
    const { data: productionData, error } = await supabaseAdmin
      .from('processing_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000)

    if (error) {
      console.error('Erro ao buscar dados de produção:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao buscar dados de produção' 
      }, { status: 500 })
    }

    // Buscar dados complementares
    const { data: metricsData } = await supabaseAdmin
      .from('last_processing')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100)

    const allData = [...(productionData || []), ...(metricsData || [])]
    
    if (allData.length === 0) {
      return NextResponse.json({
        success: true,
        optimization: createEmptyOptimization(),
        message: 'Dados insuficientes para otimização. Processe mais relatórios.'
      })
    }

    // Executar otimização
    const optimization = performIntelligentOptimization(allData, optimization_type, time_horizon)
    
    console.log('🎯 Otimização concluída:', {
      setupReduction: optimization.scheduling.setupReduction,
      efficiencyGain: optimization.scheduling.efficiencyGain,
      potentialSavings: optimization.costs.savings
    })

    return NextResponse.json({
      success: true,
      optimization,
      dataPoints: allData.length,
      optimizationType: optimization_type,
      timeHorizon: time_horizon,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de otimização:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

function performIntelligentOptimization(data: any[], type: string, horizon: number): OptimizationResult {
  // Processar dados para otimização
  const processedData = processOptimizationData(data)
  
  // Otimizar agendamento e sequenciamento
  const scheduling = optimizeScheduling(processedData, horizon)
  
  // Otimizar capacidade
  const capacity = optimizeCapacity(processedData)
  
  // Otimizar força de trabalho
  const workforce = optimizeWorkforce(processedData)
  
  // Analisar qualidade
  const quality = analyzeQuality(processedData)
  
  // Otimizar custos
  const costs = optimizeCosts(processedData)

  return {
    scheduling,
    capacity,
    workforce,
    quality,
    costs
  }
}

function processOptimizationData(data: any[]): ProcessedOptimizationData[] {
  return data.map(item => ({
    ...item,
    category: mapCategory(item.form_norm || item.categoria || ''),
    timeSlot: extractTimeSlot(item.horario || ''),
    seller: item.top_seller || item.vendedor || 'N/A',
    volume: item.total_quantity || item.quantidade || 1,
    value: item.total_value || item.valor || 0,
    date: new Date(item.created_at || item.updated_at || item.processed_at || Date.now()),
    setupTime: getCategorySetupTime(item.form_norm || item.categoria || ''),
    processingTime: getCategoryProcessingTime(item.form_norm || item.categoria || ''),
    complexity: getCategoryComplexity(item.form_norm || item.categoria || '')
  }))
}

function optimizeScheduling(data: ProcessedOptimizationData[], horizon: number) {
  // Agrupar por categoria para análise de sequenciamento
  const categoryData = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, ProcessedOptimizationData[]>)

  // Calcular sequência otimizada baseada em tempo de setup
  const categories = Object.keys(categoryData)
  const optimizedSequence = categories.map(category => {
    const categoryItems = categoryData[category]
    const avgSetupTime = categoryItems.reduce((sum, item) => sum + item.setupTime, 0) / categoryItems.length
    const avgProcessingTime = categoryItems.reduce((sum, item) => sum + item.processingTime, 0) / categoryItems.length
    const totalVolume = categoryItems.reduce((sum, item) => sum + item.volume, 0)
    
    return {
      category,
      timeSlot: getOptimalTimeSlot(category),
      priority: calculatePriority(category, totalVolume, avgSetupTime),
      estimatedTime: Math.round(avgProcessingTime * totalVolume),
      setupTime: Math.round(avgSetupTime),
      efficiency: calculateCategoryEfficiency(categoryItems)
    }
  }).sort((a, b) => b.priority - a.priority)

  const totalTime = optimizedSequence.reduce((sum, item) => sum + item.estimatedTime + item.setupTime, 0)
  
  // Calcular redução de setup vs sequência atual
  const currentSetupTime = categories.length * 30 // 30 min setup médio
  const optimizedSetupTime = calculateOptimizedSetupTime(optimizedSequence)
  const setupReduction = ((currentSetupTime - optimizedSetupTime) / currentSetupTime) * 100

  // Calcular ganho de eficiência
  const currentEfficiency = data.reduce((sum, item) => sum + (item.value / Math.max(item.processingTime, 1)), 0) / data.length
  const optimizedEfficiency = optimizedSequence.reduce((sum, item) => sum + item.efficiency, 0) / optimizedSequence.length
  const efficiencyGain = ((optimizedEfficiency - currentEfficiency) / currentEfficiency) * 100

  return {
    optimizedSequence,
    totalTime: Math.round(totalTime),
    setupReduction: Math.round(setupReduction * 10) / 10,
    efficiencyGain: Math.round(efficiencyGain * 10) / 10
  }
}

function optimizeCapacity(data: ProcessedOptimizationData[]) {
  // Analisar utilização atual por horário
  const hourlyUtilization = data.reduce((acc, item) => {
    const hour = item.timeSlot || 'OUTROS'
    if (!acc[hour]) {
      acc[hour] = { volume: 0, capacity: getTimeSlotCapacity(hour) }
    }
    acc[hour].volume += item.volume
    return acc
  }, {} as Record<string, { volume: number; capacity: number }>)

  const totalCapacity = Object.values(hourlyUtilization).reduce((sum, slot) => sum + slot.capacity, 0)
  const totalUtilization = Object.values(hourlyUtilization).reduce((sum, slot) => sum + slot.volume, 0)
  const currentUtilization = totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0
  
  // Identificar gargalos
  const bottlenecks = Object.entries(hourlyUtilization)
    .filter(([_, data]) => (data.volume / data.capacity) > 0.9)
    .map(([timeSlot, data]) => ({
      resource: `Horário ${timeSlot}`,
      currentCapacity: data.capacity,
      recommendedCapacity: Math.ceil(data.volume * 1.2),
      impact: data.volume > data.capacity * 0.95 ? 'Alto' : 'Médio'
    }))

  const recommendations = [
    'Redistribuir carga dos horários de pico para períodos de menor demanda',
    'Considerar extensão de horário nos dias de maior volume',
    'Implementar sistema de agendamento dinâmico baseado em capacidade'
  ]

  if (bottlenecks.length > 0) {
    recommendations.push(`Expandir capacidade nos horários: ${bottlenecks.map(b => b.resource).join(', ')}`)
  }

  return {
    currentUtilization: Math.round(currentUtilization * 10) / 10,
    optimalUtilization: 85, // Target de 85% para flexibilidade
    bottlenecks,
    recommendations
  }
}

function optimizeWorkforce(data: ProcessedOptimizationData[]) {
  // Analisar performance por vendedor
  const sellerStats = data.reduce((acc, item) => {
    const seller = item.seller
    if (!acc[seller]) {
      acc[seller] = { volume: 0, value: 0, items: [] as ProcessedOptimizationData[] }
    }
    acc[seller].volume += item.volume
    acc[seller].value += item.value
    acc[seller].items.push(item)
    return acc
  }, {} as Record<string, { volume: number; value: number; items: ProcessedOptimizationData[] }>)

  const sellerPerformance = Object.entries(sellerStats).map(([seller, stats]) => {
    const efficiency = stats.value / Math.max(stats.volume, 1) // Valor por unidade
    const utilization = Math.min(100, (stats.volume / 100) * 100) // Assumindo 100 unidades/dia como target
    
    const recommendations = []
    if (efficiency < 50) recommendations.push('Treinamento em produtos de maior valor agregado')
    if (utilization < 60) recommendations.push('Aumentar carga de trabalho ou redistribuir tarefas')
    if (utilization > 95) recommendations.push('Considerar apoio adicional ou redistribuição')
    
    return {
      seller,
      efficiency: Math.round(efficiency * 100) / 100,
      utilization: Math.round(utilization * 10) / 10,
      recommendations
    }
  })

  // Analisar balanceamento de carga por horário
  const hourlyLoad = data.reduce((acc, item) => {
    const hour = item.timeSlot || 'OUTROS'
    acc[hour] = (acc[hour] || 0) + item.volume
    return acc
  }, {} as Record<string, number>)

  const avgLoad = Object.values(hourlyLoad).reduce((a, b) => a + b, 0) / Math.max(Object.keys(hourlyLoad).length, 1)
  
  const loadBalancing = Object.entries(hourlyLoad).map(([timeSlot, load]) => ({
    timeSlot,
    currentLoad: load,
    optimalLoad: Math.round(avgLoad),
    adjustment: load > avgLoad * 1.2 ? 'Reduzir carga' : load < avgLoad * 0.8 ? 'Aumentar carga' : 'Balanceado'
  }))

  return {
    sellerPerformance,
    loadBalancing
  }
}

function analyzeQuality(data: ProcessedOptimizationData[]) {
  // Simular análise de qualidade baseada em padrões
  const categoryQuality = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { total: 0, errors: 0 }
    }
    acc[item.category].total += item.volume
    // Simular taxa de erro baseada na complexidade
    acc[item.category].errors += Math.round(item.volume * (item.complexity / 1000))
    return acc
  }, {} as Record<string, { total: number; errors: number }>)

  const errorRates = Object.entries(categoryQuality).reduce((acc, [category, stats]) => {
    acc[category] = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0
    return acc
  }, {} as Record<string, number>)

  const overallErrorRate = Object.values(errorRates).reduce((a, b) => a + b, 0) / Math.max(Object.keys(errorRates).length, 1)
  const qualityScore = Math.max(0, 100 - overallErrorRate * 10)

  const improvementAreas = Object.entries(errorRates)
    .filter(([_, rate]) => rate > 2)
    .map(([category, rate]) => ({
      area: category,
      currentScore: Math.round((100 - rate) * 10) / 10,
      targetScore: 98,
      actions: [
        `Revisar processo de ${category.toLowerCase()}`,
        'Implementar controles de qualidade adicionais',
        'Treinar equipe em melhores práticas'
      ]
    }))

  return {
    errorRates,
    qualityScore: Math.round(qualityScore * 10) / 10,
    improvementAreas
  }
}

function optimizeCosts(data: ProcessedOptimizationData[]) {
  const currentCosts = data.reduce((sum, item) => {
    const materialCost = item.value * 0.35 // 35% material
    const laborCost = item.processingTime * 0.5 // R$ 0.50 por minuto
    const overheadCost = item.value * 0.15 // 15% overhead
    return sum + materialCost + laborCost + overheadCost
  }, 0)

  // Calcular custos otimizados
  const optimizationStrategies = [
    {
      strategy: 'Otimização de sequenciamento (redução setup)',
      potentialSavings: currentCosts * 0.08, // 8% economia
      implementationCost: 5000,
      roi: (currentCosts * 0.08 * 12) / 5000 // ROI anual
    },
    {
      strategy: 'Melhoria na utilização de capacidade',
      potentialSavings: currentCosts * 0.12, // 12% economia
      implementationCost: 8000,
      roi: (currentCosts * 0.12 * 12) / 8000
    },
    {
      strategy: 'Redução de desperdício por qualidade',
      potentialSavings: currentCosts * 0.05, // 5% economia
      implementationCost: 3000,
      roi: (currentCosts * 0.05 * 12) / 3000
    }
  ]

  const totalSavings = optimizationStrategies.reduce((sum, strategy) => sum + strategy.potentialSavings, 0)
  const optimizedCosts = currentCosts - totalSavings

  const costBreakdown = {
    'Material': currentCosts * 0.35,
    'Mão de obra': currentCosts * 0.30,
    'Overhead': currentCosts * 0.15,
    'Setup/Troca': currentCosts * 0.10,
    'Qualidade': currentCosts * 0.05,
    'Outros': currentCosts * 0.05
  }

  return {
    currentCosts: Math.round(currentCosts * 100) / 100,
    optimizedCosts: Math.round(optimizedCosts * 100) / 100,
    savings: Math.round(totalSavings * 100) / 100,
    costBreakdown,
    optimizationStrategies: optimizationStrategies.map(s => ({
      ...s,
      potentialSavings: Math.round(s.potentialSavings * 100) / 100,
      roi: Math.round(s.roi * 100) / 100
    }))
  }
}

// Funções auxiliares
function mapCategory(formula: string): string {
  const f = formula.toUpperCase()
  if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO')) return 'LÍQUIDOS'
  if (f.includes('HOMEOPATIA') || f.includes('FLORAL')) return 'HOMEOPATIA'
  if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ')) return 'SÓLIDOS'
  if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL')) return 'SEMI-SÓLIDOS'
  return 'OUTROS'
}

function extractTimeSlot(horario: string): string {
  if (!horario) return 'OUTROS'
  if (horario.includes('7:00') || horario.includes('8:00')) return '7:00 AS 8:00'
  if (horario.includes('10:00') || horario.includes('13:00')) return '10:00 AS 13:00'
  if (horario.includes('14:00')) return '14:00'
  if (horario.includes('15:00')) return '15:00'
  if (horario.includes('16:00') || horario.includes('17:00')) return '16:00 AS 17:00'
  return 'OUTROS'
}

function getCategorySetupTime(category: string): number {
  const setupTimes: Record<string, number> = {
    'LÍQUIDOS': 15,
    'HOMEOPATIA': 10,
    'SÓLIDOS': 25,
    'SEMI-SÓLIDOS': 30,
    'OUTROS': 20
  }
  return setupTimes[mapCategory(category)] || 20
}

function getCategoryProcessingTime(category: string): number {
  const processingTimes: Record<string, number> = {
    'LÍQUIDOS': 8,
    'HOMEOPATIA': 5,
    'SÓLIDOS': 15,
    'SEMI-SÓLIDOS': 20,
    'OUTROS': 12
  }
  return processingTimes[mapCategory(category)] || 12
}

function getCategoryComplexity(category: string): number {
  const complexity: Record<string, number> = {
    'LÍQUIDOS': 30,
    'HOMEOPATIA': 20,
    'SÓLIDOS': 50,
    'SEMI-SÓLIDOS': 60,
    'OUTROS': 40
  }
  return complexity[mapCategory(category)] || 40
}

function getOptimalTimeSlot(category: string): string {
  // Horários otimizados por categoria baseado em eficiência
  const optimalSlots: Record<string, string> = {
    'LÍQUIDOS': '10:00 AS 13:00',
    'HOMEOPATIA': '14:00',
    'SÓLIDOS': '10:00 AS 13:00',
    'SEMI-SÓLIDOS': '16:00 AS 17:00',
    'OUTROS': '15:00'
  }
  return optimalSlots[category] || '10:00 AS 13:00'
}

function calculatePriority(category: string, volume: number, setupTime: number): number {
  // Prioridade baseada em volume, margem e tempo de setup
  const marginMultiplier = category === 'HOMEOPATIA' ? 1.5 : category === 'LÍQUIDOS' ? 1.2 : 1.0
  const volumeScore = Math.min(100, volume / 10) // Normalizar volume
  const setupScore = Math.max(10, 100 - setupTime) // Menor setup = maior prioridade
  
  return Math.round((volumeScore * marginMultiplier + setupScore) / 2)
}

function calculateCategoryEfficiency(items: ProcessedOptimizationData[]): number {
  if (items.length === 0) return 0
  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  const totalTime = items.reduce((sum, item) => sum + item.processingTime, 0)
  return totalTime > 0 ? totalValue / totalTime : 0
}

function calculateOptimizedSetupTime(sequence: any[]): number {
  // Redução de setup baseada no agrupamento inteligente
  let totalSetup = 0
  let previousCategory = ''
  
  sequence.forEach(item => {
    if (previousCategory === '') {
      totalSetup += item.setupTime
    } else if (previousCategory !== item.category) {
      // Setup reduzido se categorias similares
      const reduction = getCategorySetupReduction(previousCategory, item.category)
      totalSetup += item.setupTime * (1 - reduction)
    }
    previousCategory = item.category
  })
  
  return totalSetup
}

function getCategorySetupReduction(prev: string, curr: string): number {
  // Redução de setup entre categorias similares
  const reductions: Record<string, Record<string, number>> = {
    'LÍQUIDOS': { 'SEMI-SÓLIDOS': 0.3, 'OUTROS': 0.1 },
    'SÓLIDOS': { 'OUTROS': 0.2 },
    'HOMEOPATIA': { 'LÍQUIDOS': 0.1 }
  }
  
  return reductions[prev]?.[curr] || 0
}

function getTimeSlotCapacity(timeSlot: string): number {
  const capacities: Record<string, number> = {
    '7:00 AS 8:00': 50,
    '10:00 AS 13:00': 200,
    '14:00': 80,
    '15:00': 80,
    '16:00 AS 17:00': 120,
    'OUTROS': 70
  }
  return capacities[timeSlot] || 50
}

function createEmptyOptimization(): OptimizationResult {
  return {
    scheduling: {
      optimizedSequence: [],
      totalTime: 0,
      setupReduction: 0,
      efficiencyGain: 0
    },
    capacity: {
      currentUtilization: 0,
      optimalUtilization: 85,
      bottlenecks: [],
      recommendations: [
        'Processe mais relatórios para análise de capacidade',
        'Configure horários de produção corretamente',
        'Implemente controle de capacidade por categoria'
      ]
    },
    workforce: {
      sellerPerformance: [],
      loadBalancing: []
    },
    quality: {
      errorRates: {},
      qualityScore: 100,
      improvementAreas: []
    },
    costs: {
      currentCosts: 0,
      optimizedCosts: 0,
      savings: 0,
      costBreakdown: {},
      optimizationStrategies: []
    }
  }
}