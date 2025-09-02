
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { History, Download, Eye, Trash2, Calendar, FileSpreadsheet, Filter, X, CheckSquare, Square } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HistoryItem {
  id: string
  title: string
  date: string
  status: string
  createdAt: string
  totalQuantity: number
  totalValue: number
  topSeller?: string
}

interface HistoryViewProps {
  onViewHistoricalReport?: (reportId: string, reportDate: string) => void
}

export function HistoryView({ onViewHistoricalReport }: HistoryViewProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState<string>("month") // Padrão: mês atual
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isCustomDateRange, setIsCustomDateRange] = useState(false)
  const [startDay, setStartDay] = useState<number>(1)
  const [endDay, setEndDay] = useState<number>(31)
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0')) // Mês atual por padrão
  const [isDayRange, setIsDayRange] = useState(false) // Desativado por padrão
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    if (filterPeriod !== "custom") {
      fetchHistory()
    }
  }, [filterPeriod])

  useEffect(() => {
    if (isCustomDateRange && startDate && endDate) {
      fetchHistory()
    }
  }, [startDate, endDate, isCustomDateRange])

  useEffect(() => {
    if (isDayRange) {
      fetchHistory()
    }
  }, [startDay, endDay, selectedMonth, isDayRange])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      
      // Construir URL com parâmetros de filtro
      const params = new URLSearchParams()
      
      if (isDayRange) {
        params.append('startDay', startDay.toString())
        params.append('endDay', endDay.toString())
        params.append('month', selectedMonth)
      } else if (isCustomDateRange && startDate && endDate) {
        params.append('startDate', startDate.toISOString())
        params.append('endDate', endDate.toISOString())
      } else {
        params.append('period', filterPeriod)
      }
      
      const response = await fetch(`/api/history?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        // Ordenar por data do relatório em ordem decrescente (mais recente primeiro)
        const sortedReports = (data.reports || []).sort((a: HistoryItem, b: HistoryItem) => {
          // Converter DD/MM para formato comparável (assumindo ano atual)
          const currentYear = new Date().getFullYear()
          
          // Parsear data do formato DD/MM
          const parseDate = (dateStr: string) => {
            const [day, month] = dateStr.split('/').map(Number)
            return new Date(currentYear, month - 1, day)
          }
          
          try {
            const dateA = parseDate(a.date)
            const dateB = parseDate(b.date)
            
            // Primeiro ordenar por data do relatório
            const dateComparison = dateB.getTime() - dateA.getTime()
            
            // Se as datas forem iguais, ordenar por data de criação
            if (dateComparison === 0) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            }
            
            return dateComparison
          } catch (error) {
            // Se houver erro no parsing, usar data de criação como fallback
            console.warn('Erro ao parsear data do relatório:', { a: a.date, b: b.date })
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }
        })
        
        setHistoryItems(sortedReports)
        setSelectedItems(new Set()) // Clear selections when data changes
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) {
      return
    }

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setHistoryItems(items => items.filter(item => item.id !== id))
        setSelectedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return

    const confirmMessage = selectedItems.size === historyItems.length 
      ? 'Tem certeza que deseja excluir TODOS os relatórios?' 
      : `Tem certeza que deseja excluir ${selectedItems.size} relatório(s) selecionado(s)?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)
    
    try {
      const deletePromises = Array.from(selectedItems).map(id => 
        fetch(`/api/history/${id}`, { method: 'DELETE' })
      )
      
      const responses = await Promise.all(deletePromises)
      const successfulDeletes = responses.filter(response => response.ok).length
      
      if (successfulDeletes > 0) {
        // Remove successfully deleted items
        setHistoryItems(items => items.filter(item => !selectedItems.has(item.id)))
        setSelectedItems(new Set())
      }
      
      if (successfulDeletes < selectedItems.size) {
        alert(`${successfulDeletes} de ${selectedItems.size} relatórios foram excluídos. Alguns podem ter falhado.`)
      }
    } catch (error) {
      console.error('Error deleting selected reports:', error)
      alert('Erro ao excluir relatórios selecionados.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(historyItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const isAllSelected = selectedItems.size === historyItems.length && historyItems.length > 0
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < historyItems.length

  const handleViewReport = async (item: HistoryItem) => {
    if (onViewHistoricalReport) {
      // Use the callback to load historical data in the main dashboard
      onViewHistoricalReport(item.id, item.date)
    } else {
      // Fallback to opening in new tab (if needed in the future)
      window.open(`/dashboard/report/${item.id}`, '_blank')
    }
  }

  const handleExportReport = async (id: string) => {
    try {
      const response = await fetch(`/api/export-history/${id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio_${id}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const handlePeriodChange = (value: string) => {
    setFilterPeriod(value)
    if (value === "custom") {
      setIsCustomDateRange(true)
      setIsDayRange(false)
    } else if (value === "dayRange") {
      setIsDayRange(true)
      setIsCustomDateRange(false)
      setStartDate(undefined)
      setEndDate(undefined)
    } else {
      setIsCustomDateRange(false)
      setIsDayRange(false)
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }

  const clearCustomDateRange = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setIsCustomDateRange(false)
    setFilterPeriod("month")
  }

  const clearDayRange = () => {
    setIsDayRange(false)
    setStartDay(1)
    setEndDay(31)
    setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'))
    setFilterPeriod("month")
  }

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'today':
        return 'Hoje'
      case 'week':
        return 'Última semana'
      case 'month':
        return 'Mês atual'
      case 'all':
        return 'Todos os períodos'
      case 'custom':
        return 'Período personalizado'
      case 'dayRange':
        return `Dias ${startDay} a ${endDay}/${selectedMonth}`
      default:
        return 'Mês atual'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-slate-400">Carregando histórico...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Relatórios
              </CardTitle>
              <CardDescription>
                {historyItems.length} relatórios salvos - {getPeriodLabel()} {historyItems.length > 8 && '(com scroll)'}
                {selectedItems.size > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({selectedItems.size} selecionados)
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir ({selectedItems.size})
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={fetchHistory}>
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription>
            Filtre os relatórios por data para encontrar rapidamente o que precisa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Filtros rápidos */}
            <div>
              <label className="text-sm font-medium mb-3 block">Filtros rápidos</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <Button
                  variant={filterPeriod === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("today")}
                  className="justify-center"
                >
                  Hoje
                </Button>
                <Button
                  variant={filterPeriod === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("week")}
                  className="justify-center"
                >
                  7 dias
                </Button>
                <Button
                  variant={filterPeriod === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("month")}
                  className="justify-center"
                >
                  Mês atual
                </Button>
                <Button
                  variant={filterPeriod === "dayRange" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("dayRange")}
                  className="justify-center"
                >
                  Por dias
                </Button>
                <Button
                  variant={filterPeriod === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("custom")}
                  className="justify-center"
                >
                  Personalizado
                </Button>
                <Button
                  variant={filterPeriod === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("all")}
                  className="justify-center"
                >
                  Todos
                </Button>
              </div>
            </div>

            {/* Filtro personalizado com calendário */}
            {isCustomDateRange && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Período personalizado</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">Data inicial</label>
                    <DatePicker
                      date={startDate}
                      onDateChange={setStartDate}
                      placeholder="Selecione a data inicial"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">Data final</label>
                    <DatePicker
                      date={endDate}
                      onDateChange={setEndDate}
                      placeholder="Selecione a data final"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {startDate && endDate && (
                    <p className="text-sm text-blue-700 font-medium">
                      Período: {format(startDate, "dd/MM/yyyy", { locale: ptBR })} até {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                  <Button variant="outline" size="sm" onClick={clearCustomDateRange}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
            )}

            {/* Filtro por dias */}
            {isDayRange && (
              <div className="space-y-4 p-4 border rounded-lg bg-green-50/50 border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-900">Filtro por intervalo de dias</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">Mês</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01">Janeiro</SelectItem>
                        <SelectItem value="02">Fevereiro</SelectItem>
                        <SelectItem value="03">Março</SelectItem>
                        <SelectItem value="04">Abril</SelectItem>
                        <SelectItem value="05">Maio</SelectItem>
                        <SelectItem value="06">Junho</SelectItem>
                        <SelectItem value="07">Julho</SelectItem>
                        <SelectItem value="08">Agosto</SelectItem>
                        <SelectItem value="09">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">Dia inicial</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={startDay}
                      onChange={(e) => setStartDay(parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-slate-700">Dia final</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={endDay}
                      onChange={(e) => setEndDay(parseInt(e.target.value) || 31)}
                      placeholder="31"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-700 font-medium">
                    Período: {startDay} ao {endDay} de {
                      ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(selectedMonth)]
                    }
                  </p>
                  <Button variant="outline" size="sm" onClick={clearDayRange}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
            )}

            {/* Status do filtro ativo */}
            {filterPeriod !== "all" && (
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Filtro ativo: <span className="text-blue-600">{getPeriodLabel()}</span>
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handlePeriodChange("all")}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Mostrar todos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {historyItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              Nenhum relatório salvo
            </h3>
            <p className="text-slate-400">
              Processe alguns dados e salve-os para vê-los aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className={`overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 ${
              historyItems.length > 8 ? 'max-h-96' : 'max-h-full'
            }`}>
              <div className="rounded-md border border-slate-700">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-900">
                    <TableRow className="bg-slate-800/70 border-b-2 border-slate-600">
                      <TableHead className="w-12 py-4 px-4">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className={isPartiallySelected ? "data-[state=checked]:bg-blue-600" : ""}
                        />
                      </TableHead>
                      <TableHead className="text-white font-bold py-4 px-4 leading-relaxed">Título</TableHead>
                      <TableHead className="text-white font-bold py-4 px-4 leading-relaxed">Data</TableHead>
                      <TableHead className="text-white font-bold py-4 px-4 leading-relaxed">Status</TableHead>
                      <TableHead className="text-right text-white font-bold py-4 px-4 leading-relaxed">Quantidade</TableHead>
                      <TableHead className="text-right text-white font-bold py-4 px-4 leading-relaxed">Valor</TableHead>
                      <TableHead className="text-white font-bold py-4 px-4 leading-relaxed">Top Vendedor</TableHead>
                      <TableHead className="text-white font-bold py-4 px-4 leading-relaxed">Criado em</TableHead>
                      <TableHead className="text-center text-white font-bold py-4 px-4 leading-relaxed">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
              <div className="border-l border-r border-b border-slate-700 rounded-b-md">
                <Table>
                  <TableBody>
                    {historyItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                        className="hover:bg-slate-800/50 border-b border-slate-700/50 last:border-b-0 transition-colors duration-200"
                      >
                        <TableCell className="w-12 py-4 px-4">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-slate-100 py-4 px-4 leading-relaxed">
                          {item.title}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-300" />
                            <span className="text-slate-200 font-medium">{item.date}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Badge variant={
                            item.status === "completed" ? "default" : 
                            item.status === "error" ? "destructive" : 
                            "secondary"
                          } className="font-medium">
                            {item.status === "completed" && "Completo"}
                            {item.status === "processing" && "Processando"}
                            {item.status === "error" && "Erro"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-100 font-semibold py-4 px-4 leading-relaxed">
                          {item.totalQuantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-300 font-semibold py-4 px-4 leading-relaxed">
                          R$ {(item.totalValue || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell className="text-slate-200 font-medium py-4 px-4 leading-relaxed">
                          {item.topSeller || "—"}
                        </TableCell>
                        <TableCell className="text-slate-300 py-4 px-4 leading-relaxed">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(item)}
                              title="Visualizar relatório"
                              className="hover:bg-blue-500/20 hover:text-blue-300 text-slate-300 h-9 w-9"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportReport(item.id)}
                              title="Exportar relatório"
                              className="hover:bg-green-500/20 hover:text-green-300 text-slate-300 h-9 w-9"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(item.id)}
                              title="Excluir relatório"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
