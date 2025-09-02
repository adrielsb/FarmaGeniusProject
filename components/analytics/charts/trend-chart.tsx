
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface TrendChartProps {
  data: any[]
  title: string
  type: 'category' | 'monthly' | 'seller'
  height?: number
}

export function TrendChart({ data, title, type, height = 300 }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Dados insuficientes para exibir tendências
          </div>
        </CardContent>
      </Card>
    )
  }

  const getChartData = () => {
    if (type === 'category') {
      // Para categorias, mostrar apenas as top 5 como linhas
      const topCategories = data.slice(0, 5)
      
      // Extrair todas as datas únicas
      const allDates = new Set()
      topCategories.forEach(category => {
        category.data?.forEach((item: any) => allDates.add(item.date))
      })
      const sortedDates = Array.from(allDates).sort()

      const colors = [
        'rgb(59, 130, 246)', // blue
        'rgb(16, 185, 129)', // green
        'rgb(245, 158, 11)', // yellow
        'rgb(239, 68, 68)',  // red
        'rgb(139, 92, 246)'  // purple
      ]

      return {
        labels: sortedDates,
        datasets: topCategories.map((category, index) => {
          const dataPoints = sortedDates.map(date => {
            const item = category.data?.find((d: any) => d.date === date)
            return item ? item.value : 0
          })

          return {
            label: category.category,
            data: dataPoints,
            borderColor: colors[index],
            backgroundColor: colors[index] + '20',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        })
      }
    } else if (type === 'monthly') {
      return {
        labels: data.map(item => {
          const [year, month] = item.month.split('-')
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: '2-digit' 
          })
        }),
        datasets: [
          {
            label: 'Valor (R$)',
            data: data.map(item => item.value),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Quantidade',
            data: data.map(item => item.quantity),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: false,
            yAxisID: 'y1'
          }
        ]
      }
    }

    return { labels: [], datasets: [] }
  }

  const getChartOptions = (): ChartOptions<'line'> => {
    const baseOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.datasetIndex === 0 || type === 'category') {
                label += 'R$ ' + (context.parsed.y || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              } else {
                label += (context.parsed.y || 0).toLocaleString() + ' itens';
              }
              return label;
            }
          }
        }
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: type === 'monthly' ? 'Período' : 'Data'
          }
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: type === 'category' ? 'Valor (R$)' : 'Valor (R$)'
          },
          ticks: {
            callback: function(value) {
              return 'R$ ' + Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 });
            }
          }
        }
      }
    }

    if (type === 'monthly') {
      baseOptions.scales!.y1 = {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Quantidade'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return Number(value || 0).toLocaleString() + ' itens';
          }
        }
      }
    }

    return baseOptions
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="text-sm font-normal text-gray-500">
            {data.length} {type === 'category' ? 'categorias' : type === 'monthly' ? 'meses' : 'itens'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Line 
            data={getChartData()} 
            options={getChartOptions()}
          />
        </div>
        
        {type === 'category' && (
          <div className="mt-4 text-xs text-gray-600">
            * Mostrando apenas as top 5 categorias por valor total
          </div>
        )}
      </CardContent>
    </Card>
  )
}
