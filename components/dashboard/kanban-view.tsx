
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Package } from "lucide-react"
import { motion } from "framer-motion"

interface KanbanViewProps {
  data: any
}

interface KanbanBucket {
  title: string
  items: KanbanItem[]
}

interface KanbanItem {
  title: string
  count: number
}

export function KanbanView({ data }: KanbanViewProps) {
  if (!data || !data.buckets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Kanban por Horário
          </CardTitle>
          <CardDescription>
            Visualização organizada por buckets de horário baseada no protótipo original
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            Dados de Kanban serão gerados após o processamento
          </div>
        </CardContent>
      </Card>
    )
  }

  const buckets: KanbanBucket[] = data.buckets || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Kanban por Horário
          </CardTitle>
          <CardDescription>
            Visão rápida da carga por bucket (baseado no protótipo original)
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {buckets.map((bucket, index) => (
          <motion.div
            key={bucket.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full bg-slate-800/30 border-slate-600">
              <CardHeader className="pb-3">
                <div className="text-center">
                  <CardTitle className="text-sm font-medium text-slate-200">
                    {bucket.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {bucket.items.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    Sem itens
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {bucket.items.map((item, itemIndex) => (
                      <motion.div
                        key={itemIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (index * 0.1) + (itemIndex * 0.05) }}
                        className="p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700/70 transition-colors"
                      >
                        <div className="text-sm font-medium text-slate-200 mb-2">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          Qtd: <span className="text-blue-400 font-mono">{item.count}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-slate-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            Resumo por Horário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {buckets.map((bucket) => {
              const totalItems = bucket.items.reduce((sum, item) => sum + item.count, 0)
              const uniqueItems = bucket.items.length
              
              return (
                <div key={bucket.title} className="text-center space-y-2">
                  <div className="text-sm font-medium text-slate-300">
                    {bucket.title}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">
                      Tipos: <span className="text-slate-200">{uniqueItems}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Total: <span className="text-blue-400">{totalItems}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
