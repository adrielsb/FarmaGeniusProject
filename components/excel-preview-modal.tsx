
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, Eye, Upload } from "lucide-react"
import { toast } from "react-hot-toast"

interface ExcelPreviewData {
  fileName: string
  fileType: 'diario_receitas' | 'relatorio_controle' | 'unknown'
  sheetName: string
  totalRows: number
  previewData: any[][]
  headers: string[]
  sampleRows: any[][]
}

interface ExcelPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
  onConfirm: (file: File) => void
}

export function ExcelPreviewModal({ isOpen, onClose, file, onConfirm }: ExcelPreviewModalProps) {
  const [previewData, setPreviewData] = useState<ExcelPreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePreview = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/preview-excel', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setPreviewData(result.data)
      } else {
        setError(result.error || 'Erro ao processar arquivo')
        toast.error(result.error || 'Erro ao processar arquivo')
      }
    } catch (error) {
      const errorMessage = 'Erro ao fazer preview do arquivo'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Erro no preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (file) {
      onConfirm(file)
      onClose()
    }
  }

  const getFileTypeBadge = (fileType: string) => {
    switch (fileType) {
      case 'diario_receitas':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Diário de Receitas</Badge>
      case 'relatorio_controle':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Relatório de Controle</Badge>
      default:
        return <Badge variant="outline">Tipo não identificado</Badge>
    }
  }

  // Reiniciar dados quando o modal é aberto
  useEffect(() => {
    if (isOpen && file) {
      setPreviewData(null)
      setError(null)
      handlePreview()
    }
  }, [isOpen, file])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Preview do Arquivo Excel
          </DialogTitle>
          <DialogDescription>
            Visualize os dados antes de processar o arquivo
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando preview...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {previewData && (
          <div className="space-y-4">
            {/* Informações do arquivo */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Informações do Arquivo</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {previewData.fileName}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span> {getFileTypeBadge(previewData.fileType)}
                </div>
                <div>
                  <span className="font-medium">Planilha:</span> {previewData.sheetName}
                </div>
                <div>
                  <span className="font-medium">Total de linhas:</span> {previewData.totalRows}
                </div>
              </div>
            </div>

            {/* Preview da tabela */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview dos Dados (primeiras 5 linhas)
                </h3>
              </div>
              
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.headers.map((header, index) => (
                        <TableHead key={index} className="whitespace-nowrap">
                          {header || `Coluna ${index + 1}`}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.sampleRows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="whitespace-nowrap">
                            {cell || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {previewData.totalRows > 5 && (
              <p className="text-sm text-gray-600 text-center">
                ... e mais {previewData.totalRows - 5} linhas
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!previewData || loading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Processar Arquivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
