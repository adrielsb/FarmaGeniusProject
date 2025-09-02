
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import {
  Upload,
  Play,
  Download,
  Save,
  History,
  FileSpreadsheet,
  Calculator,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  X,
  Database,
  Eye
} from "lucide-react"
import { FileUploadZone } from "@/components/dashboard/file-upload-zone"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { EnhancedReportTable } from "@/components/dashboard/enhanced-report-table"
import { KanbanView } from "@/components/dashboard/kanban-view"
import { SellersMetrics } from "@/components/dashboard/sellers-metrics"
import { HistoryView } from "@/components/dashboard/history-view"
import { ExcelPreviewModal } from "@/components/excel-preview-modal"
import { UnmappedItemsManager } from "@/components/unmapped-items-manager"
import { UnmappedItemsDialog } from "@/components/unmapped-items-dialog"
import { LastProcessingBanner } from "@/components/last-processing-banner"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { DatabaseVerification } from "@/components/database-verification"

interface User {
  name?: string | null
  email?: string | null
  id?: string
}

interface DashboardContentProps {
  user: User | undefined
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("table") // Mudança: padrão agora é "table"
  const [isProcessing, setIsProcessing] = useState(false)
  const [reportDate, setReportDate] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [mappingData, setMappingData] = useState("")
  const [showMapping, setShowMapping] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  
  // Files
  const [diarioFile, setDiarioFile] = useState<File | null>(null)
  const [controleFile, setControleFile] = useState<File | null>(null)
  
