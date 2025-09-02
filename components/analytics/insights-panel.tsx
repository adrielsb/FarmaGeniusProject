
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Zap,
  Info,
  AlertCircle,
  XCircle
} from "lucide-react"
import { motion } from "framer-motion"

interface InsightsPanelProps {
  insights: {
    insights: Array<{
      type: string
      title: string
      description: string
      value?: number
      trend?: 'positive' | 'negative' | 'neutral'
    }>
    alerts: Array<{
      type: 'positive' | 'negative' | 'neutral'
      title: string
      description: string
      severity: 'success' | 'warning' | 'error' | 'info'
    }>
    recommendations: Array<{
      type: string
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
    }>
    summary: {
      totalInsights: number
      totalAlerts: number
      totalRecommendations: number
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

export function InsightsPanel({ insights, comparisons }: InsightsPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'growth': return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'decline': return <TrendingDown className="h-5 w-5 text-red-500" />
      default: return <Lightbulb className="h-5 w-5 text-yellow-500" />
    }
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertVariant = (severity: string): 'default' | 'destructive' => {
    return severity === 'error' ? 'destructive' : 'default'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-blue-500'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const formatValue = (value: number) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-purple-500" />
          Insights e Alertas Inteligentes
        </h3>
        <p className="text-gray-600">
          {insights.summary.totalInsights} insights • {insights.summary.totalAlerts} alertas • {insights.summary.totalRecommendations} recomendações
        </p>
      </div>

      {/* Comparações com período anterior */}
      {comparisons.available && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Comparação com Período Anterior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Crescimento em Valor</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(comparisons.valueGrowth! >= 0 ? 'positive' : 'negative')}
                      <span className={`font-bold ${comparisons.valueGrowth! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(comparisons.valueGrowth!)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Atual: {formatValue(comparisons.current!.value)}</span>
                    <span className="text-gray-500">Anterior: {formatValue(comparisons.previous!.value)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Crescimento em Quantidade</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(comparisons.quantityGrowth! >= 0 ? 'positive' : 'negative')}
                      <span className={`font-bold ${comparisons.quantityGrowth! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(comparisons.quantityGrowth!)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Atual: {comparisons.current!.quantity.toLocaleString()}</span>
                    <span className="text-gray-500">Anterior: {comparisons.previous!.quantity.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!comparisons.available && comparisons.message && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {comparisons.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Insights ({insights.insights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.title}</h4>
                          {getTrendIcon(insight.trend)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        {insight.value && (
                          <p className="text-lg font-bold text-blue-600 mt-2">
                            {formatValue(insight.value)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p>Nenhum insight disponível</p>
                  <p className="text-sm">Processe mais relatórios para gerar insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertas */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Alertas ({insights.alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.alerts.length > 0 ? (
                <div className="space-y-3">
                  {insights.alerts.map((alert, index) => (
                    <Alert key={index} variant={getAlertVariant(alert.severity)}>
                      {getAlertIcon(alert.severity)}
                      <AlertDescription>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm mt-1">{alert.description}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-12 w-12 mb-2 text-green-200" />
                  <p>Tudo funcionando bem!</p>
                  <p className="text-sm">Nenhum alerta no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recomendações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Recomendações ({insights.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(recommendation.priority)}`}></div>
                      <Target className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{recommendation.title}</h4>
                        <Badge 
                          variant={recommendation.priority === 'high' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {recommendation.priority === 'high' ? 'Alta' : 
                           recommendation.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                      <Badge variant="outline" className="text-xs mt-2">
                        {recommendation.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <p>Nenhuma recomendação no momento</p>
                <p className="text-sm">Continue processando dados para receber sugestões</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Resumo de Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Resumo de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                  <Lightbulb className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{insights.summary.totalInsights}</p>
                <p className="text-sm text-gray-600">Insights Gerados</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">{insights.summary.totalAlerts}</p>
                <p className="text-sm text-gray-600">Alertas Ativos</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{insights.summary.totalRecommendations}</p>
                <p className="text-sm text-gray-600">Recomendações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
