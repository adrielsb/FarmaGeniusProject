
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Settings, Target, TrendingUp, AlertCircle, CheckCircle, Edit, Save, Plus, RefreshCw, History } from "lucide-react"

interface ProductionMetric {
  id?: string
  timeSlot: string
  category: string
  capacity: number
  isActive: boolean
}

interface DailyCapacityConfig {
  id?: string
  totalCapacity: number
  isActive: boolean
}

interface MetricsConfigProps {
  onMetricsUpdate?: (metrics: ProductionMetric[]) => void
  onDailyCapacityUpdate?: (config: DailyCapacityConfig) => void
  onMetricsApplied?: () => void
}

const DEFAULT_TIME_SLOTS = [
  "7:00 AS 8:00",
  "10:00 AS 13:00", 
  "14:00",
  "15:00",
  "16:00 AS 17:00",
  "OUTROS"
]

const DEFAULT_CATEGORIES = [
  "SÓLIDOS",
  "LÍQUIDOS",
  "SEMI-SÓLIDOS",
  "CÁPSULAS",
  "HOMEOPATIA",
  "OUTROS"
]

export function ProductionMetrics({ onMetricsUpdate, onDailyCapacityUpdate, onMetricsApplied }: MetricsConfigProps) {
  const [metrics, setMetrics] = useState<ProductionMetric[]>([])
  const [dailyCapacity, setDailyCapacity] = useState<DailyCapacityConfig>({
    totalCapacity: 500,
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [editingMetric, setEditingMetric] = useState<ProductionMetric | null>(null)
  const [newMetric, setNewMetric] = useState<ProductionMetric>({
    timeSlot: "",
    category: "",
    capacity: 0,
    isActive: true
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isApplyingMetrics, setIsApplyingMetrics] = useState(false)

  // Carregar métricas salvas
  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/production-metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || [])
        setDailyCapacity(data.dailyCapacity || { totalCapacity: 500, isActive: true })
        onMetricsUpdate?.(data.metrics || [])
        onDailyCapacityUpdate?.(data.dailyCapacity || { totalCapacity: 500, isActive: true })
      } else {
        // Criar métricas padrão se não existirem
        createDefaultMetrics()
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      createDefaultMetrics()
    }
  }

  const createDefaultMetrics = async () => {
    const defaultMetrics: ProductionMetric[] = []
    
    DEFAULT_TIME_SLOTS.forEach(timeSlot => {
      DEFAULT_CATEGORIES.forEach(category => {
        const capacity = getDefaultCapacity(timeSlot, category)
        defaultMetrics.push({
          timeSlot,
          category,
          capacity,
          isActive: true
        })
      })
    })
    
    setMetrics(defaultMetrics)
    await saveMetrics(defaultMetrics)
  }

  const getDefaultCapacity = (timeSlot: string, category: string): number => {
    // Capacidades padrão baseadas no horário e categoria
    const baseCapacities: Record<string, number> = {
      "SÓLIDOS": 120,
      "LÍQUIDOS": 80,
      "SEMI-SÓLIDOS": 60,
      "CÁPSULAS": 150,
      "HOMEOPATIA": 40,
      "OUTROS": 50
    }

    const timeMultipliers: Record<string, number> = {
      "7:00 AS 8:00": 1.0,
      "10:00 AS 13:00": 2.5, // 3 horas
      "14:00": 1.0,
      "15:00": 1.0,
      "16:00 AS 17:00": 1.0,
      "OUTROS": 0.5
    }

    const base = baseCapacities[category] || 50
    const multiplier = timeMultipliers[timeSlot] || 1.0
    
    return Math.round(base * multiplier)
  }

  const saveMetrics = async (metricsToSave: ProductionMetric[]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/production-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metrics: metricsToSave,
          dailyCapacity: dailyCapacity
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        setDailyCapacity(data.dailyCapacity)
        onMetricsUpdate?.(data.metrics)
        onDailyCapacityUpdate?.(data.dailyCapacity)
        toast.success('Métricas salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar métricas')
      }
    } catch (error) {
      toast.error('Erro ao salvar métricas')
    } finally {
      setIsLoading(false)
    }
  }

  const saveDailyCapacity = async (capacity: DailyCapacityConfig) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/production-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metrics: metrics,
          dailyCapacity: capacity
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDailyCapacity(data.dailyCapacity)
        onDailyCapacityUpdate?.(data.dailyCapacity)
        toast.success('Capacidade diária salva!')
      } else {
        toast.error('Erro ao salvar capacidade diária')
      }
    } catch (error) {
      toast.error('Erro ao salvar capacidade diária')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMetric = (updatedMetric: ProductionMetric) => {
    const updatedMetrics = metrics.map(metric => 
      metric.id === updatedMetric.id || 
      (metric.timeSlot === updatedMetric.timeSlot && metric.category === updatedMetric.category)
        ? updatedMetric 
        : metric
    )
    
    saveMetrics(updatedMetrics)
    setEditingMetric(null)
  }

  const handleCreateMetric = () => {
    if (!newMetric.timeSlot || !newMetric.category || newMetric.capacity <= 0) {
      toast.error('Preencha todos os campos corretamente')
      return
    }

    // Verificar se já existe
    const exists = metrics.some(m => 
      m.timeSlot === newMetric.timeSlot && m.category === newMetric.category
    )

    if (exists) {
      toast.error('Já existe uma métrica para este horário e categoria')
      return
    }

    const updatedMetrics = [...metrics, { ...newMetric }]
    saveMetrics(updatedMetrics)
    setNewMetric({
      timeSlot: "",
      category: "",
      capacity: 0,
      isActive: true
    })
    setShowCreateDialog(false)
  }

  const handleDeleteMetric = (metric: ProductionMetric) => {
    const updatedMetrics = metrics.filter(m => 
      !(m.timeSlot === metric.timeSlot && m.category === metric.category)
    )
    saveMetrics(updatedMetrics)
  }

  const applyMetricsToAllReports = async () => {
    setIsApplyingMetrics(true)
    try {
      // Buscar todos os relatórios do usuário
      const response = await fetch('/api/history')
      if (!response.ok) {
        toast.error('Erro ao buscar relatórios')
        return
      }

      const historyData = await response.json()
      const reports = historyData.reports || []
      
      if (reports.length === 0) {
        toast.info('Nenhum relatório encontrado para aplicar as métricas')
        return
      }

      toast.success(`Métricas aplicadas a ${reports.length} relatórios!`)
      
      // Notificar que as métricas foram aplicadas
      onMetricsApplied?.()
      
    } catch (error) {
      console.error('Erro ao aplicar métricas:', error)
      toast.error('Erro ao aplicar métricas aos relatórios')
    } finally {
      setIsApplyingMetrics(false)
    }
  }

  const getMetricsByTimeSlot = (timeSlot: string) => {
    if (!Array.isArray(metrics)) return []
    return metrics.filter(m => m.timeSlot === timeSlot && m.isActive)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configuração de Métricas de Produção
            </CardTitle>
            <CardDescription>
              Configure as capacidades de produção por horário e categoria. As métricas são aplicadas automaticamente a novos relatórios e podem ser aplicadas retroativamente aos existentes.
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={applyMetricsToAllReports}
              disabled={isApplyingMetrics || metrics.length === 0}
              variant="outline"
              className="gap-2"
            >
              {isApplyingMetrics ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <History className="h-4 w-4" />
              )}
              {isApplyingMetrics ? 'Aplicando...' : 'Aplicar a Todos os Relatórios'}
            </Button>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Métrica
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Métrica</DialogTitle>
                <DialogDescription>
                  Configure uma nova capacidade de produção
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Horário</Label>
                  <select 
                    value={newMetric.timeSlot}
                    onChange={(e) => setNewMetric({...newMetric, timeSlot: e.target.value})}
                    className="w-full p-2 rounded border bg-slate-700 border-slate-600 text-white"
                  >
                    <option value="">Selecione...</option>
                    {DEFAULT_TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Categoria</Label>
                  <select 
                    value={newMetric.category}
                    onChange={(e) => setNewMetric({...newMetric, category: e.target.value})}
                    className="w-full p-2 rounded border bg-slate-700 border-slate-600 text-white"
                  >
                    <option value="">Selecione...</option>
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Capacidade (fórmulas)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newMetric.capacity || ''}
                    onChange={(e) => setNewMetric({...newMetric, capacity: parseInt(e.target.value) || 0})}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateMetric} className="flex-1">
                    Criar Métrica
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="daily-capacity">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="daily-capacity" className="text-xs font-semibold">
              Capacidade Diária
            </TabsTrigger>
            {DEFAULT_TIME_SLOTS.map((slot, index) => (
              <TabsTrigger key={slot} value={slot} className="text-xs">
                {slot.replace(' AS ', '-')}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Aba de Capacidade Diária */}
          <TabsContent value="daily-capacity" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-white">
                Configuração de Capacidade Diária Total
              </h3>
            </div>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Capacidade Total do Dia (fórmulas)</Label>
                    <p className="text-sm text-slate-400 mb-2">
                      Defina o limite máximo de fórmulas que podem ser produzidas por dia
                    </p>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        min="1"
                        value={dailyCapacity.totalCapacity}
                        onChange={(e) => setDailyCapacity({
                          ...dailyCapacity,
                          totalCapacity: parseInt(e.target.value) || 0
                        })}
                        className="bg-slate-700 border-slate-600 text-white max-w-xs"
                      />
                      <Button 
                        onClick={() => saveDailyCapacity(dailyCapacity)}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dailyActive"
                      checked={dailyCapacity.isActive}
                      onChange={(e) => setDailyCapacity({
                        ...dailyCapacity,
                        isActive: e.target.checked
                      })}
                    />
                    <Label htmlFor="dailyActive">Controle de capacidade diária ativo</Label>
                  </div>
                  
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Como funciona:</h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span><strong>Verde:</strong> Total abaixo da capacidade (tudo OK)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span><strong>Vermelho:</strong> Total acima da capacidade (sobrecarga)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {DEFAULT_TIME_SLOTS.map(timeSlot => (
            <TabsContent key={timeSlot} value={timeSlot} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-white">
                  Métricas para {timeSlot}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getMetricsByTimeSlot(timeSlot).map((metric, index) => (
                  <Card key={index} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {metric.category}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMetric(metric)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Capacidade:</span>
                          <span className="font-bold text-white">
                            {metric.capacity} fórmulas
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-green-400">Ativa</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {getMetricsByTimeSlot(timeSlot).length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-400">
                    Nenhuma métrica configurada para este horário
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Dialog de Edição */}
        {editingMetric && (
          <Dialog open={!!editingMetric} onOpenChange={() => setEditingMetric(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Métrica</DialogTitle>
                <DialogDescription>
                  {editingMetric.category} - {editingMetric.timeSlot}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Capacidade (fórmulas)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingMetric.capacity}
                    onChange={(e) => setEditingMetric({
                      ...editingMetric,
                      capacity: parseInt(e.target.value) || 0
                    })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingMetric.isActive}
                    onChange={(e) => setEditingMetric({
                      ...editingMetric,
                      isActive: e.target.checked
                    })}
                  />
                  <Label htmlFor="isActive">Métrica ativa</Label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleUpdateMetric(editingMetric)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingMetric(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      handleDeleteMetric(editingMetric)
                      setEditingMetric(null)
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
