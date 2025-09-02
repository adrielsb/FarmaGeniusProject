"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Package,
  BarChart3,
  Save,
  RotateCcw,
  Zap
} from "lucide-react"

interface ProductionMetric {
  id: string
  name: string
  description: string
  category: 'performance' | 'quality' | 'efficiency' | 'capacity'
  target: number
  unit: string
  calculation: string
  enabled: boolean
  alertThreshold: number
  color: string
}

interface ProductionMetricsConfigProps {
  onSaveMetrics?: (metrics: ProductionMetric[]) => void
  initialMetrics?: ProductionMetric[]
}

const DEFAULT_METRICS: ProductionMetric[] = [
  {
    id: 'throughput',
    name: 'Taxa de Produção',
    description: 'Número de fórmulas processadas por hora',
    category: 'performance',
    target: 50,
    unit: 'fórmulas/hora',
    calculation: 'total_formulas / horas_trabalhadas',
    enabled: true,
    alertThreshold: 40,
    color: '#3B82F6'
  },
  {
    id: 'cycle_time',
    name: 'Tempo de Ciclo Médio',
    description: 'Tempo médio para completar uma fórmula',
    category: 'efficiency',
    target: 12,
    unit: 'minutos',
    calculation: 'tempo_total / total_formulas',
    enabled: true,
    alertThreshold: 15,
    color: '#10B981'
  },
  {
    id: 'setup_time',
    name: 'Tempo de Setup',
    description: 'Tempo gasto em mudanças entre categorias',
    category: 'efficiency',
    target: 5,
    unit: 'minutos',
    calculation: 'tempo_limpeza + tempo_preparacao',
    enabled: true,
    alertThreshold: 8,
    color: '#F59E0B'
  },
  {
    id: 'queue_utilization',
    name: 'Utilização da Fila',
    description: 'Percentual de ocupação da capacidade',
    category: 'capacity',
    target: 85,
    unit: '%',
    calculation: '(fila_atual / capacidade_maxima) * 100',
    enabled: true,
    alertThreshold: 95,
    color: '#EF4444'
  },
  {
    id: 'category_balance',
    name: 'Balanceamento de Categorias',
    description: 'Distribuição equilibrada entre tipos de fórmulas',
    category: 'efficiency',
    target: 25,
    unit: '% por categoria',
    calculation: 'desvio_padrao(percentuais_categorias)',
    enabled: true,
    alertThreshold: 40,
    color: '#8B5CF6'
  },
  {
    id: 'operator_productivity',
    name: 'Produtividade por Operador',
    description: 'Fórmulas processadas por operador por turno',
    category: 'performance',
    target: 65,
    unit: 'fórmulas/operador',
    calculation: 'total_formulas / numero_operadores',
    enabled: true,
    alertThreshold: 50,
    color: '#06B6D4'
  },
  {
    id: 'on_time_delivery',
    name: 'Entregas no Prazo',
    description: 'Percentual de fórmulas entregues no horário',
    category: 'quality',
    target: 95,
    unit: '%',
    calculation: '(entregas_pontuais / total_entregas) * 100',
    enabled: true,
    alertThreshold: 90,
    color: '#059669'
  },
  {
    id: 'priority_compliance',
    name: 'Cumprimento de Prioridades',
    description: 'Aderência ao sequenciamento otimizado',
    category: 'quality',
    target: 90,
    unit: '%',
    calculation: '(sequencia_seguida / sequencia_planejada) * 100',
    enabled: true,
    alertThreshold: 80,
    color: '#DC2626'
  },
  {
    id: 'resource_efficiency',
    name: 'Eficiência de Recursos',
    description: 'Otimização no uso de equipamentos e materiais',
    category: 'efficiency',
    target: 88,
    unit: '%',
    calculation: '(tempo_produtivo / tempo_total) * 100',
    enabled: true,
    alertThreshold: 75,
    color: '#7C3AED'
  },
  {
    id: 'daily_target',
    name: 'Meta Diária',
    description: 'Cumprimento da meta de produção diária',
    category: 'performance',
    target: 100,
    unit: '% da meta',
    calculation: '(producao_real / meta_diaria) * 100',
    enabled: true,
    alertThreshold: 85,
    color: '#F97316'
  }
]

