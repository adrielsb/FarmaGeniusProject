"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Factory, BarChart3, Settings, Activity, Clock, Users, Package, AlertTriangle, TrendingUp, Target, Zap, ArrowUp, ArrowDown, Minus } from "lucide-react"
import { toast } from "sonner"

interface ProductionInsights {
  summary: {
    totalFormulas: number
    totalValue: number
    totalDays: number
    avgFormulasPerDay: number
  }
  categories: Record<string, number>
  hourlyData: Record<string, number>
  vendorData: Record<string, { formulas: number, value: number }>
  performance: {
    efficiency: number
    capacity_utilization: number
    category_balance: number
    bottlenecks: string[]
  }
  recommendations: string[]
  trends: {
    daily_volume: {
      current: number
      target: number
      trend: string
      change?: number
    }
    category_balance: {
      current: number
      target: number
      trend: string
    }
  }
  sequencing: {
    suggested_order: Array<{
      category: string
      count: number
      estimatedMinutes: number
      order: number
    }>
    total_estimated_time: {
      minutes: number
      hours: number
      remaining_minutes?: number
    }
    efficiency_tips: string[]
  }
  insights: {
    peak_hours: Array<{ hour: string, count: number }>
    top_categories: Array<{ category: string, count: number }>
    top_vendors: Array<{ vendor: string, formulas: number, value: number }>
  }
}

interface EnhancedProductionViewProps {
  data: any[]
  currentHour: string
}

// Função para mapear dados da nova API para o formato esperado
function mapProductionDataToInsights(metrics: any, data: any[]): ProductionInsights {
  return {
    summary: {
      totalFormulas: metrics.overview.totalItems,
      totalValue: metrics.overview.totalValue,
      totalDays: 7, // Período padrão
      avgFormulasPerDay: Math.round(metrics.overview.totalItems / 7)
    },
    categories: Object.fromEntries(
      Object.entries(metrics.categories.distribution).map(([cat, data]: [string, any]) => [cat, data.count])
    ),
    hourlyData: metrics.schedule.hourlyDistribution,
    vendorData: Object.fromEntries(
      Object.entries(metrics.vendors.performance).map(([vendor, perf]: [string, any]) => [
        vendor, 
        { formulas: perf.count, value: perf.value }
      ])
    ),
    performance: {
      efficiency: metrics.overview.efficiency,
      capacity_utilization: metrics.schedule.currentLoad,
      category_balance: Object.keys(metrics.categories.distribution).length > 3 ? 85 : 95,
      bottlenecks: metrics.bottlenecks.identified
    },
    recommendations: metrics.quality.recommendations.concat(metrics.bottlenecks.solutions),
    trends: {
      daily_volume: {
        current: Math.round(metrics.overview.totalItems / 7),
        target: 50,
        trend: metrics.overview.totalItems > 200 ? 'up' : metrics.overview.totalItems < 100 ? 'down' : 'stable',
        change: 5.2
      },
      category_balance: {
        current: Object.keys(metrics.categories.distribution).length,
        target: 4,
        trend: 'stable'
      }
    },
    sequencing: {
      suggested_order: metrics.schedule.recommendedSequence.map((item: any, index: number) => ({
        category: item.category,
        count: item.quantity,
        estimatedMinutes: item.estimatedTime * item.quantity,
        order: index + 1
      })),
      total_estimated_time: {
        minutes: metrics.overview.estimatedProductionTime.minutes,
        hours: metrics.overview.estimatedProductionTime.hours,
        remaining_minutes: metrics.overview.estimatedProductionTime.minutes % 60
      },
      efficiency_tips: metrics.quality.recommendations.slice(0, 3) || ['Otimizar sequenciamento', 'Balancear categorias', 'Melhorar distribuição horária']
    },
    insights: {
      peak_hours: Object.entries(metrics.schedule.hourlyDistribution)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([hour, count]) => ({ hour, count: count as number })),
      top_categories: Object.entries(metrics.categories.distribution)
        .sort((a, b) => (b[1] as any).count - (a[1] as any).count)
        .slice(0, 5)
        .map(([category, data]) => ({ category, count: (data as any).count })),
      top_vendors: Object.entries(metrics.vendors.performance)
        .sort((a, b) => (b[1] as any).value - (a[1] as any).value)
        .slice(0, 5)
        .map(([vendor, perf]) => ({ 
          vendor, 
          formulas: (perf as any).count, 
          value: (perf as any).value 
        }))
    }
  }
}

