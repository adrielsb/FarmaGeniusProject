"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { toast } from "sonner"

interface ExecutiveDashboardProps {
  period?: number
}

interface ExecutiveMetrics {
  financial: {
    totalRevenue: number
    grossProfit: number
    netMargin: number
    revenueGrowth: number
    profitGrowth: number
    avgRevenuePerFormula?: number
    avgDailyRevenue?: number
  }
  operational: {
    totalVolume: number
    utilizationRate: number
    efficiencyGain: number
    qualityScore: number
    avgFormulasPerDay?: number
    uniqueSellers?: number
  }
  forecasting: {
    nextMonthRevenue: number
    nextMonthVolume: number
    growthTrend: string
    confidence: number
  }
  optimization: {
    potentialSavings: number
    setupReduction: number
    bottlenecks: number
    recommendations: number
  }
  risks: {
    riskScore: number
    concentration: number
    volatility: number
    alerts: string[]
  }
  opportunities: {
    underperformingCategories: number
    pricingOptimization: number
    marketGrowth: number
    roi: number
  }
  summary?: {
    topSeller: string
    totalReports: number
    analysisPeriod: number
    dataQuality: string
  }
}

export function ExecutiveDashboard({ period = 30 }: ExecutiveDashboardProps) {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadExecutiveMetrics()
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadExecutiveMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [period])

  const loadExecutiveMetrics = async () => {
    setIsLoading(true)
    try {
      // Carregar dados reais do histórico
      const response = await fetch(`/api/executive-dashboard?period=${period}`)
      const data = await response.json()

      if (data.success && data.metrics) {
        setMetrics(data.metrics)
        setLastUpdated(new Date())
        toast.success(`Dashboard atualizado com ${data.reportsAnalyzed} relatórios`)
      } else {
        console.warn('Dados insuficientes para dashboard:', data.error)
        // Não mostrar erro se for apenas falta de dados
        if (!data.error?.includes('Nenhum relatório')) {
          toast.error('Erro ao carregar métricas executivas')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Executivo</h1>
            <p className="text-slate-300">Carregando métricas estratégicas...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Executivo</h1>
            <p className="text-slate-300">Sistema de Business Intelligence Farmacêutico</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Dados Insuficientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">
              Não há dados suficientes para gerar o dashboard executivo. Processe relatórios para visualizar métricas estratégicas.
            </p>
            <Button onClick={loadExecutiveMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
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
          <h1 className="text-3xl font-bold text-white">Dashboard Executivo</h1>
          <p className="text-slate-300">
            Inteligência de negócios baseada em dados reais • Última atualização: {lastUpdated.toLocaleTimeString()}
          </p>
          {metrics?.summary && (
            <p className="text-slate-400 text-sm">
              Analisando {metrics.summary.totalReports} relatórios • 
              Top vendedor: {metrics.summary.topSeller} • 
              Qualidade dos dados: {metrics.summary.dataQuality}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/20 text-green-300">
            Período: {period} dias
          </Badge>
          <Button onClick={loadExecutiveMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics.risks.alerts.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticos ({metrics.risks.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.risks.alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 text-orange-200">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  {alert}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Revenue KPI */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-200">Receita Total</p>
                <p className="text-2xl font-bold text-green-300">
                  R$ {(metrics.financial.totalRevenue / 1000).toFixed(0)}K
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(metrics.financial.revenueGrowth)}
                  <span className="text-green-200">
                    {Math.abs(metrics.financial.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit KPI */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Target className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-200">Margem Líquida</p>
                <p className="text-2xl font-bold text-blue-300">
                  {metrics.financial.netMargin.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(metrics.financial.profitGrowth)}
                  <span className="text-blue-200">
                    Lucro: {Math.abs(metrics.financial.profitGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Efficiency KPI */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Zap className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-purple-200">Eficiência</p>
                <p className="text-2xl font-bold text-purple-300">
                  {metrics.operational.utilizationRate.toFixed(0)}%
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-purple-200">
                    Qualidade: {metrics.operational.qualityScore.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forecast KPI */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-orange-200">Próximo Mês</p>
                <p className="text-2xl font-bold text-orange-300">
                  R$ {(metrics.forecasting.nextMonthRevenue / 1000).toFixed(0)}K
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <Activity className="h-3 w-3 text-orange-400" />
                  <span className="text-orange-200">
                    Confiança: {metrics.forecasting.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="strategy">Estratégia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Geral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilização de Capacidade</span>
                    <span>{metrics.operational.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.operational.utilizationRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Margem de Lucro</span>
                    <span>{metrics.financial.netMargin.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.financial.netMargin} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Qualidade</span>
                    <span>{metrics.operational.qualityScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.operational.qualityScore} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Previsão (Confiança)</span>
                    <span>{metrics.forecasting.confidence}%</span>
                  </div>
                  <Progress value={metrics.forecasting.confidence} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Avaliação de Riscos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Score de Risco Geral</span>
                  <Badge variant={metrics.risks.riskScore > 70 ? "destructive" : metrics.risks.riskScore > 40 ? "secondary" : "default"}>
                    {metrics.risks.riskScore.toFixed(0)}/100
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Concentração</span>
                    <span>{metrics.risks.concentration.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.risks.concentration} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Volatilidade</span>
                    <span>{metrics.risks.volatility.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(100, metrics.risks.volatility)} className="h-2" />
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-400 mb-2">Gargalos Identificados:</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{metrics.optimization.bottlenecks}</Badge>
                    <span className="text-xs text-slate-300">pontos críticos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Oportunidades de Otimização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">
                    R$ {(metrics.optimization.potentialSavings / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-green-200">Economia Potencial</div>
                </div>
                
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">
                    {metrics.optimization.setupReduction.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-200">Redução Setup</div>
                </div>
                
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400">
                    {metrics.opportunities.pricingOptimization}
                  </div>
                  <div className="text-sm text-purple-200">Ajustes de Preço</div>
                </div>
                
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-400">
                    {metrics.opportunities.roi.toFixed(1)}x
                  </div>
                  <div className="text-sm text-orange-200">ROI Médio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Receita Total</p>
                    <p className="text-2xl font-bold">R$ {metrics.financial.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Lucro Bruto</p>
                    <p className="text-2xl font-bold">R$ {metrics.financial.grossProfit.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-400 mb-2">Crescimento vs Período Anterior</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metrics.financial.revenueGrowth)}
                      <span>Receita: {metrics.financial.revenueGrowth.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metrics.financial.profitGrowth)}
                      <span>Lucro: {metrics.financial.profitGrowth.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previsões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Próximo Mês</p>
                  <p className="text-xl font-bold">R$ {metrics.forecasting.nextMonthRevenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Confiança: {metrics.forecasting.confidence}%</p>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-slate-400">Tendência</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(metrics.forecasting.growthTrend)}
                    <span className="capitalize">{metrics.forecasting.growthTrend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Eficiência Operacional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Utilização da Capacidade</span>
                    <span>{metrics.operational.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.operational.utilizationRate} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ganho de Eficiência</span>
                    <span>{metrics.operational.efficiencyGain.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.max(0, metrics.operational.efficiencyGain)} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score de Qualidade</span>
                    <span>{metrics.operational.qualityScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.operational.qualityScore} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Otimizações Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                  <div>
                    <p className="font-medium">Redução de Setup</p>
                    <p className="text-sm text-slate-400">Sequenciamento otimizado</p>
                  </div>
                  <Badge>{metrics.optimization.setupReduction.toFixed(1)}%</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <div>
                    <p className="font-medium">Economia Potencial</p>
                    <p className="text-sm text-slate-400">Otimizações de custo</p>
                  </div>
                  <Badge>R$ {(metrics.optimization.potentialSavings / 1000).toFixed(0)}K</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                  <div>
                    <p className="font-medium">Recomendações</p>
                    <p className="text-sm text-slate-400">Ações sugeridas</p>
                  </div>
                  <Badge>{metrics.optimization.recommendations}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades de Mercado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Categorias Sub-performantes</h4>
                  <p className="text-2xl font-bold">{metrics.opportunities.underperformingCategories}</p>
                  <p className="text-sm text-slate-400">categorias com potencial de melhoria</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Otimização de Preços</h4>
                  <p className="text-2xl font-bold">{metrics.opportunities.pricingOptimization}</p>
                  <p className="text-sm text-slate-400">produtos com potencial de aumento</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Crescimento de Mercado</h4>
                  <p className="text-2xl font-bold">{metrics.opportunities.marketGrowth.toFixed(1)}%</p>
                  <p className="text-sm text-slate-400">potencial de expansão</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações Estratégicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="font-medium text-green-300">💡 Expansão de Capacidade</p>
                  <p className="text-sm text-green-200">
                    Considerar expansão nos horários de pico identificados
                  </p>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="font-medium text-blue-300">📊 Otimização de Preços</p>
                  <p className="text-sm text-blue-200">
                    {metrics.opportunities.pricingOptimization} produtos com potencial de aumento
                  </p>
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="font-medium text-purple-300">⚡ Eficiência Operacional</p>
                  <p className="text-sm text-purple-200">
                    ROI médio de {metrics.opportunities.roi.toFixed(1)}x nas otimizações
                  </p>
                </div>

                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="font-medium text-orange-300">🎯 Diversificação</p>
                  <p className="text-sm text-orange-200">
                    Reduzir concentração de risco em categorias principais
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  function getTrendIcon(value: number | string) {
    if (typeof value === 'string') {
      switch (value) {
        case 'up': return <ArrowUp className="h-3 w-3 text-green-400" />
        case 'down': return <ArrowDown className="h-3 w-3 text-red-400" />
        default: return <Minus className="h-3 w-3 text-slate-400" />
      }
    }
    
    if (value > 2) return <ArrowUp className="h-3 w-3 text-green-400" />
    if (value < -2) return <ArrowDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-slate-400" />
  }
}