export function ProductionMetricsConfig({ onSaveMetrics, initialMetrics }: ProductionMetricsConfigProps) {
  const [metrics, setMetrics] = useState<ProductionMetric[]>(initialMetrics || DEFAULT_METRICS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isModified, setIsModified] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (initialMetrics && initialMetrics.length > 0) {
      setMetrics(initialMetrics)
    }
  }, [initialMetrics])

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(metric => metric.category === selectedCategory)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />
      case 'quality': return <CheckCircle className="h-4 w-4" />
      case 'efficiency': return <Zap className="h-4 w-4" />
      case 'capacity': return <BarChart3 className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'bg-blue-500'
      case 'quality': return 'bg-green-500'
      case 'efficiency': return 'bg-yellow-500'
      case 'capacity': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'performance': return 'Performance'
      case 'quality': return 'Qualidade'
      case 'efficiency': return 'Eficiência'
      case 'capacity': return 'Capacidade'
      default: return 'Outros'
    }
  }

  const handleMetricUpdate = (id: string, field: keyof ProductionMetric, value: any) => {
    setMetrics(prev => prev.map(metric => 
      metric.id === id ? { ...metric, [field]: value } : metric
    ))
    setIsModified(true)
    setSaveStatus('idle')
  }

  const handleSaveMetrics = async () => {
    setSaveStatus('saving')
    
    try {
      // Simular salvamento (substituir por chamada real à API)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onSaveMetrics) {
        onSaveMetrics(metrics)
      }
      
      // Salvar no localStorage como backup
      localStorage.setItem('productionMetrics', JSON.stringify(metrics))
      
      setSaveStatus('saved')
      setIsModified(false)
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleResetDefaults = () => {
    setMetrics(DEFAULT_METRICS)
    setIsModified(true)
    setSaveStatus('idle')
  }

  const categoryStats = {
    performance: metrics.filter(m => m.category === 'performance' && m.enabled).length,
    quality: metrics.filter(m => m.category === 'quality' && m.enabled).length,
    efficiency: metrics.filter(m => m.category === 'efficiency' && m.enabled).length,
    capacity: metrics.filter(m => m.category === 'capacity' && m.enabled).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Settings className="h-6 w-6 text-blue-400" />
            Configuração de Métricas de Produção
          </h3>
          <p className="text-slate-300">
            Defina e configure métricas personalizadas para monitorar a produção farmacêutica
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleResetDefaults}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrões
          </Button>
          <Button 
            onClick={handleSaveMetrics}
            disabled={!isModified || saveStatus === 'saving'}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saveStatus === 'saving' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {saveStatus !== 'idle' && (
        <Alert variant={saveStatus === 'error' ? 'destructive' : 'default'}>
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {saveStatus === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <AlertDescription>
              {saveStatus === 'saved' && 'Configurações salvas com sucesso!'}
              {saveStatus === 'error' && 'Erro ao salvar configurações. Tente novamente.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-300">{categoryStats.performance}</div>
            <div className="text-sm text-slate-300">Performance</div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-300">{categoryStats.quality}</div>
            <div className="text-sm text-slate-300">Qualidade</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-300">{categoryStats.efficiency}</div>
            <div className="text-sm text-slate-300">Eficiência</div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-300">{categoryStats.capacity}</div>
            <div className="text-sm text-slate-300">Capacidade</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="all" className="gap-2">
            <Package className="h-4 w-4" />
            Todas ({metrics.length})
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance ({categoryStats.performance})
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Qualidade ({categoryStats.quality})
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="gap-2">
            <Zap className="h-4 w-4" />
            Eficiência ({categoryStats.efficiency})
          </TabsTrigger>
          <TabsTrigger value="capacity" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Capacidade ({categoryStats.capacity})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Metrics Configuration */}
          <div className="space-y-4">
            {filteredMetrics.map((metric) => (
              <Card key={metric.id} className={`transition-colors ${
                metric.enabled ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-900/30 border-slate-700'
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(metric.category)}`}></div>
                      <div>
                        <CardTitle className="text-base text-slate-100">{metric.name}</CardTitle>
                        <p className="text-sm text-slate-400">{metric.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(metric.category)}
                      </Badge>
                      <Switch
                        checked={metric.enabled}
                        onCheckedChange={(checked) => handleMetricUpdate(metric.id, 'enabled', checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className={`transition-opacity ${
                  metric.enabled ? 'opacity-100' : 'opacity-50'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-slate-300">Meta</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={metric.target}
                          onChange={(e) => handleMetricUpdate(metric.id, 'target', parseFloat(e.target.value))}
                          disabled={!metric.enabled}
                          className="h-8"
                        />
                        <span className="text-xs text-slate-400 whitespace-nowrap">{metric.unit}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-slate-300">Alerta (&lt;)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={metric.alertThreshold}
                          onChange={(e) => handleMetricUpdate(metric.id, 'alertThreshold', parseFloat(e.target.value))}
                          disabled={!metric.enabled}
                          className="h-8"
                        />
                        <span className="text-xs text-slate-400 whitespace-nowrap">{metric.unit}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-slate-300">Cor</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={metric.color}
                          onChange={(e) => handleMetricUpdate(metric.id, 'color', e.target.value)}
                          disabled={!metric.enabled}
                          className="w-8 h-8 rounded border border-slate-600"
                        />
                        <Input
                          value={metric.color}
                          onChange={(e) => handleMetricUpdate(metric.id, 'color', e.target.value)}
                          disabled={!metric.enabled}
                          className="h-8 font-mono text-xs"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-slate-300">Cálculo</Label>
                      <Textarea
                        value={metric.calculation}
                        onChange={(e) => handleMetricUpdate(metric.id, 'calculation', e.target.value)}
                        disabled={!metric.enabled}
                        className="h-8 text-xs font-mono resize-none"
                        placeholder="formula_calculo"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}