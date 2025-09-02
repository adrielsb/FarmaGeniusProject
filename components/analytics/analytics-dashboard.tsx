
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Activity,
  Calendar,
  Award,
  RefreshCw,
  CreditCard
} from "lucide-react"
import { motion } from "framer-motion"
import { TrendChart } from "./charts/trend-chart"
import { SellerRanking } from "./charts/seller-ranking"
import { HeatMap } from "./charts/heat-map"
import { ABCChart } from "./charts/abc-chart"
import { InsightsPanel } from "./insights-panel"
import { ComparativeMetrics } from "./comparative-metrics"
import { DefaultersManagement } from "./defaulters-management"

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAnalyticsData(result.data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span>Carregando análises...</span>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Análises Disponíveis</h3>
        <p className="text-gray-600 mb-6">
          Processe alguns relatórios para ver análises detalhadas aqui. 
        </p>
        <p className="text-sm text-gray-500">
          💡 Esta seção inclui: Tendências, Vendedores, Dados Financeiros, Controle de Pagamentos e muito mais!
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análise de Dados</h2>
          <p className="text-gray-600">
            Insights detalhados dos últimos {period} dias • {analyticsData.summary?.current?.totalReports || 0} relatórios
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimas 2 semanas</SelectItem>
              <SelectItem value="30">Último mês</SelectItem>
              <SelectItem value="60">Últimos 2 meses</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadAnalytics} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Métricas resumidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ComparativeMetrics 
          data={analyticsData.summary}
          comparisons={analyticsData.comparisons}
        />
      </motion.div>

      {/* Tabs de análises */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="sellers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="temporal" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="defaulters" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Inadimplentes
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card de Performance Geral */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    Performance Geral
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Valor Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {(analyticsData.summary?.current?.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantidade Total</p>
                      <p className="text-xl font-semibold">
                        {(analyticsData.summary?.current?.totalQuantity || 0).toLocaleString()} itens
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor Médio por Relatório</p>
                      <p className="text-lg font-semibold">
                        R$ {(analyticsData.summary?.current?.avgReportValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Vendedor */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    Top Vendedor
                    <Award className="h-5 w-5 text-blue-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData.sellers?.topPerformer ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {analyticsData.sellers.topPerformer.name}
                        </p>
                        <Badge variant="secondary">#{1}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Valor Total</p>
                        <p className="text-xl font-semibold">
                          R$ {analyticsData.sellers.topPerformer.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ticket Médio</p>
                        <p className="text-lg">
                          R$ {analyticsData.sellers.topPerformer.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>

              {/* Horário de Pico */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    Horário de Pico
                    <Clock className="h-5 w-5 text-orange-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData.temporal?.peakHours?.[0] ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-lg font-bold text-orange-600">
                          {analyticsData.temporal.peakHours[0][0]}
                        </p>
                        <Badge variant="outline">Melhor horário</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Volume</p>
                        <p className="text-xl font-semibold">
                          {analyticsData.temporal.peakHours[0][1]} vendas
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráficos de Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analyticsData.trends?.categoryTrends && (
                <TrendChart 
                  data={analyticsData.trends.categoryTrends.slice(0, 5)}
                  title="Top 5 Categorias - Tendência"
                  type="category"
                />
              )}

              {analyticsData.temporal?.heatmapData && (
                <HeatMap 
                  data={analyticsData.temporal.heatmapData}
                  title="Distribuição de Vendas por Horário"
                />
              )}
            </div>
          </TabsContent>

          {/* TENDÊNCIAS */}
          <TabsContent value="trends" className="space-y-6">
            {analyticsData.trends?.categoryTrends && (
              <TrendChart 
                data={analyticsData.trends.categoryTrends}
                title="Tendências por Categoria"
                type="category"
                height={400}
              />
            )}

            {analyticsData.trends?.monthlyGrowth && analyticsData.trends.monthlyGrowth.length > 0 && (
              <TrendChart 
                data={analyticsData.trends.monthlyGrowth}
                title="Crescimento Mensal"
                type="monthly"
                height={300}
              />
            )}
          </TabsContent>

          {/* VENDEDORES */}
          <TabsContent value="sellers" className="space-y-6">
            {analyticsData.sellers?.ranking && (
              <SellerRanking 
                data={analyticsData.sellers.ranking}
                totalSellers={analyticsData.sellers.totalSellers}
              />
            )}
          </TabsContent>

          {/* HORÁRIOS */}
          <TabsContent value="temporal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analyticsData.temporal?.heatmapData && (
                <HeatMap 
                  data={analyticsData.temporal.heatmapData}
                  title="Heat Map de Vendas por Horário"
                  height={400}
                />
              )}

              {analyticsData.temporal?.dailyDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Distribuição por Dia da Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analyticsData.temporal.dailyDistribution)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .map((entry) => {
                          const day = entry[0]
                          const count = entry[1] as number
                          return (
                        <div key={day} className="flex items-center justify-between">
                          <span className="font-medium">{day}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${(count / Math.max(...Object.values(analyticsData.temporal.dailyDistribution) as number[])) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{count}</span>
                          </div>
                        </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* FINANCEIRO */}
          <TabsContent value="financial" className="space-y-6">
            {analyticsData.financial?.abcAnalysis && (
              <ABCChart 
                data={analyticsData.financial.abcAnalysis}
                title="Análise ABC dos Produtos"
              />
            )}

            {analyticsData.financial?.categoryRentability && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Rentabilidade por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.financial.categoryRentability.slice(0, 8).map((category: any, index: number) => (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium text-slate-100">{category.category}</p>
                            <p className="text-sm text-slate-300">{category.totalQuantity} itens</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-300">
                            R$ {category.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-slate-300">
                            {category.valuePercent.toFixed(1)}% do total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* INADIMPLENTES */}
          <TabsContent value="defaulters">
            <DefaultersManagement />
          </TabsContent>

          {/* INSIGHTS */}
          <TabsContent value="insights">
            <InsightsPanel 
              insights={analyticsData.insights}
              comparisons={analyticsData.comparisons}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
