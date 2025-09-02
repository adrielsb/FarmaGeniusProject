
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Activity } from "lucide-react"

interface HeatMapProps {
  data: Array<{
    bucket: string
    value: number
    intensity: number
  }>
  title: string
  height?: number
}

export function HeatMap({ data, title, height = 300 }: HeatMapProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Dados insuficientes para heat map
          </div>
        </CardContent>
      </Card>
    )
  }

  // Encontrar valores máximo e mínimo
  const values = data.map(d => d.value).filter(v => v > 0)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)

  // Calcular estatísticas
  const avgValue = totalValue / data.length
  const topHours = data
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  // Função para obter cor baseada na intensidade
  const getHeatColor = (intensity: number, value: number) => {
    if (value === 0) return 'bg-slate-800 border-slate-700 text-slate-400'
    
    const normalizedIntensity = intensity
    
    if (normalizedIntensity >= 0.8) return 'bg-red-500 border-red-600 text-white'
    if (normalizedIntensity >= 0.6) return 'bg-red-400 border-red-500 text-white'
    if (normalizedIntensity >= 0.4) return 'bg-orange-400 border-orange-500 text-white'
    if (normalizedIntensity >= 0.2) return 'bg-yellow-400 border-yellow-500 text-gray-900'
    return 'bg-green-200 border-green-300 text-gray-900'
  }

  // Função para obter texto de intensidade
  const getIntensityText = (intensity: number) => {
    if (intensity >= 0.8) return 'Muito Alto'
    if (intensity >= 0.6) return 'Alto'
    if (intensity >= 0.4) return 'Médio'
    if (intensity >= 0.2) return 'Baixo'
    return 'Muito Baixo'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title}
          </div>
          <Badge variant="outline">
            {data.filter(d => d.value > 0).length}/{data.length} períodos ativos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Grid do Heat Map */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {data.map((item) => (
            <div
              key={item.bucket}
              className={`
                p-3 rounded-lg border-2 text-center transition-all duration-200 hover:scale-105 cursor-pointer
                ${getHeatColor(item.intensity, item.value)}
              `}
              title={`${item.bucket}: R$ ${(item.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${getIntensityText(item.intensity)})`}
            >
              <div className="text-xs font-medium mb-1">
                {item.bucket}
              </div>
              <div className="text-sm font-bold">
                R$ {item.value.toFixed(0)}
              </div>
              <div className="text-xs opacity-75 mt-1">
                {item.value > 0 ? `${((item.value / totalValue) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
            <span>Baixo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-400 border border-yellow-500 rounded"></div>
            <span>Médio-Baixo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-400 border border-orange-500 rounded"></div>
            <span>Médio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-400 border border-red-500 rounded"></div>
            <span>Alto</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 border border-red-600 rounded"></div>
            <span>Muito Alto</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              Horário de Pico
            </div>
            <div className="font-bold text-lg text-green-600">
              {topHours[0]?.bucket || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              R$ {(topHours[0]?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
              <Activity className="h-4 w-4" />
              Valor Total
            </div>
            <div className="font-bold text-lg text-blue-600">
              R$ {(totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500">
              Média: R$ {avgValue.toFixed(2)}/período
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
              <Clock className="h-4 w-4" />
              Períodos Ativos
            </div>
            <div className="font-bold text-lg text-purple-600">
              {data.filter(d => d.value > 0).length}
            </div>
            <div className="text-xs text-gray-500">
              de {data.length} períodos
            </div>
          </div>
        </div>

        {/* Top 3 Horários */}
        {topHours.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-slate-200 mb-3">Top 3 Horários</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {topHours.map((hour, index) => (
                <div key={hour.bucket} className="flex items-center justify-between p-2 bg-slate-800/50 border border-slate-600 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium text-slate-200">{hour.bucket}</span>
                  </div>
                  <div className="text-sm font-bold text-green-300">
                    R$ {(hour.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
