
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Users, TrendingUp, Clock, Target } from "lucide-react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface SellerRankingProps {
  data: any[]
  totalSellers: number
}

export function SellerRanking({ data, totalSellers }: SellerRankingProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking de Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            Nenhum dados de vendedores disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1: return <Medal className="h-5 w-5 text-gray-400" />
      case 2: return <Award className="h-5 w-5 text-orange-500" />
      default: return <span className="text-lg font-bold text-slate-300">#{position + 1}</span>
    }
  }

  const getRankBadge = (position: number) => {
    switch (position) {
      case 0: return <Badge className="bg-yellow-500">🥇 1º Lugar</Badge>
      case 1: return <Badge className="bg-slate-500">🥈 2º Lugar</Badge>
      case 2: return <Badge className="bg-orange-500">🥉 3º Lugar</Badge>
      default: return <Badge variant="outline">#{position + 1}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const maxValue = Math.max(...data.map(seller => seller.totalValue))

  // Dados para gráfico de barras
  const chartData = {
    labels: data.slice(0, 6).map(seller => seller.name.split(' ')[0]),
    datasets: [
      {
        label: 'Valor Total (R$)',
        data: data.slice(0, 6).map(seller => seller.totalValue),
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',  // yellow
          'rgba(156, 163, 175, 0.8)', // gray
          'rgba(251, 146, 60, 0.8)',  // orange
          'rgba(59, 130, 246, 0.8)',  // blue
          'rgba(16, 185, 129, 0.8)',  // green
          'rgba(139, 92, 246, 0.8)'   // purple
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(156, 163, 175, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)'
        ],
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

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Users className="h-6 w-6 text-blue-400" />
            Ranking de Vendedores
          </h3>
          <p className="text-slate-300">
            {totalSellers} vendedores ativos • Ordenado por valor total
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Vendedores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.slice(0, 10).map((seller, index) => (
              <div key={seller.name} className={`flex items-center justify-between p-3 rounded-lg transition-colors border ${
                index < 3 ? 'bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600' : 'hover:bg-slate-800/30 border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  {/* Posição/Ícone */}
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(index)}
                  </div>
                  
                  {/* Avatar e Info */}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-500 text-white">
                        {getInitials(seller.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-100">{seller.name}</p>
                        {getRankBadge(index)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {seller.totalQuantity} itens
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {seller.uniqueDays} dias
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          R$ {seller.avgTicket.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-green-300">
                    R$ {(seller.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="w-32 mt-1">
                    <Progress 
                      value={(seller.totalValue / maxValue) * 100} 
                      className="h-1.5"
                    />
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    R$ {seller.avgValuePerDay.toFixed(2)}/dia
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gráfico de barras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 6 - Comparativo Visual</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '400px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análises detalhadas dos top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.slice(0, 3).map((seller, index) => (
          <Card key={seller.name} className={`border-l-4 ${
            index === 0 ? 'border-l-yellow-500' : 
            index === 1 ? 'border-l-gray-500' : 'border-l-orange-500'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{seller.name}</span>
                {getRankIcon(index)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400">Valor Total</p>
                    <p className="font-semibold text-slate-100">R$ {(seller.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Ticket Médio</p>
                    <p className="font-semibold text-slate-100">R$ {seller.avgTicket.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Itens</p>
                    <p className="font-semibold text-slate-100">{seller.totalQuantity}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Dias Ativos</p>
                    <p className="font-semibold text-slate-100">{seller.uniqueDays}</p>
                  </div>
                </div>
                
                {seller.categories && seller.categories.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Categoria Principal</p>
                    <Badge variant="outline" className="text-xs">
                      {seller.categories[0].category} ({seller.categories[0].count})
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
