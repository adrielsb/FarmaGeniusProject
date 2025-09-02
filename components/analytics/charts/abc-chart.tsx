
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Package, DollarSign, Percent, Filter } from "lucide-react"
import { Doughnut, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface ABCChartProps {
  data: Array<{
    product: string
    totalValue: number
    totalQuantity: number
    category: string
    valuePercent: number
    cumulativePercent: number
    classification: 'A' | 'B' | 'C'
  }>
  title: string
}

export function ABCChart({ data, title }: ABCChartProps) {
  const [selectedClassification, setSelectedClassification] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL')
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Dados insuficientes para análise ABC
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estatísticas por classificação
  const stats = {
    A: data.filter(item => item.classification === 'A'),
    B: data.filter(item => item.classification === 'B'),
    C: data.filter(item => item.classification === 'C')
  }

  const classificationStats = {
    A: {
      count: stats.A.length,
      totalValue: stats.A.reduce((sum, item) => sum + item.totalValue, 0),
      valuePercent: stats.A.reduce((sum, item) => sum + item.valuePercent, 0)
    },
    B: {
      count: stats.B.length,
      totalValue: stats.B.reduce((sum, item) => sum + item.totalValue, 0),
      valuePercent: stats.B.reduce((sum, item) => sum + item.valuePercent, 0)
    },
    C: {
      count: stats.C.length,
      totalValue: stats.C.reduce((sum, item) => sum + item.totalValue, 0),
      valuePercent: stats.C.reduce((sum, item) => sum + item.valuePercent, 0)
    }
  }

  // Dados filtrados
  const filteredData = selectedClassification === 'ALL' 
    ? data 
    : data.filter(item => item.classification === selectedClassification)

  // Dados para gráfico de pizza
  const pieChartData = {
    labels: ['Classe A (80%)', 'Classe B (15%)', 'Classe C (5%)'],
    datasets: [
      {
        data: [
          classificationStats.A.valuePercent,
          classificationStats.B.valuePercent,
          classificationStats.C.valuePercent
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // green for A
          'rgba(245, 158, 11, 0.8)',  // yellow for B
          'rgba(239, 68, 68, 0.8)'    // red for C
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2
      }
    ]
  }

  // Dados para gráfico de barras
  const barChartData = {
    labels: filteredData.slice(0, 10).map(item => 
      item.product.length > 15 ? item.product.slice(0, 15) + '...' : item.product
    ),
    datasets: [
      {
        label: 'Valor (R$)',
        data: filteredData.slice(0, 10).map(item => item.totalValue),
        backgroundColor: filteredData.slice(0, 10).map(item => 
          item.classification === 'A' ? 'rgba(34, 197, 94, 0.8)' :
          item.classification === 'B' ? 'rgba(245, 158, 11, 0.8)' :
          'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: filteredData.slice(0, 10).map(item => 
          item.classification === 'A' ? 'rgba(34, 197, 94, 1)' :
          item.classification === 'B' ? 'rgba(245, 158, 11, 1)' :
          'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `R$ ${(context.parsed.y || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'R$ ' + Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
          }
        }
      }
    }
  }

  const getClassificationColor = (classification: 'A' | 'B' | 'C') => {
    switch (classification) {
      case 'A': return 'bg-green-500 text-white'
      case 'B': return 'bg-yellow-500 text-white'
      case 'C': return 'bg-red-500 text-white'
    }
  }

  const getClassificationDescription = (classification: 'A' | 'B' | 'C') => {
    switch (classification) {
      case 'A': return 'Alto valor - Controle rigoroso'
      case 'B': return 'Valor médio - Controle moderado'
      case 'C': return 'Baixo valor - Controle simples'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            {title}
          </h3>
          <p className="text-gray-600">
            {data.length} produtos • Baseado no valor de vendas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Tabela
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
          >
            Gráfico
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Classe A</p>
                <p className="text-2xl font-bold text-green-600">{classificationStats.A.count}</p>
                <p className="text-xs text-gray-500">{classificationStats.A.valuePercent.toFixed(1)}% do valor</p>
              </div>
              <Badge className="bg-green-500">A</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Classe B</p>
                <p className="text-2xl font-bold text-yellow-600">{classificationStats.B.count}</p>
                <p className="text-xs text-gray-500">{classificationStats.B.valuePercent.toFixed(1)}% do valor</p>
              </div>
              <Badge className="bg-yellow-500">B</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Classe C</p>
                <p className="text-2xl font-bold text-red-600">{classificationStats.C.count}</p>
                <p className="text-xs text-gray-500">{classificationStats.C.valuePercent.toFixed(1)}% do valor</p>
              </div>
              <Badge className="bg-red-500">C</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{data.length}</p>
                <p className="text-xs text-gray-500">produtos</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Filtrar por classificação:</span>
        <div className="flex gap-1">
          {(['ALL', 'A', 'B', 'C'] as const).map(classification => (
            <Button
              key={classification}
              variant={selectedClassification === classification ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedClassification(classification)}
            >
              {classification === 'ALL' ? 'Todos' : `Classe ${classification}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Conteúdo principal */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lista de Produtos - {selectedClassification === 'ALL' ? 'Todos' : `Classe ${selectedClassification}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData.slice(0, 20).map((item, index) => (
                <div key={item.product} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full text-sm font-medium">
                      #{index + 1}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.product}</p>
                        <Badge className={getClassificationColor(item.classification)}>
                          {item.classification}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.category}</p>
                      <p className="text-xs text-gray-500">
                        {getClassificationDescription(item.classification)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {(item.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{item.totalQuantity} unidades</span>
                      <span>•</span>
                      <span>{item.valuePercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-24 mt-1">
                      <Progress value={item.cumulativePercent} className="h-1" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Acumulado: {item.cumulativePercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredData.length > 20 && (
              <div className="text-center mt-4 text-sm text-gray-500">
                Mostrando 20 de {filteredData.length} produtos
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição ABC</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Doughnut 
                  data={pieChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Top 10 - {selectedClassification === 'ALL' ? 'Geral' : `Classe ${selectedClassification}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
