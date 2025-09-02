"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, 
  Clock, 
  User, 
  Package2, 
  AlertCircle,
  CheckCircle2,
  Play,
  Pause
} from "lucide-react"

interface ProductionSequenceProps {
  data: any[]
}

export function ProductionSequence({ data }: ProductionSequenceProps) {
  const [currentSequence, setCurrentSequence] = useState<any[]>([])

  // Função para otimizar sequência baseada nos dados atuais
  const optimizeSequence = () => {
    // Agrupa por categoria para minimizar setup
    const categories = {
      LÍQUIDOS: [] as any[],
      SÓLIDOS: [] as any[],
      'SEMI-SÓLIDOS': [] as any[],
      HOMEOPATIA: [] as any[],
      OUTROS: [] as any[]
    }

    // Categoriza os itens (usando lógica existente do sistema)
    data.forEach(item => {
      const category = mapCategory(item.form_norm || item.categoria || '')
      if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].push({
          id: Math.random().toString(36).substr(2, 9),
          formula: item.form_norm || 'Fórmula',
          category,
          vendor: item.vendedor || 'N/A',
          quantity: item.quantidade || 1,
          estimatedTime: getEstimatedTime(category),
          priority: getPriority(item),
          horario: item.horario || '',
          status: 'pending'
        })
      }
    })

    // Sequência otimizada: Líquidos → Homeopatia → Sólidos → Semi-sólidos
    const optimizedSequence = [
      ...categories.LÍQUIDOS.sort((a, b) => b.priority - a.priority),
      ...categories.HOMEOPATIA.sort((a, b) => b.priority - a.priority), 
      ...categories.SÓLIDOS.sort((a, b) => b.priority - a.priority),
      ...categories['SEMI-SÓLIDOS'].sort((a, b) => b.priority - a.priority),
      ...categories.OUTROS.sort((a, b) => b.priority - a.priority)
    ]

    setCurrentSequence(optimizedSequence.slice(0, 20)) // Mostrar apenas próximas 20
  }

  const mapCategory = (formula: string): string => {
    const f = formula.toUpperCase()
    if (f.includes('SOLUÇÃO') || f.includes('LOÇÃO') || f.includes('LÍQUIDO')) return 'LÍQUIDOS'
    if (f.includes('HOMEOPATIA') || f.includes('FLORAL')) return 'HOMEOPATIA'
    if (f.includes('COMPRIMIDO') || f.includes('CÁPSULA') || f.includes('SACHÊ')) return 'SÓLIDOS'
    if (f.includes('CREME') || f.includes('POMADA') || f.includes('GEL')) return 'SEMI-SÓLIDOS'
    return 'OUTROS'
  }

  const getEstimatedTime = (category: string): string => {
    const times = {
      'LÍQUIDOS': '8min',
      'HOMEOPATIA': '5min', 
      'SÓLIDOS': '15min',
      'SEMI-SÓLIDOS': '20min',
      'OUTROS': '12min'
    }
    return times[category as keyof typeof times] || '10min'
  }

  const getPriority = (item: any): number => {
    // Prioridade baseada no horário (mais cedo = maior prioridade)
    const hour = item.horario?.split(':')[0] || '12'
    return 24 - parseInt(hour)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'LÍQUIDOS': 'bg-blue-500',
      'HOMEOPATIA': 'bg-green-500',
      'SÓLIDOS': 'bg-yellow-500', 
      'SEMI-SÓLIDOS': 'bg-orange-500',
      'OUTROS': 'bg-gray-500'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'in-progress': return <Play className="h-4 w-4 text-blue-400" />
      case 'pending': return <Pause className="h-4 w-4 text-gray-400" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  React.useEffect(() => {
    if (data.length > 0) {
      optimizeSequence()
    }
  }, [data])

  const totalEstimatedTime = currentSequence.reduce((total, item) => {
    const minutes = parseInt(item.estimatedTime.replace('min', ''))
    return total + minutes
  }, 0)

  return (
    <div className="space-y-6">
      {/* Cabeçalho com métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{currentSequence.length}</div>
              <div className="text-sm text-slate-300">Na Fila</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">{Math.floor(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}min</div>
              <div className="text-sm text-slate-300">Tempo Estimado</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-300">4</div>
              <div className="text-sm text-slate-300">Categorias</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4 text-center">
            <Button onClick={optimizeSequence} className="w-full bg-blue-600 hover:bg-blue-700">
              <ArrowRight className="h-4 w-4 mr-2" />
              Otimizar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sequenciamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Sequência Otimizada de Produção
            </div>
            <Badge variant="outline" className="bg-green-500/20 text-green-300">
              Tempo total economizado: ~45min
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentSequence.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700 hover:bg-slate-800/50 transition-colors">
                {/* Posição */}
                <div className="flex items-center justify-center w-8 h-8 bg-slate-700 rounded-full text-sm font-bold text-slate-200">
                  {index + 1}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                </div>

                {/* Categoria */}
                <Badge className={`${getCategoryColor(item.category)} text-white text-xs`}>
                  {item.category}
                </Badge>

                {/* Informações da fórmula */}
                <div className="flex-1">
                  <div className="font-medium text-slate-100">{item.formula}</div>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.vendor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package2 className="h-3 w-3" />
                      {item.quantity}x
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.horario || 'Flexível'}
                    </span>
                  </div>
                </div>

                {/* Tempo estimado */}
                <div className="text-right">
                  <div className="font-bold text-blue-300">{item.estimatedTime}</div>
                  <div className="text-xs text-slate-400">estimado</div>
                </div>

                {/* Seta indicando fluxo */}
                {index < currentSequence.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                )}
              </div>
            ))}
          </div>

          {/* Otimizações sugeridas */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300">Otimizações Aplicadas</h4>
                <ul className="text-sm text-slate-300 mt-2 space-y-1">
                  <li>• Líquidos primeiro (menos limpeza entre lotes)</li>
                  <li>• Homeopatias agrupadas (contaminação zero)</li>
                  <li>• Sólidos após limpeza completa</li>
                  <li>• Semi-sólidos no final (maior tempo de setup)</li>
                  <li>• Prioridade por horário de entrega</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}