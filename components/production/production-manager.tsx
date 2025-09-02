"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Factory,
  BarChart3,
  Settings,
  Activity,
  Target,
  TrendingUp
} from "lucide-react"
import { ProductionDashboard } from "./production-dashboard"
import { ProductionSequence } from "./production-sequence"
import { ProductionMetricsDashboard } from "./production-metrics-dashboard"
import { ProductionMetricsConfig } from "./production-metrics-config"

interface ProductionManagerProps {
  data: any[]
  insights?: any
  currentHour: string
}

export function ProductionManager({ data, insights, currentHour }: ProductionManagerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [showMetricsConfig, setShowMetricsConfig] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Factory className="h-8 w-8 text-blue-400" />
            Gestão de Produção
          </h2>
          <p className="text-slate-300">
            Sistema integrado de monitoramento e otimização da produção farmacêutica
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/20 text-green-300">
            {data?.length || 0} fórmulas em análise
          </Badge>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300">
            Tempo real
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="sequence" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Sequenciamento
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-xs px-1 py-0">
              Novo
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProductionDashboard 
            data={data} 
            currentHour={currentHour}
          />
        </TabsContent>

        <TabsContent value="sequence" className="mt-6">
          <ProductionSequence data={data} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <ProductionMetricsDashboard
            data={data}
            insights={insights}
            onConfigureMetrics={() => setActiveTab("config")}
          />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <ProductionMetricsConfig
            onSaveMetrics={(metrics) => {
              console.log('Métricas salvas:', metrics)
              setActiveTab("metrics")
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}