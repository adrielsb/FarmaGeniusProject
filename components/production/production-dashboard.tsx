"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Target,
  Zap
} from "lucide-react"

interface ProductionDashboardProps {
  data: any[]
  currentHour: string
}

export function ProductionDashboard({ data, currentHour }: ProductionDashboardProps) {
  // Análise dos dados atuais para produção
  const getProductionInsights = () => {
    const insights = {
      currentLoad: 0,
      categoryDistribution: {} as Record<string, number>,
      hourlyTrend: {} as Record<string, number>,
      bottlenecks: [] as string[],
      efficiency: 0,
      recommendations: [] as string[]
    }

    // Análise por categoria (usando mapeamento existente)
    data.forEach(item => {
      if (item.categoria) {
        const category = mapCategory(item.categoria)
        insights.categoryDistribution[category] = 
          (insights.categoryDistribution[category] || 0) + (item.quantidade || 1)
      }
    })

    // Análise de eficiência por horário
    const hourlyData = {} as Record<string, number>
    data.forEach(item => {
      if (item.horario) {
        hourlyData[item.horario] = (hourlyData[item.horario] || 0) + 1
      }
    })

    // Identificar gargalos (horários com > 80% da capacidade)
    Object.entries(hourlyData).forEach(([hour, count]) => {
      if (count > 40) { // Assumindo capacidade de ~50 por horário
        insights.bottlenecks.push(hour)
      }
    })

    return insights
  }

  const mapCategory = (categoria: string): string => {
    const label = categoria.toUpperCase()
    if (label.includes('CAPSULA') || label.includes('COMPRIMIDO')) return 'SÓLIDOS'
    if (label.includes('CREME') || label.includes('POMADA')) return 'SEMI-SÓLIDOS'  
    if (label.includes('SOLUÇÃO') || label.includes('LOÇÃO')) return 'LÍQUIDOS'
    if (label.includes('HOMEOPATIA')) return 'HOMEOPATIA'
    return 'OUTROS'
  }

  const insights = getProductionInsights()

  // Simulação de dados em tempo real
  const getCurrentStatus = () => {
    const now = new Date()
    const currentSlot = `${now.getHours()}:00-${now.getHours() + 1}:00`
    
    return {
      activeOperators: 4,
      queueSize: Math.floor(Math.random() * 25) + 10,
      completedToday: Math.floor(Math.random() * 150) + 100,
      currentSlot,
      avgTimePerFormula: '12min',
      onTimeDelivery: 94.2
    }
  }

  const status = getCurrentStatus()

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-300">Fila Atual</p>
                <p className="text-2xl font-bold text-blue-300">{status.queueSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-slate-300">Concluídas Hoje</p>
                <p className="text-2xl font-bold text-green-300">{status.completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-slate-300">Operadores Ativos</p>
                <p className="text-2xl font-bold text-purple-300">{status.activeOperators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-sm text-slate-300">No Prazo</p>
                <p className="text-2xl font-bold text-orange-300">{status.onTimeDelivery}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Distribuição por Categoria - Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(insights.categoryDistribution).map(([category, count]) => {
              const percentage = (count / Object.values(insights.categoryDistribution).reduce((a, b) => a + b, 0)) * 100
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200">{category}</span>
                    <span className="text-slate-300">{count} fórmulas ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Produção */}
      <div className="space-y-3">
        {insights.bottlenecks.length > 0 && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-slate-200">
              <strong>Gargalo identificado:</strong> Horários {insights.bottlenecks.join(', ')} com sobrecarga.
              Considere redistribuir produção ou alocar recursos extras.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Zap className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-slate-200">
            <strong>Otimização sugerida:</strong> Reorganizar sequência para produzir {Object.keys(insights.categoryDistribution)[0]} 
            no início do dia (menos contaminação cruzada).
          </AlertDescription>
        </Alert>
      </div>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Atual vs Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Tempo médio por fórmula</span>
                <span className="text-slate-200">{status.avgTimePerFormula}</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-slate-400">Meta: 10min | Atual: 12min</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Taxa de conclusão diária</span>
                <span className="text-slate-200">87%</span>
              </div>
              <Progress value={87} className="h-2" />
              <p className="text-xs text-slate-400">Meta: 95% | Faltam 38 fórmulas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-slate-200">Priorizar fórmulas de LÍQUIDOS (setup rápido)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-slate-200">Alocar 1 operador extra para 14:00-15:00</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-200">Revisar capacidade de SEMI-SÓLIDOS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}