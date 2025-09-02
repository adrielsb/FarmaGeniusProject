
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, TrendingUp, Award, DollarSign } from "lucide-react"
import { motion } from "framer-motion"

interface SellersMetricsProps {
  data: any[]
}

interface SellerData {
  name: string
  qty: number
  value: number
  avg: number
}

export function SellersMetrics({ data }: SellersMetricsProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Métricas por Vendedor
          </CardTitle>
          <CardDescription>
            Desempenho individual dos vendedores (baseado no protótipo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            Dados de vendedores serão exibidos após o processamento
          </div>
        </CardContent>
      </Card>
    )
  }

  const sellers: SellerData[] = data
  
  const maxValue = Math.max(...sellers.map(s => s.value))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Métricas por Vendedor
          </CardTitle>
          <CardDescription>
            Desempenho de {sellers.length} vendedores (maior valor define o TOP)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Top Performers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-sm text-slate-300">TOP Vendedor</div>
                <div className="font-bold text-yellow-400">
                  {sellers[0]?.name || '—'}
                </div>
                <div className="text-xs text-slate-400">
                  R$ {(sellers[0]?.value || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-sm text-slate-300">Maior Volume</div>
                <div className="font-bold text-blue-400">
                  {sellers.reduce((max, s) => s.qty > max.qty ? s : max, sellers[0] || { qty: 0, name: '—' }).name}
                </div>
                <div className="text-xs text-slate-400">
                  {sellers.reduce((max, s) => s.qty > max.qty ? s : max, sellers[0] || { qty: 0 }).qty} fórmulas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-sm text-slate-300">Valor Médio</div>
                <div className="font-bold text-green-400">
                  R$ {sellers.length > 0 ? (sellers.reduce((sum, s) => sum + s.value, 0) / sellers.length).toFixed(2) : '0.00'}
                </div>
                <div className="text-xs text-slate-400">
                  Por vendedor
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Seller Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((seller, index) => (
          <motion.div
            key={seller.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/30 border-slate-600 hover:bg-slate-800/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">
                    {seller.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Value Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Valor Total</span>
                    <span className="text-green-400 font-mono">
                      R$ {seller.value.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={(seller.value / maxValue) * 100} 
                    className="h-1.5"
                  />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-400">Quantidade</div>
                    <div className="text-blue-400 font-mono font-bold">
                      {seller.qty}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Média/Fórmula</div>
                    <div className="text-green-400 font-mono font-bold">
                      R$ {seller.avg.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Ticket Médio</div>
                    <div className="text-purple-400 font-mono font-bold">
                      R$ {(seller.value / seller.qty).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Performance</div>
                    <div className="text-orange-400 font-mono font-bold">
                      {((seller.value / maxValue) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
