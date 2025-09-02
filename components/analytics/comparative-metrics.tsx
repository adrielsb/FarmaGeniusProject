
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  BarChart3,
  Calendar,
  Users,
  Target,
  Activity
} from "lucide-react"
import { motion } from "framer-motion"

interface ComparativeMetricsProps {
  data: {
    current: {
      totalReports: number
      totalValue: number
      totalQuantity: number
      avgReportValue: number
    }
    historical: {
      totalReports: number
      totalValue: number
      totalQuantity: number
      avgReportValue: number
    }
  }
  comparisons: {
    available: boolean
    valueGrowth?: number
    quantityGrowth?: number
    current?: {
      value: number
      quantity: number
    }
    previous?: {
      value: number
      quantity: number
    }
    message?: string
  }
}

export function ComparativeMetrics({ data, comparisons }: ComparativeMetricsProps) {
  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  const formatPercent = (value: number) => {
    const safeValue = value || 0
    const sign = safeValue >= 0 ? '+' : ''
    return `${sign}${safeValue.toFixed(1)}%`
  }

  const getGrowthColor = (value?: number) => {
    if (value === undefined) return 'text-gray-500'
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getGrowthIcon = (value?: number) => {
    if (value === undefined) return null
    return value >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getGrowthBadge = (value?: number) => {
    if (value === undefined) return null
    
    const variant = value >= 0 ? 'default' : 'destructive'
    const text = value >= 0 ? 'Crescimento' : 'Declínio'
    
    return (
      <Badge variant={variant} className="text-xs">
        {text}
      </Badge>
    )
  }

  const metrics = [
    {
      title: "Valor Total",
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
      current: formatCurrency(data.current.totalValue),
      historical: formatCurrency(data.historical.totalValue),
      growth: comparisons.valueGrowth,
      description: "Receita gerada no período",
      color: "green"
    },
    {
      title: "Quantidade Total",
      icon: <Package className="h-5 w-5 text-blue-500" />,
      current: data.current.totalQuantity.toLocaleString(),
      historical: data.historical.totalQuantity.toLocaleString(),
      growth: comparisons.quantityGrowth,
      description: "Itens processados",
      color: "blue"
    },
    {
      title: "Relatórios Processados",
      icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
      current: data.current.totalReports.toLocaleString(),
      historical: data.historical.totalReports.toLocaleString(),
      growth: data.historical.totalReports > 0 ? 
        ((data.current.totalReports - data.historical.totalReports) / data.historical.totalReports) * 100 : 0,
      description: "Relatórios no sistema",
      color: "purple"
    },
    {
      title: "Valor Médio/Relatório",
      icon: <Target className="h-5 w-5 text-orange-500" />,
      current: formatCurrency(data.current.avgReportValue),
      historical: formatCurrency(data.historical.avgReportValue),
      growth: data.historical.avgReportValue > 0 ? 
        ((data.current.avgReportValue - data.historical.avgReportValue) / data.historical.avgReportValue) * 100 : 0,
      description: "Ticket médio por relatório",
      color: "orange"
    }
  ]

  return (
    <div className="space-y-4">
      {/* Grid de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 border-l-${metric.color}-500`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {metric.icon}
                    {metric.title}
                  </div>
                  {getGrowthBadge(metric.growth)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Valor atual */}
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.current}
                    </p>
                    <p className="text-xs text-gray-600">{metric.description}</p>
                  </div>

                  {/* Comparação com crescimento */}
                  {metric.growth !== undefined && comparisons.available && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {getGrowthIcon(metric.growth)}
                        <span className={`text-sm font-medium ${getGrowthColor(metric.growth)}`}>
                          {formatPercent(metric.growth)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">vs período anterior</span>
                    </div>
                  )}

                  {/* Barra de progresso para contexto histórico */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Período</span>
                      <span>Histórico</span>
                    </div>
                    <Progress 
                      value={data.historical.totalValue > 0 ? 
                        Math.min((data.current.totalValue / data.historical.totalValue) * 50, 100) : 50
                      } 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Card de contexto histórico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contexto Histórico</h3>
                  <p className="text-sm text-gray-600">
                    {data.historical.totalReports} relatórios • {formatCurrency(data.historical.totalValue)} em vendas
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Dados históricos</span>
                </div>
                {comparisons.available ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Comparação com período anterior disponível
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {comparisons.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Métricas adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Eficiência</p>
                  <p className="text-lg font-bold">
                    {data.current.totalReports > 0 ? 
                      (data.current.totalQuantity / data.current.totalReports).toFixed(1) : '0'
                    }
                  </p>
                  <p className="text-xs text-gray-500">itens/relatório</p>
                </div>
                <div className="text-right">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                  <p className="text-lg font-bold">
                    {data.current.totalQuantity > 0 ? 
                      formatCurrency(data.current.totalValue / data.current.totalQuantity) : formatCurrency(0)
                    }
                  </p>
                  <p className="text-xs text-gray-500">por item</p>
                </div>
                <div className="text-right">
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Crescimento</p>
                  <div className="flex items-center gap-2">
                    {getGrowthIcon(comparisons.valueGrowth)}
                    <p className={`text-lg font-bold ${getGrowthColor(comparisons.valueGrowth)}`}>
                      {comparisons.valueGrowth !== undefined ? 
                        formatPercent(comparisons.valueGrowth) : 'N/A'
                      }
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">em valor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