export function EnhancedProductionView({ data, currentHour }: EnhancedProductionViewProps) {
  const [insights, setInsights] = useState<ProductionInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadInsights()
  }, [data])

  const loadInsights = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/production?period=7')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.metrics) {
          // Mapear dados da nova API para o formato esperado pelo componente
          const mappedInsights = mapProductionDataToInsights(result.metrics, result.data)
          setInsights(mappedInsights)
          toast.success(`Insights carregados com ${result.totalItems} itens de produção`)
        } else {
          console.warn('Dados insuficientes para insights de produção:', result.error)
          // Não mostrar erro se for apenas falta de dados
          if (!result.error?.includes('Nenhum relatório')) {
            toast.error('Erro ao carregar insights de produção')
          }
        }
      } else {
        toast.error('Erro ao carregar insights de produção')
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error)
      toast.error('Erro ao carregar insights de produção')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Factory className="h-8 w-8 text-blue-400" />
              Gestão de Produção
            </h2>
            <p className="text-slate-300">Carregando insights de produção...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Factory className="h-8 w-8 text-blue-400" />
              Gestão de Produção
            </h2>
            <p className="text-slate-300">Sistema de monitoramento e otimização da produção farmacêutica</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Dashboard de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-400">
              <Factory className="mx-auto h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Nenhum dado de produção disponível
              </h3>
              <p className="text-slate-400">
                Processe relatórios para visualizar insights e métricas de produção
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Factory className="h-8 w-8 text-blue-400" />
            Gestão de Produção
          </h2>
          <p className="text-slate-300">
            Sistema inteligente de otimização da produção farmacêutica
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/20 text-green-300">
            {insights.summary.totalFormulas} fórmulas processadas
          </Badge>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300">
            Insights em tempo real
          </Badge>
          <Button onClick={loadInsights} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-300">Volume Diário</p>
                <p className="text-2xl font-bold text-blue-300">
                  {insights.summary.avgFormulasPerDay}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(insights.trends.daily_volume.trend)}
                  <span className="text-slate-400">
                    Meta: {insights.trends.daily_volume.target}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-slate-300">Eficiência</p>
                <p className="text-2xl font-bold text-green-300">
                  {insights.performance.efficiency}%
                </p>
                <p className="text-xs text-slate-400">
                  Balanceamento de categorias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-slate-300">Capacidade</p>
                <p className="text-2xl font-bold text-purple-300">
                  {insights.performance.capacity_utilization}%
                </p>
                <p className="text-xs text-slate-400">
                  Utilização atual
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-sm text-slate-300">Tempo Total</p>
                <p className="text-2xl font-bold text-orange-300">
                  {insights.sequencing.total_estimated_time.hours}h
                </p>
                <p className="text-xs text-slate-400">
                  {insights.sequencing.total_estimated_time.remaining_minutes}min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sequencing">Sequenciamento</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(insights.categories).map(([category, count]) => {
                    const percentage = (count / insights.summary.totalFormulas) * 100
                    const color = getCategoryColor(category)
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color}`}></div>
                            <span className="font-medium text-slate-200">{category}</span>
                          </div>
                          <span className="text-slate-300">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horários de Pico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(insights?.insights?.peak_hours || []).map((item, index) => (
                    <div key={item.hour} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="font-medium text-slate-200">{item.hour}</span>
                      </div>
                      <span className="text-slate-300 font-bold">{item.count} fórmulas</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recomendações de Otimização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequencing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sequenciamento Otimizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.sequencing.suggested_order.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <h4 className="font-medium text-slate-200">{item.category}</h4>
                        <p className="text-sm text-slate-400">{item.count} fórmulas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-200">{item.estimatedMinutes} min</p>
                      <p className="text-xs text-slate-400">tempo estimado</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h4 className="font-medium text-green-300 mb-2">Dicas de Eficiência</h4>
                <ul className="space-y-1">
                  {insights.sequencing.efficiency_tips.map((tip, index) => (
                    <li key={index} className="text-sm text-green-200">• {tip}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Eficiência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{insights.performance.efficiency}%</div>
                <p className="text-xs text-slate-400">Balanceamento ideal: 100%</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Utilização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{insights.performance.capacity_utilization}%</div>
                <p className="text-xs text-slate-400">Capacidade atual</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Desvio Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">{insights.performance.category_balance}%</div>
                <p className="text-xs text-slate-400">Menor é melhor</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottlenecks */}
          {insights.performance.bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Gargalos Identificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.performance.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-300">{bottleneck}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(insights?.insights?.top_categories || []).map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-slate-200">{item.category}</span>
                      </div>
                      <span className="font-bold text-slate-300">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Vendors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Vendedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(insights?.insights?.top_vendors || []).map((item, index) => (
                    <div key={item.vendor} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-slate-200">{item.vendor}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-300">{item.formulas}</div>
                        <div className="text-xs text-slate-400">R$ {item.value.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  function getTrendIcon(trend: string) {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-3 w-3 text-green-400" />
      case "down":
        return <ArrowDown className="h-3 w-3 text-red-400" />
      default:
        return <Minus className="h-3 w-3 text-slate-400" />
    }
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case 'LÍQUIDOS': return 'bg-blue-500'
      case 'HOMEOPATIA': return 'bg-green-500'
      case 'SÓLIDOS': return 'bg-yellow-500'
      case 'SEMI-SÓLIDOS': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }
}