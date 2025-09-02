
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Calculator, DollarSign, Package, Award, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface KPIData {
  totalQuantity: number
  totalValue: number
  solidCount: number
  topSeller: string
  formulasProcessed?: number
}

interface KPICardsProps {
  data: KPIData
  isLoading: boolean
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const [animatedQuantity, setAnimatedQuantity] = useState(0)
  const [animatedValue, setAnimatedValue] = useState(0)
  const [animatedSolid, setAnimatedSolid] = useState(0)
  const [animatedProcessed, setAnimatedProcessed] = useState(0)

  useEffect(() => {
    if (!isLoading && data) {
      // Simple animation with safety checks
      const animateValue = (targetValue: number, setter: React.Dispatch<React.SetStateAction<number>>) => {
        if (typeof targetValue !== 'number' || isNaN(targetValue) || targetValue < 0) {
          setter(0)
          return
        }
        
        let start = 0
        const increment = Math.max(targetValue / 20, 1)
        const timer = setInterval(() => {
          start += increment
          if (start >= targetValue) {
            setter(targetValue)
            clearInterval(timer)
          } else {
            setter(Math.floor(start))
          }
        }, 50)
        
        return timer
      }

      const quantityTimer = animateValue(data.totalQuantity || 0, setAnimatedQuantity)
      const valueTimer = animateValue(data.totalValue || 0, setAnimatedValue)
      const solidTimer = animateValue(data.solidCount || 0, setAnimatedSolid)
      const processedTimer = animateValue(data.formulasProcessed || 0, setAnimatedProcessed)

      return () => {
        if (quantityTimer) clearInterval(quantityTimer)
        if (valueTimer) clearInterval(valueTimer)
        if (solidTimer) clearInterval(solidTimer)
        if (processedTimer) clearInterval(processedTimer)
      }
    } else {
      // Reset values when loading or no data
      setAnimatedQuantity(0)
      setAnimatedValue(0)
      setAnimatedSolid(0)
      setAnimatedProcessed(0)
    }
  }, [data, isLoading])

  const kpis = [
    {
      title: "Fórmulas (dia)",
      value: isLoading ? 0 : animatedProcessed,
      subtitle: `${animatedProcessed} processadas • ${animatedQuantity} qty total`,
      icon: Calculator,
      color: "text-blue-300",
      bgColor: "bg-blue-500/20",
      hasSubtitle: true
    },
    {
      title: "Valor Total",
      value: `R$ ${(isLoading ? 0 : (animatedValue || 0)).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`,
      icon: DollarSign,
      color: "text-green-300",
      bgColor: "bg-green-500/20"
    },
    {
      title: "Sólidos s/ Sedex",
      value: isLoading ? 0 : animatedSolid,
      icon: Package,
      color: "text-orange-300",
      bgColor: "bg-orange-500/20"
    },
    {
      title: "Melhor Vendedor",
      value: data.topSeller || "—",
      icon: Award,
      color: "text-purple-300",
      bgColor: "bg-purple-500/20",
      isText: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-slate-900/90 border-slate-500 hover:bg-slate-900/95 transition-colors shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-white leading-relaxed">
                {kpi.title}
              </CardTitle>
              <div className={`p-3 rounded-lg ${kpi.bgColor} border border-slate-500/20`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className={`text-3xl font-bold ${kpi.color} leading-relaxed mb-2`}>
                {kpi.isText ? kpi.value : kpi.value}
              </div>
              {(kpi as any).hasSubtitle ? (
                <div className="text-sm text-slate-200 mt-2 leading-relaxed bg-slate-800/30 px-2 py-1 rounded">
                  {(kpi as any).subtitle}
                </div>
              ) : !kpi.isText && (
                <div className="flex items-center text-sm text-slate-200 mt-2 leading-relaxed">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Processamento atual
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
