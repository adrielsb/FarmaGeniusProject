
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileSpreadsheet, Settings, Target, TrendingUp, AlertTriangle } from "lucide-react"
import { ProductionMetrics } from "./production-metrics"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface EnhancedReportTableProps {
  data: any[]
  totalProcessedFormulas?: number
}

interface DailyCapacityConfig {
  id?: string
  totalCapacity: number
  isActive: boolean
}

interface ProductionMetric {
  id?: string
  timeSlot: string
  category: string
  capacity: number
  isActive: boolean
}

const BUCKETS = ["7:00 AS 8:00", "10:00 AS 13:00", "14:00", "15:00", "16:00 AS 17:00", "OUTROS"]

// Mapear categorias das formas farmacêuticas
const mapFormToCategory = (formLabel: string): string => {
  const label = formLabel.toUpperCase()
  
  if (label.includes('CAPSULA') || label.includes('COMPRIMIDO') || label.includes('SACHE')) {
    return 'SÓLIDOS'
  }
  if (label.includes('CREME') || label.includes('POMADA') || label.includes('GEL')) {
    return 'SEMI-SÓLIDOS'
  }
  if (label.includes('LOÇÃO') || label.includes('LOCAO') || label.includes('SOLUÇÃO')) {
    return 'LÍQUIDOS'
  }
  if (label.includes('HOMEOPATIA') || label.includes('FLORAL')) {
    return 'HOMEOPATIA'
  }
  
  return 'OUTROS'
}