  // Period upload files
  const [periodDiarioFile, setPeriodDiarioFile] = useState<File | null>(null)
  const [periodControleFile, setPeriodControleFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<"daily" | "period">("daily")
  
  // Last processing state
  const [lastProcessing, setLastProcessing] = useState<any>(null)
  const [hasProcessedData, setHasProcessedData] = useState(false)
  
  // Historical data viewing state
  const [isViewingHistorical, setIsViewingHistorical] = useState(false)
  const [historicalReportDate, setHistoricalReportDate] = useState("")
  const [historicalReportId, setHistoricalReportId] = useState("")
  
  // Processed data
  const [reportData, setReportData] = useState<any>(null)
  const [kpiData, setKpiData] = useState({
    totalQuantity: 0,
    totalValue: 0,
    solidCount: 0,
    topSeller: "—",
    formulasProcessed: 0
  })
  const [tableRows, setTableRows] = useState<any[]>([])
  const [sellersData, setSellersData] = useState<any[]>([])
  const [kanbanData, setKanbanData] = useState<any>(null)
  const [unmappedData, setUnmappedData] = useState<any[]>([])
  
  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  
  // Unmapped items state
  const [showUnmappedItems, setShowUnmappedItems] = useState(false)
  
  // Interactive mapping state
  const [showUnmappedDialog, setShowUnmappedDialog] = useState(false)
  const [pendingUnmappedItems, setPendingUnmappedItems] = useState<any[]>([])
  const [pendingProcessData, setPendingProcessData] = useState<any>(null)

  // Handle preview functionality
  const handlePreview = (file: File) => {
    setPreviewFile(file)
    setPreviewModalOpen(true)
  }

  const handlePreviewConfirm = (file: File) => {
    // File is already set in the respective state, just close modal
    setPreviewModalOpen(false)
    setPreviewFile(null)
  }

  // Handle interactive mapping during processing
  const handleInteractiveMappingContinue = async (newMappings: Record<string, string>) => {
    if (!pendingProcessData) return
    
    try {
      // Update mapping data with new mappings
      const existingMapping = mappingData ? JSON.parse(mappingData) : {}
      const updatedMapping = { ...existingMapping, ...newMappings }
      setMappingData(JSON.stringify(updatedMapping, null, 2))
      
      setShowUnmappedDialog(false)
      setPendingUnmappedItems([])
      
      // Continue processing with updated mappings
      await continueProcessingWithMappings(pendingProcessData, updatedMapping)
      
    } catch (error) {
      console.error('Erro ao aplicar mapeamentos interativos:', error)
      setStatus("error")
      setStatusMessage("Erro ao aplicar mapeamentos durante processamento")
      setIsProcessing(false)
    } finally {
      setPendingProcessData(null)
    }
  }

  const handleInteractiveMappingCancel = () => {
    setShowUnmappedDialog(false)
    setPendingUnmappedItems([])
    setPendingProcessData(null)
    setIsProcessing(false)
    setStatus("idle")
    setStatusMessage("Processamento cancelado pelo usuário")
  }

  // Continue processing with updated mappings
  const continueProcessingWithMappings = async (processData: any, mappings: Record<string, string>) => {
    try {
      setStatusMessage("Continuando processamento com mapeamentos...")
      
      const formData = new FormData()
      formData.append('diario', processData.diarioFile)
      formData.append('controle', processData.controleFile)
      
      if (processData.date) {
        formData.append('date', processData.date)
      }
      
      formData.append('mapping', JSON.stringify(mappings))

      const apiEndpoint = processData.isPeriod ? '/api/process-period' : '/api/process-report'
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle successful processing
      if (processData.isPeriod) {
        setStatus("success")
        setStatusMessage(`${result.processedReports?.length || 0} relatórios processados com sucesso! Verifique o histórico.`)
        setUnmappedData(Array.isArray(result.unmappedData) ? result.unmappedData : [])
      } else {
        setReportData(result)
        setKpiData({
          totalQuantity: typeof result.kpis?.totalQuantity === 'number' ? result.kpis.totalQuantity : 0,
          totalValue: typeof result.kpis?.totalValue === 'number' ? result.kpis.totalValue : 0,
          solidCount: typeof result.kpis?.solidCount === 'number' ? result.kpis.solidCount : 0,
          topSeller: result.kpis?.topSeller || "—",
          formulasProcessed: typeof result.kpis?.formulasProcessed === 'number' ? result.kpis.formulasProcessed : 0
        })
        setTableRows(Array.isArray(result.tableRows) ? result.tableRows : [])
        setSellersData(Array.isArray(result.sellersData) ? result.sellersData : [])
        setKanbanData(result.kanbanData || null)
        setUnmappedData(Array.isArray(result.unmappedData) ? result.unmappedData : [])
        setStatus("success")
        setStatusMessage("Dados processados com sucesso!")
      }
      
      setActiveTab("table")
      
      // Reload last processing data after successful processing
      setTimeout(() => {
        loadLastProcessing()
      }, 1000)

    } catch (error: any) {
      console.error('Erro ao continuar processamento:', error)
      setStatus("error")
      setStatusMessage(error.message || "Erro ao continuar processamento")
    } finally {
      setIsProcessing(false)
    }
  }

  // Check for unmapped items and show dialog if needed
  const checkUnmappedItems = async (processData: any) => {
    try {
      // First, do a preliminary check for unmapped items
      const formData = new FormData()
      formData.append('diario', processData.diarioFile)
      formData.append('controle', processData.controleFile)
      
      if (processData.date) {
        formData.append('date', processData.date)
      }
      
      // Send current mapping for check
      const currentMapping = mappingData ? mappingData : '{}'
      formData.append('mapping', currentMapping)
      formData.append('checkOnly', 'true') // Flag to only check for unmapped items

      const apiEndpoint = processData.isPeriod ? '/api/process-period' : '/api/process-report'
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      })

      const result = await response.json()

      // If there are unmapped items, show interactive dialog
      if (result.unmappedData && result.unmappedData.length > 0) {
        setPendingUnmappedItems(result.unmappedData)
        setPendingProcessData(processData)
        setShowUnmappedDialog(true)
        setStatusMessage("Aguardando mapeamento de itens não reconhecidos...")
        return true // Indicates processing is paused
      }
      
      return false // No unmapped items, can proceed normally
      
    } catch (error) {
      console.error('Erro ao verificar itens não mapeados:', error)
      return false // Continue with normal processing on error
    }
  }

  // Handle manual mapping of unmapped items
  const handleApplyMappings = async (newMappings: Record<string, string>) => {
    if (!diarioFile || !controleFile) {
      setStatus("error")
      setStatusMessage("Por favor, faça upload dos dois arquivos primeiro")
      return
    }

    setIsProcessing(true)
    setStatus("idle")
    
    try {
      // Merge existing mapping with new mappings
      const existingMapping = mappingData ? JSON.parse(mappingData) : {}
      const updatedMapping = { ...existingMapping, ...newMappings }
      
      // Update mapping data
      setMappingData(JSON.stringify(updatedMapping, null, 2))
      
      // Reprocess data with new mappings
      const formData = new FormData()
      formData.append('diario', diarioFile)
      formData.append('controle', controleFile)
      formData.append('date', reportDate)
      formData.append('mapping', JSON.stringify(updatedMapping))

      const response = await fetch('/api/process-report', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro no reprocessamento')
      }

      // Update states with new processed data
      setReportData(result)
      setKpiData(result.kpis || {
        totalQuantity: 0,
        totalValue: 0,
        solidCount: 0,
        topSeller: "—"
      })
      setTableRows(result.tableData || [])
      setSellersData(result.sellersData || [])
      setKanbanData(result.kanbanData || null)
      setUnmappedData(result.unmappedData || [])

      setStatus("success")
      setStatusMessage("Mapeamentos aplicados e dados reprocessados com sucesso!")
      setActiveTab("table")
      
      // Reload last processing data after successful reprocessing
      loadLastProcessing()

    } catch (error) {
      console.error('Erro no reprocessamento:', error)
      setStatus("error")
      setStatusMessage(error instanceof Error ? error.message : 'Erro no reprocessamento')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    // Set default date safely
    try {
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const defaultDate = `${day}/${month}`
      setReportDate(defaultDate)
    } catch (error) {
      console.error('Erro ao definir data padrão:', error)
      setReportDate('01/01')
    }
    
    // Load last processing data
    loadLastProcessing()
  }, [])

  const loadLastProcessing = async () => {
    try {
      console.log('🔄 Carregando último processamento...')
      
      const response = await fetch('/api/last-processing', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      })
      
      console.log('📡 Resposta da API:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('📊 Dados recebidos:', result)
        
        if (result?.success && result?.data) {
          console.log('✅ Dados válidos encontrados:', {
            reportDate: result.data.report_date,
            totalQuantity: result.data.total_quantity,
            totalValue: result.data.total_value
          })
          
          // Transform snake_case to camelCase for the component
          const transformedData = {
            reportDate: result.data.report_date,
            processedAt: result.data.processed_at,
            totalQuantity: result.data.total_quantity,
            totalValue: result.data.total_value,
            solidCount: result.data.solid_count,
            topSeller: result.data.top_seller,
            diarioFileName: result.data.diario_file_name,
            controleFileName: result.data.controle_file_name
          }
          
          console.log('🔄 Dados transformados para camelCase:', transformedData)
          setLastProcessing(transformedData)
          
          // Safely check if there's data from current month
          try {
            const today = new Date()
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
            const reportDate = result.data.reportDate || ''
            const hasCurrentMonthData = reportDate.includes(`/${currentMonth}`)
            
            setHasProcessedData(hasCurrentMonthData)
            
            // Always keep table tab active regardless of data availability
            setActiveTab("table")
          } catch (dateError) {
            console.error('Erro ao processar data:', dateError)
            setHasProcessedData(false)
          }
        } else {
          console.log('⚠️ Nenhum dado de processamento encontrado')
          // Keep table tab active even without processed data
          setLastProcessing(null)
          setHasProcessedData(false)
        }
      } else {
        console.error('❌ Erro na API:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('❌ Detalhes do erro:', errorText)
        setLastProcessing(null)
        setHasProcessedData(false)
      }
    } catch (error) {
      console.error('❌ Erro em loadLastProcessing:', error)
      setLastProcessing(null)
      setHasProcessedData(false)
    }
  }

  // Function to load historical report data
  const loadHistoricalReport = async (reportId: string, reportDate: string) => {
    setStatus("idle")
    setStatusMessage("")
    
    try {
      const response = await fetch(`/api/history/${reportId}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar relatório histórico')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido')
      }

      const { processedData } = result.data

      // Set historical data to the same states used by current data
      setReportData(processedData)
      setTableRows(processedData.tableRows || [])
      setKpiData({
        totalQuantity: processedData.kpis?.totalQuantity || 0,
        totalValue: processedData.kpis?.totalValue || 0,
        solidCount: processedData.kpis?.solidCount || 0,
        topSeller: processedData.kpis?.topSeller || '',
        formulasProcessed: processedData.kpis?.formulasProcessed || 0
      })
      setSellersData(processedData.sellersData || [])
      setKanbanData(processedData.kanbanData || null)
      setUnmappedData(processedData.unmappedData || [])
      
      // Set historical viewing state
      setIsViewingHistorical(true)
      setHistoricalReportDate(reportDate)
      setHistoricalReportId(reportId)
      
      setStatus("success")
      setStatusMessage(`Dados históricos carregados: ${reportDate}`)
      
      // Switch to table tab to show the data
      setActiveTab("table")

    } catch (error: any) {
      setStatus("error")
      setStatusMessage(error.message || "Erro ao carregar dados históricos")
    }
  }

  // Function to return to current data view
  const returnToCurrentData = () => {
    setIsViewingHistorical(false)
    setHistoricalReportDate("")
    setHistoricalReportId("")
    setStatus("idle")
    setStatusMessage("")
    
    // Clear historical data - user will need to process new data or select another historical report
    if (!reportData || isViewingHistorical) {
      setReportData(null)
      setTableRows([])
      setKpiData({
        totalQuantity: 0,
        totalValue: 0,
        solidCount: 0,
        topSeller: '',
        formulasProcessed: 0
      })
      setSellersData([])
      setKanbanData(null)
      setUnmappedData([])
    }
  }

  // Function to view the latest report directly
  const handleViewLatestReport = async () => {
    if (!lastProcessing || !lastProcessing.reportDate) {
      console.log('⚠️ Nenhum último processamento disponível')
      return
    }

    try {
      setStatus("idle")
      setStatusMessage("Carregando último relatório...")

      // Find the latest report by date and get its ID
      const response = await fetch('/api/history?limit=1')
      const historyData = await response.json()
      
      if (historyData.success && historyData.reports && historyData.reports.length > 0) {
        const latestReport = historyData.reports[0]
        console.log('📊 Carregando relatório:', latestReport.id, 'Data:', latestReport.date)
        
        // Load the historical report data
        await loadHistoricalReport(latestReport.id, latestReport.date)
      } else {
        console.log('❌ Nenhum relatório encontrado no histórico')
        setStatus("error")
        setStatusMessage("Nenhum relatório encontrado no histórico")
      }
    } catch (error) {
      console.error('❌ Erro ao carregar último relatório:', error)
      setStatus("error")
      setStatusMessage("Erro ao carregar último relatório")
    }
  }

  const handleProcessData = async () => {
    // Validação inicial
    if (!diarioFile || !controleFile) {
      setStatus("error")
      setStatusMessage("Por favor, faça upload dos dois arquivos (Diário e Controle)")
      return
    }

    if (!reportDate || reportDate.trim() === '') {
      setStatus("error")
      setStatusMessage("Por favor, defina uma data para o relatório")
      return
    }

    setIsProcessing(true)
    setStatus("idle")
    setStatusMessage("Verificando itens não mapeados...")
    
    const processData = {
      diarioFile,
      controleFile,
      date: reportDate.trim(),
      isPeriod: false
    }
    
    // Check for unmapped items first
    const hasUnmappedItems = await checkUnmappedItems(processData)
    
    if (hasUnmappedItems) {
      // Processing is paused, user will interact with dialog
      return
    }
    
    // Continue with normal processing if no unmapped items
    setStatusMessage("Processando dados...")
    await continueProcessingWithMappings(processData, JSON.parse(mappingData || '{}'))
  }

  const handleProcessPeriod = async () => {
    // Validação inicial
    if (!periodDiarioFile || !periodControleFile) {
      setStatus("error")
      setStatusMessage("Por favor, faça upload dos dois arquivos (Diário e Controle) para o período")
      return
    }

    setIsProcessing(true)
    setStatus("idle")
    setStatusMessage("Verificando itens não mapeados...")
    
    const processData = {
      diarioFile: periodDiarioFile,
      controleFile: periodControleFile,
      isPeriod: true
    }
    
    // Check for unmapped items first
    const hasUnmappedItems = await checkUnmappedItems(processData)
    
    if (hasUnmappedItems) {
      // Processing is paused, user will interact with dialog
      return
    }
    
    // Continue with normal processing if no unmapped items
    setStatusMessage("Processando arquivos por período...")
    await continueProcessingWithMappings(processData, JSON.parse(mappingData || '{}'))
  }

  const handleSaveReport = async () => {
    if (!reportData) {
      setStatus("error")
      setStatusMessage("Nenhum relatório para salvar. Processe os dados primeiro.")
      return
    }

    if (!reportDate || reportDate.trim() === '') {
      setStatus("error")
      setStatusMessage("Data do relatório é obrigatória")
      return
    }

    try {
      setStatus("idle")
      setStatusMessage("Salvando relatório...")
      
      // Preparar dados para envio com validações
      const dataToSend = {
        title: `Relatório ${reportDate.trim()}`,
        date: reportDate.trim(),
        items: Array.isArray(reportData.items) ? reportData.items : tableRows,
        kpis: {
          totalQuantity: typeof kpiData.totalQuantity === 'number' ? kpiData.totalQuantity : 0,
          totalValue: typeof kpiData.totalValue === 'number' ? kpiData.totalValue : 0,
          solidCount: typeof kpiData.solidCount === 'number' ? kpiData.solidCount : 0,
          topSeller: kpiData.topSeller || "—"
        },
        sellersData: Array.isArray(sellersData) ? sellersData : [],
        kanbanData: kanbanData || {}
      }

      const response = await fetch('/api/save-report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar')
      }

      setStatus("success")
      setStatusMessage("Relatório salvo no histórico!")
    } catch (error: any) {
      setStatus("error")
      setStatusMessage(error.message || "Erro ao salvar relatório")
    }
  }

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!reportData) {
      setStatus("error")
      setStatusMessage("Nenhum dado para exportar")
      return
    }

    try {
      const response = await fetch(`/api/export-report?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      if (!response.ok) {
        throw new Error('Erro na exportação')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_${reportDate}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setStatus("success")
      setStatusMessage(`Arquivo ${format.toUpperCase()} exportado!`)
    } catch (error: any) {
      setStatus("error")
      setStatusMessage(error.message || "Erro na exportação")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Dashboard de Automação
            </h1>
            <p className="text-slate-300">
              Sistema de processamento de relatórios Excel
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"}>
              {status === "idle" && "Aguardando dados"}
              {status === "success" && "Processado"}
              {status === "error" && "Erro"}
            </Badge>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('csv')}
                disabled={!reportData}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={!reportData}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                XLSX
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveReport}
                disabled={!reportData}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </div>

        {status !== "idle" && (
          <Alert variant={status === "error" ? "destructive" : "default"}>
            <div className="flex items-center gap-2">
              {status === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>{statusMessage}</AlertDescription>
            </div>
          </Alert>
        )}
      </motion.div>

      {/* KPI Cards */}
      <KPICards 
        data={kpiData}
        isLoading={isProcessing}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 bg-slate-800/50">
            <TabsTrigger 
              value="upload" 
              className={`gap-2 ${!hasProcessedData ? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse' : ''}`}
            >
              <Upload className="h-4 w-4" />
              Upload
              {!hasProcessedData && (
                <Badge variant="secondary" className="ml-1 bg-white text-orange-500 text-xs">
                  !
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2" disabled={!reportData}>
              <FileSpreadsheet className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2" disabled={!reportData}>
              <BarChart3 className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="sellers" className="gap-2" disabled={!reportData}>
              <Users className="h-4 w-4" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 relative">
              <Activity className="h-4 w-4" />
              Análise
              <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 text-xs px-1 py-0">
                Ativo
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="gap-2">
              <Database className="h-4 w-4" />
              Diagnósticos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            {/* Upload Mode Selector */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Modo de Upload
                  </CardTitle>
                  <CardDescription>
                    Escolha como deseja fazer o upload dos arquivos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={uploadMode === "daily" ? "default" : "outline"}
                      className="h-auto p-4 justify-start"
                      onClick={() => setUploadMode("daily")}
                    >
                      <div className="text-left">
                        <div className="font-semibold">Upload Diário</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Processar arquivo de uma data específica
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant={uploadMode === "period" ? "default" : "outline"}
                      className="h-auto p-4 justify-start"
                      onClick={() => setUploadMode("period")}
                    >
                      <div className="text-left">
                        <div className="font-semibold">Upload por Período</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Processar arquivo com múltiplas datas
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                {uploadMode === "daily" ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileSpreadsheet className="h-5 w-5" />
                          Diário de Receitas
                        </CardTitle>
                        <CardDescription>
                          Arquivo Excel (.xlsx) com dados de receitas de uma data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FileUploadZone
                          file={diarioFile}
                          onFileChange={setDiarioFile}
                          onPreview={handlePreview}
                          accept=".xlsx"
                          label="Diário de Receitas"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Controle de Fórmulas
                        </CardTitle>
                        <CardDescription>
                          Arquivo Excel (.xlsx) com controle de fórmulas de uma data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FileUploadZone
                          file={controleFile}
                          onFileChange={setControleFile}
                          onPreview={handlePreview}
                          accept=".xlsx"
                          label="Controle de Fórmulas"
                        />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileSpreadsheet className="h-5 w-5" />
                          Diário de Receitas (Período)
                        </CardTitle>
                        <CardDescription>
                          Arquivo Excel (.xlsx) com dados de receitas de múltiplas datas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FileUploadZone
                          file={periodDiarioFile}
                          onFileChange={setPeriodDiarioFile}
                          onPreview={handlePreview}
                          accept=".xlsx"
                          label="Diário de Receitas (Período)"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Controle de Fórmulas (Período)
                        </CardTitle>
                        <CardDescription>
                          Arquivo Excel (.xlsx) com controle de fórmulas de múltiplas datas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FileUploadZone
                          file={periodControleFile}
                          onFileChange={setPeriodControleFile}
                          onPreview={handlePreview}
                          accept=".xlsx"
                          label="Controle de Fórmulas (Período)"
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <div className="lg:sticky lg:top-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Configurações e Ação
                    </CardTitle>
                    <CardDescription>
                      Data, mapeamento e processamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {uploadMode === "daily" ? (
                      <div>
                        <Label htmlFor="date">Data do Relatório</Label>
                        <DatePicker
                          date={selectedDate}
                          onDateChange={(date) => {
                            setSelectedDate(date)
                            if (date) {
                              // Formato DD/MM para compatibilidade com o backend
                              setReportDate(format(date, "dd/MM", { locale: ptBR }))
                            } else {
                              setReportDate("")
                            }
                          }}
                          placeholder="Selecione a data do relatório"
                        />
                        {reportDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Data selecionada: {reportDate}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Calculator className="h-4 w-4" />
                          <span className="font-medium">Upload por Período</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          O sistema detectará automaticamente as datas nos arquivos e criará relatórios individuais para cada data encontrada.
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowMapping(!showMapping)}
                      >
                        {showMapping ? "Ocultar" : "Mostrar"} Mapeamento
                      </Button>
                      {showMapping && (
                        <div className="mt-2">
                          <Textarea
                            placeholder="Cole aqui o JSON de mapeamento..."
                            value={mappingData}
                            onChange={(e) => setMappingData(e.target.value)}
                            className="h-32 font-mono text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Unmapped Items Manager - show only when there are unmapped items after processing */}
                    {unmappedData && unmappedData.length > 0 && (
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowUnmappedItems(!showUnmappedItems)}
                          className="flex items-center gap-2"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          {showUnmappedItems ? "Ocultar" : "Mostrar"} Itens Não Mapeados ({unmappedData.length})
                        </Button>
                        {showUnmappedItems && (
                          <div className="mt-4">
                            <UnmappedItemsManager
                              unmappedData={unmappedData}
                              onApplyMappings={uploadMode === "daily" ? handleApplyMappings : undefined}
                              isProcessing={isProcessing}
                              showMappingOnly={uploadMode === "period"}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {uploadMode === "daily" ? (
                      <Button
                        onClick={handleProcessData}
                        disabled={isProcessing || !diarioFile || !controleFile}
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Processar Dados
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleProcessPeriod}
                        disabled={isProcessing || !periodDiarioFile || !periodControleFile}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processando Período...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Processar Período
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="table">
            {/* Historical Data Banner */}
            {isViewingHistorical ? (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                        <History className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">Visualizando Dados Históricos</h3>
                        <p className="text-sm text-purple-700">
                          Relatório do dia: <span className="font-medium">{historicalReportDate}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("history")}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <History className="h-4 w-4 mr-1" />
                        Ver Histórico
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={returnToCurrentData}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Voltar ao Atual
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              lastProcessing && (
                <div className="space-y-4">
                  <LastProcessingBanner 
                    data={lastProcessing} 
                    onViewHistory={() => setActiveTab("history")}
                  />
                  
                  {/* Quick action to view latest report */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewLatestReport}
                      className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar Último Relatório
                    </Button>
                  </div>
                </div>
              )
            )}
            
            {tableRows && tableRows.length > 0 ? (
              <EnhancedReportTable data={tableRows} totalProcessedFormulas={kpiData.formulasProcessed} />
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum dado processado
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {isViewingHistorical ? 
                      "Este relatório histórico não possui dados de tabela." :
                      hasProcessedData ? 
                      "Faça o upload dos arquivos para ver os dados da tabela." :
                      "Não há dados processados do mês atual. Faça o upload dos arquivos para começar."
                    }
                  </p>
                  {!isViewingHistorical && (
                    <Button 
                      onClick={() => setActiveTab("upload")}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Ir para Upload
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="kanban">
            {/* Historical Data Banner for Kanban */}
            {isViewingHistorical && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                        <History className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">Visualizando Dados Históricos</h3>
                        <p className="text-sm text-purple-700">
                          Relatório do dia: <span className="font-medium">{historicalReportDate}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("history")}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <History className="h-4 w-4 mr-1" />
                        Ver Histórico
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={returnToCurrentData}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Voltar ao Atual
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <KanbanView data={kanbanData} />
          </TabsContent>

          <TabsContent value="sellers">
            {/* Historical Data Banner for Sellers */}
            {isViewingHistorical && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                        <History className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">Visualizando Dados Históricos</h3>
                        <p className="text-sm text-purple-700">
                          Relatório do dia: <span className="font-medium">{historicalReportDate}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("history")}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <History className="h-4 w-4 mr-1" />
                        Ver Histórico
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={returnToCurrentData}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Voltar ao Atual
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <SellersMetrics data={sellersData} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryView 
              onViewHistoricalReport={loadHistoricalReport}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="diagnostics">
            <DatabaseVerification />
          </TabsContent>
        </Tabs>
      </motion.div>
      
      {/* Excel Preview Modal */}
      <ExcelPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false)
          setPreviewFile(null)
        }}
        file={previewFile}
        onConfirm={handlePreviewConfirm}
      />

      {/* Unmapped Items Interactive Dialog */}
      <UnmappedItemsDialog
        isOpen={showUnmappedDialog}
        unmappedItems={pendingUnmappedItems}
        onContinue={handleInteractiveMappingContinue}
        onCancel={handleInteractiveMappingCancel}
      />
    </div>
  )
}
