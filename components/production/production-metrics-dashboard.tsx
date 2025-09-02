"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Zap,
  BarChart3,
  RefreshCw,
  Settings
} from "lucide-react"
import { motion } from "framer-motion"

interface MetricValue {
  id: string
  name: string
  current: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  category: 'performance' | 'quality' | 'efficiency' | 'capacity'
  color: string
  lastUpdated: Date
}

interface ProductionMetricsDashboardProps {
  data: any[]
  insights?: any
  onConfigureMetrics?: () => void
}

export function ProductionMetricsDashboard({ 
  data, 
  insights, 
  onConfigureMetrics 
}: ProductionMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<MetricValue[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    calculateMetrics()
  }, [data, insights])

  const calculateMetrics = () => {
    if (!data || data.length === 0) {
      setMetrics([])
      return
    }

    // Calcular métricas baseado nos dados reais
    const totalFormulas = data.length
    const totalValue = data.reduce((sum, item) => sum + (item.valor || 0), 0)
    const avgTimePerFormula = 12 // Será calculado baseado na categoria
    
    // Análise por categoria
    const categories = data.reduce((acc, item) => {
      const category = mapCategory(item.categoria || item.form_norm || '')
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Análise temporal (simular baseado nos horários)
    const timeSlots = data.reduce((acc, item) => {
      if (item.horario) {
        const slot = item.horario.split(':')[0] + ':00'
        acc[slot] = (acc[slot] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const peakHourLoad = Math.max(...Object.values(timeSlots).map(v => Number(v)))
    const avgHourlyLoad = (Object.values(timeSlots) as number[]).reduce((a: number, b: number) => a + b, 0) / Object.keys(timeSlots).length

    // Simular operadores ativos (baseado na carga)
    const estimatedOperators = Math.min(4, Math.ceil(totalFormulas / 120))
    
    const newMetrics: MetricValue[] = [
      {
        id: 'throughput',
        name: 'Taxa de Produção',
        current: Math.round((totalFormulas / 8) * 10) / 10, // Assumindo 8h de trabalho
        target: 50,
        unit: 'fórmulas/hora',
        trend: totalFormulas > 400 ? 'up' : totalFormulas < 300 ? 'down' : 'stable',
        trendValue: ((totalFormulas / 8 - 45) / 45 * 100),
        status: totalFormulas > 400 ? 'excellent' : totalFormulas > 320 ? 'good' : totalFormulas > 240 ? 'warning' : 'critical',
        category: 'performance',
        color: '#3B82F6',
        lastUpdated: new Date()
      },
      {
        id: 'cycle_time',
        name: 'Tempo de Ciclo',
        current: avgTimePerFormula,
        target: 10,
        unit: 'minutos',
        trend: avgTimePerFormula < 10 ? 'up' : avgTimePerFormula > 15 ? 'down' : 'stable',
        trendValue: ((10 - avgTimePerFormula) / 10 * 100),
        status: avgTimePerFormula <= 10 ? 'excellent' : avgTimePerFormula <= 12 ? 'good' : avgTimePerFormula <= 15 ? 'warning' : 'critical',
        category: 'efficiency',
        color: '#10B981',
        lastUpdated: new Date()
      },
      {
        id: 'queue_utilization',
        name: 'Utilização da Fila',
        current: Math.round((peakHourLoad / 60) * 100),
        target: 85,
        unit: '%',
        trend: peakHourLoad > 50 ? 'up' : peakHourLoad < 30 ? 'down' : 'stable',
        trendValue: (peakHourLoad - avgHourlyLoad) / avgHourlyLoad * 100,
        status: peakHourLoad < 45 ? 'excellent' : peakHourLoad < 55 ? 'good' : peakHourLoad < 65 ? 'warning' : 'critical',
        category: 'capacity',
        color: '#EF4444',
        lastUpdated: new Date()
      },
      {
        id: 'category_balance',
        name: 'Balanceamento',
        current: Math.round(calculateCategoryBalance(categories)),
        target: 25,
        unit: '% desvio',
        trend: calculateCategoryBalance(categories) < 20 ? 'up' : 'down',
        trendValue: (25 - calculateCategoryBalance(categories)) / 25 * 100,
        status: calculateCategoryBalance(categories) < 15 ? 'excellent' : calculateCategoryBalance(categories) < 25 ? 'good' : calculateCategoryBalance(categories) < 35 ? 'warning' : 'critical',
        category: 'efficiency',
        color: '#8B5CF6',
        lastUpdated: new Date()
      },
      {
        id: 'operator_productivity',
        name: 'Produtividade',
        current: Math.round(totalFormulas / estimatedOperators),
        target: 65,
        unit: 'fórmulas/operador',
        trend: (totalFormulas / estimatedOperators) > 60 ? 'up' : (totalFormulas / estimatedOperators) < 45 ? 'down' : 'stable',
        trendValue: ((totalFormulas / estimatedOperators - 55) / 55 * 100),
        status: (totalFormulas / estimatedOperators) > 65 ? 'excellent' : (totalFormulas / estimatedOperators) > 55 ? 'good' : (totalFormulas / estimatedOperators) > 45 ? 'warning' : 'critical',
        category: 'performance',
        color: '#06B6D4',
        lastUpdated: new Date()
      },
      {
        id: 'daily_target',
        name: 'Meta Diária',
        current: Math.round((totalFormulas / 500) * 100), // Meta de 500 fórmulas/dia
        target: 100,
        unit: '% da meta',
        trend: totalFormulas > 500 ? 'up' : totalFormulas < 400 ? 'down' : 'stable',
        trendValue: ((totalFormulas - 450) / 450 * 100),
        status: totalFormulas > 500 ? 'excellent' : totalFormulas > 450 ? 'good' : totalFormulas > 350 ? 'warning' : 'critical',
        category: 'performance',
        color: '#F97316',
        lastUpdated: new Date()
      }
    ]

    setMetrics(newMetrics)
    setLastRefresh(new Date())
  }

  const mapCategory = (formula: string): string => {
    const f = formula.toUpperCase()
    if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO')) return 'LÍQUIDOS'
    if (f.includes('HOMEOPATIA') || f.includes('FLORAL')) return 'HOMEOPATIA'
    if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ')) return 'SÓLIDOS'
    if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL')) return 'SEMI-SÓLIDOS'
    return 'OUTROS'
  }

  const calculateCategoryBalance = (categories: Record<string, number>): number => {
    const values = Object.values(categories)
    const total = values.reduce((a, b) => a + b, 0)
    const percentages = values.map(v => (v / total) * 100)
    const idealPercentage = 100 / values.length
    const deviations = percentages.map(p => Math.abs(p - idealPercentage))
    return deviations.reduce((a, b) => a + b, 0) / values.length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400 bg-green-500/20'
      case 'good': return 'text-blue-400 bg-blue-500/20'
      case 'warning': return 'text-yellow-400 bg-yellow-500/20'
      case 'critical': return 'text-red-400 bg-red-500/20'
      default: return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-400" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />
      default: return <Activity className="h-4 w-4 text-slate-400" />
    }
  }

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Activity className="h-4 w-4 text-slate-400" />
  }

  const refreshMetrics = () => {
    setIsLoading(true)
    setTimeout(() => {
      calculateMetrics()
      setIsLoading(false)
    }, 1000)
  }

  const criticalMetrics = metrics.filter(m => m.status === 'critical')
  const warningMetrics = metrics.filter(m => m.status === 'warning')
  const excellentMetrics = metrics.filter(m => m.status === 'excellent')

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <Activity className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>Nenhum dado de produção disponível</p>
            <p className="text-sm mt-2">Processe relatórios para visualizar métricas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            Dashboard de Métricas de Produção
          </h3>
          <p className="text-slate-300">
            Monitoramento em tempo real • Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshMetrics}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {onConfigureMetrics && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onConfigureMetrics}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurar
            </Button>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {criticalMetrics.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> {criticalMetrics.length} métrica(s) crítica(s) detectada(s): {criticalMetrics.map(m => m.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-300">{excellentMetrics.length}</div>
            <div className="text-sm text-slate-300">Excelentes</div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-300">{metrics.filter(m => m.status === 'good').length}</div>
            <div className="text-sm text-slate-300">Boas</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-300">{warningMetrics.length}</div>
            <div className="text-sm text-slate-300">Atenção</div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-300">{criticalMetrics.length}</div>
            <div className="text-sm text-slate-300">Críticas</div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`transition-colors border-l-4`} style={{ borderLeftColor: metric.color }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    <CardTitle className="text-base text-slate-100">{metric.name}</CardTitle>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                    {metric.status === 'excellent' ? 'Excelente' :
                     metric.status === 'good' ? 'Boa' :
                     metric.status === 'warning' ? 'Atenção' : 'Crítica'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Current Value */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold text-slate-100" style={{ color: metric.color }}>
                      {metric.current}
                    </div>
                    <div className="text-sm text-slate-400">{metric.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      {getTrendIcon(metric.trend, metric.trendValue)}
                      <span className={metric.trend === 'up' ? 'text-green-400' : 
                                    metric.trend === 'down' ? 'text-red-400' : 'text-slate-400'}>
                        {Math.abs(metric.trendValue).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">vs anterior</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Meta: {metric.target} {metric.unit}</span>
                    <span className="text-slate-300">
                      {Math.round((metric.current / metric.target) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((metric.current / metric.target) * 100, 100)} 
                    className="h-2"
                  />
                </div>

                {/* Last Updated */}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  Atualizado há {Math.floor((new Date().getTime() - metric.lastUpdated.getTime()) / 1000)}s
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}