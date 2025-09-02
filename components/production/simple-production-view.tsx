"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Factory, BarChart3, Settings, Activity, Clock, Users, Package, AlertTriangle } from "lucide-react"

interface SimpleProductionViewProps {
  data: any[]
  insights?: any
  currentHour: string
}

export function SimpleProductionView({ data, insights, currentHour }: SimpleProductionViewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Factory className="h-8 w-8 text-blue-400" />
              Gestão de Produção
            </h2>
            <p className="text-slate-300">
              Sistema de monitoramento e otimização da produção farmacêutica
            </p>
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
                Processe relatórios para visualizar métricas de produção e sequenciamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Análise básica dos dados
  const totalFormulas = data.length
  const categories = data.reduce((acc, item) => {
    const category = mapCategory(item.categoria || item.form_norm || '')
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categories)
    .sort(([,a], [,b]) => Number(b) - Number(a))[0]

  function mapCategory(formula: string): string {
    const f = formula.toUpperCase()
    if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO')) return 'LÍQUIDOS'
    if (f.includes('HOMEOPATIA') || f.includes('FLORAL')) return 'HOMEOPATIA'
    if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ')) return 'SÓLIDOS'
    if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL')) return 'SEMI-SÓLIDOS'
    return 'OUTROS'
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
            Sistema de monitoramento e otimização da produção farmacêutica
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/20 text-green-300">
            {totalFormulas} fórmulas em análise
          </Badge>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300">
            Tempo real
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-300">Total de Fórmulas</p>
                <p className="text-2xl font-bold text-blue-300">{totalFormulas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-slate-300">Categorias Ativas</p>
                <p className="text-2xl font-bold text-green-300">{Object.keys(categories).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-slate-300">Horário Atual</p>
                <p className="text-2xl font-bold text-purple-300">{currentHour}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-sm text-slate-300">Principal Categoria</p>
                <p className="text-lg font-bold text-orange-300">{topCategory?.[0] || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categories).map(([category, count]) => {
              const percentage = (Number(count) / totalFormulas) * 100
              const color = getCategoryColor(category)
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="font-medium text-slate-200">{category}</span>
                    </div>
                    <span className="text-slate-300">{Number(count)} ({percentage.toFixed(1)}%)</span>
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

      {/* Production Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Insights de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Sequenciamento Sugerido:</strong> Processar {topCategory?.[0]} primeiro pode reduzir tempo de setup
              </p>
            </div>
            
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-300">
                <strong>Produtividade:</strong> Com {totalFormulas} fórmulas, estimativa de {Math.ceil(totalFormulas / 50)} turnos de produção
              </p>
            </div>
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                <strong>Balanceamento:</strong> {Object.keys(categories).length} categorias ativas permitem distribuição equilibrada da carga
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

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