export function EnhancedReportTable({ data, totalProcessedFormulas }: EnhancedReportTableProps) {
  const [metrics, setMetrics] = useState<ProductionMetric[]>([])
  const [dailyCapacity, setDailyCapacity] = useState<DailyCapacityConfig>({
    totalCapacity: 500,
    isActive: true
  })
  const [showMetricsConfig, setShowMetricsConfig] = useState(false)

  // Função para obter a métrica correspondente
  const getMetricForCell = (rowLabel: string, timeSlot: string): ProductionMetric | null => {
    if (!Array.isArray(metrics)) return null
    const category = mapFormToCategory(rowLabel)
    return metrics.find(m => 
      m.timeSlot === timeSlot && 
      m.category === category && 
      m.isActive
    ) || null
  }

  // Função para determinar a cor baseada na capacidade (nova lógica)
  const getCellPerformanceColor = (value: number, capacity: number): string => {
    if (value === 0) return 'text-slate-400'
    
    // Verde = abaixo da capacidade (OK)
    // Vermelho = acima da capacidade (sobrecarga)
    if (value <= capacity) return 'text-green-300 bg-green-900/30' // Dentro da capacidade
    return 'text-red-300 bg-red-900/30' // Acima da capacidade (sobrecarga)
  }

  // Função para obter o ícone de performance (nova lógica)
  const getPerformanceIcon = (value: number, capacity: number) => {
    if (value === 0) return null
    
    // Verde/OK = abaixo da capacidade
    // Vermelho/Alerta = acima da capacidade 
    if (value > capacity) {
      return <AlertTriangle className="h-3 w-3 text-red-300 inline ml-1" />
    }
    if (value > 0) {
      return <TrendingUp className="h-3 w-3 text-green-300 inline ml-1" />
    }
    return null
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Relatório por Formas Farmacêuticas
          </CardTitle>
          <CardDescription>
            Relatório com indicadores de performance de produção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            Nenhum dado processado ainda. Faça upload dos arquivos e processe-os primeiro.
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTableRow = (row: any, index: number) => {
    if (row.kind === 'section') {
      return (
        <TableRow key={index} className="bg-slate-700/40 border-t-2 border-slate-600">
          <TableCell colSpan={BUCKETS.length + 2} className="font-bold text-blue-200 py-4 px-5 text-base leading-relaxed bg-gradient-to-r from-slate-700/30 to-slate-600/30">
            {row.label}
          </TableCell>
        </TableRow>
      )
    }

    const isSubtotal = row.kind === 'subtotalH' || row.kind === 'extra'
    const isTotal = row.label?.includes('TOTAL POR HORARIO') // Totais de seção
    const isItem = row.kind === 'item' // Itens individuais
    const cellClass = isSubtotal 
      ? 'bg-slate-700/40 font-semibold text-slate-50 border-slate-600' 
      : 'text-slate-100 hover:text-white'

    return (
      <TableRow key={index} className={
        isSubtotal 
          ? 'bg-slate-700/30 border-t border-slate-600 hover:bg-slate-700/50' 
          : 'hover:bg-slate-800/50 border-t border-slate-700/50'
      }>
        <TableCell className={`${cellClass} ${isSubtotal ? 'font-bold' : 'font-medium'} py-3 px-5 leading-relaxed`}>
          {row.label}
        </TableCell>
        {BUCKETS.map((bucket, bucketIndex) => {
          const value = row[bucket] || 0
          let metric = null
          let performanceColor = ''
          let performanceIcon = null

          // Aplicar métricas para itens individuais (linhas normais)
          if (isItem) {
            metric = getMetricForCell(row.label, bucket)
            if (metric && value > 0) {
              performanceColor = getCellPerformanceColor(value, metric.capacity)
              performanceIcon = getPerformanceIcon(value, metric.capacity)
            }
          }
          
          // Aplicar métricas para totais de seção (TOTAL POR HORARIO)
          if (isTotal && isSubtotal) {
            // Para totais de seção, usar a categoria SÓLIDOS como base
            const sectionMetric = Array.isArray(metrics) ? metrics.find(m => 
              m.timeSlot === bucket && 
              m.category === 'SÓLIDOS' && // Usar SÓLIDOS como referência para totais
              m.isActive
            ) : null
            if (sectionMetric && value > 0) {
              performanceColor = getCellPerformanceColor(value, sectionMetric.capacity)
              performanceIcon = getPerformanceIcon(value, sectionMetric.capacity)
              metric = sectionMetric
            }
          }

          return (
            <TableCell 
              key={bucketIndex} 
              className={`text-right font-mono ${cellClass} ${performanceColor} relative group py-3 px-4 font-semibold leading-relaxed`}
            >
              <div className="flex items-center justify-end">
                <span className="text-base">{value}</span>
                {performanceIcon}
              </div>
              
              {/* Tooltip com informação da métrica */}
              {metric && value > 0 && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                  <div className="bg-slate-900 text-white text-sm rounded-lg px-3 py-2 shadow-xl border-2 border-slate-600">
                    <div className="font-medium">Capacidade: <span className="text-blue-300">{metric.capacity}</span></div>
                    <div className="font-medium">Atual: <span className="text-green-300">{value}</span></div>
                    <div className="font-medium">Status: <span className={value <= metric.capacity ? 'text-green-300' : 'text-red-300'}>{value <= metric.capacity ? 'OK' : 'Sobrecarga'}</span></div>
                  </div>
                </div>
              )}
            </TableCell>
          )
        })}
        
        {/* Aplicar cor também no TOTAL da linha */}
        <TableCell className={`text-right font-mono font-bold ${cellClass} py-3 px-4 text-base leading-relaxed ${isSubtotal ? 'bg-slate-600/40' : 'bg-slate-800/30'}`}>
          {row.total || 0}
        </TableCell>
      </TableRow>
    )
  }

  // Usar o número de fórmulas processadas se fornecido, senão calcular total de quantidades
  const grandTotal = (typeof totalProcessedFormulas === 'number') 
    ? totalProcessedFormulas 
    : data.filter(row => row.kind === 'item').reduce((sum, row) => sum + (row.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Card de Configuração das Métricas */}
      <div className="flex justify-end">
        <Dialog open={showMetricsConfig} onOpenChange={setShowMetricsConfig}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurar Métricas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configuração de Métricas de Produção</DialogTitle>
              <DialogDescription>
                Configure as capacidades de produção por horário e categoria
              </DialogDescription>
            </DialogHeader>
            <ProductionMetrics 
              onMetricsUpdate={setMetrics} 
              onDailyCapacityUpdate={setDailyCapacity}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Indicadores de Capacidade e Total Diário */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Fórmulas (dia) */}
        <Card className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-1">Fórmulas (dia)</h3>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-blue-300">
                    {totalProcessedFormulas || 0}
                  </span>
                </div>
                <p className="text-sm mt-1 text-slate-300">
                  Fórmulas processadas
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-900/30">
                <FileSpreadsheet className="h-8 w-8 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total do Dia - Mais Visível */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-1">Total de Fórmulas do Dia</h3>
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-bold ${
                    dailyCapacity.isActive && grandTotal > dailyCapacity.totalCapacity
                      ? 'text-red-300'
                      : 'text-green-300'
                  }`}>
                    {grandTotal}
                  </span>
                  {dailyCapacity.isActive && (
                    <>
                      <span className="text-slate-400">de</span>
                      <span className="text-xl font-semibold text-blue-400">
                        {dailyCapacity.totalCapacity}
                      </span>
                    </>
                  )}
                </div>
                {dailyCapacity.isActive && (
                  <p className={`text-sm mt-1 ${
                    grandTotal > dailyCapacity.totalCapacity
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    {grandTotal > dailyCapacity.totalCapacity
                      ? `Sobrecarga: +${grandTotal - dailyCapacity.totalCapacity} fórmulas`
                      : `Dentro da capacidade: ${dailyCapacity.totalCapacity - grandTotal} disponíveis`
                    }
                  </p>
                )}
              </div>
              {dailyCapacity.isActive && (
                <div className={`p-3 rounded-full ${
                  grandTotal > dailyCapacity.totalCapacity
                    ? 'bg-red-900/30'
                    : 'bg-green-900/30'
                }`}>
                  {grandTotal > dailyCapacity.totalCapacity ? (
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-green-400" />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legenda de Cores */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-100 mb-3">Legenda de Capacidade</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-green-300">OK</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-red-300">Sobrecarga</span>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-full bg-slate-700/50">
                <Target className="h-8 w-8 text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Relatório por Formas Farmacêuticas
          </CardTitle>
          <CardDescription>
            Relatório com indicadores visuais de performance de produção
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-lg border-2 border-slate-600 overflow-x-auto shadow-inner bg-slate-950/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/80 border-b-2 border-slate-600">
                  <TableHead className="sticky left-0 bg-slate-800 z-10 min-w-[250px] text-white font-bold text-sm py-4 px-5 leading-relaxed">
                    FORMA FARMACÊUTICA
                  </TableHead>
                  {BUCKETS.map((bucket, index) => (
                    <TableHead key={index} className="text-center whitespace-nowrap px-4 py-4 text-slate-100 font-semibold text-sm leading-relaxed">
                      {bucket}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold text-white py-4 px-4 text-sm leading-relaxed">
                    TOTAL
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => renderTableRow(row, index))}
                
                {/* Linha de total geral */}
                <TableRow className="bg-slate-700/60 border-t-4 border-slate-500 hover:bg-slate-700/80">
                  <TableCell className="font-bold text-white py-4 px-5 text-base leading-relaxed">
                    TOTAL DE FÓRMULAS DO DIA
                  </TableCell>
                  {BUCKETS.map((bucket, bucketIndex) => (
                    <TableCell key={bucketIndex} className="text-center py-4 px-4 text-slate-300 font-medium">
                      —
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-white text-xl py-4 px-4 leading-relaxed bg-slate-600/50">
                    {grandTotal}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between mt-6 p-4 bg-slate-800/40 rounded-lg border border-slate-600">
            <div className="text-slate-200 font-medium leading-relaxed">
              <span className="text-white">Linhas:</span> {data.length} • <span className="text-white">Métricas ativas:</span> {Array.isArray(metrics) ? metrics.filter(m => m.isActive).length : 0}
            </div>
            <div>
              {dailyCapacity.isActive && (
                <span className={`text-base font-semibold leading-relaxed ${
                  grandTotal > dailyCapacity.totalCapacity ? 'text-red-300' : 'text-green-300'
                }`}>
                  <span className="text-slate-200">Capacidade diária:</span> {grandTotal}/{dailyCapacity.totalCapacity}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
