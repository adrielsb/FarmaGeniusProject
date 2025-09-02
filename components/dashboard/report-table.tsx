
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileSpreadsheet, Calendar } from "lucide-react"

interface ReportTableProps {
  data: any[]
}

const BUCKETS = ["7:00 AS 8:00", "10:00 AS 13:00", "14:00", "15:00", "16:00 AS 17:00", "OUTROS"]

export function ReportTable({ data }: ReportTableProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Relatório por Formas Farmacêuticas
          </CardTitle>
          <CardDescription>
            Relatório detalhado baseado no protótipo original
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
        <TableRow key={index} className="bg-slate-700/30">
          <TableCell colSpan={BUCKETS.length + 2} className="font-bold text-blue-300 py-3">
            {row.label}
          </TableCell>
        </TableRow>
      )
    }

    const isSubtotal = row.kind === 'subtotalH' || row.kind === 'extra'
    const cellClass = isSubtotal ? 'bg-slate-700/20 font-semibold' : ''

    return (
      <TableRow key={index} className={isSubtotal ? 'bg-slate-700/10' : 'hover:bg-slate-800/30'}>
        <TableCell className={`${cellClass} ${isSubtotal ? 'font-bold' : ''}`}>
          {row.label}
        </TableCell>
        {BUCKETS.map((bucket, bucketIndex) => (
          <TableCell key={bucketIndex} className={`text-right font-mono ${cellClass}`}>
            {row[bucket] || 0}
          </TableCell>
        ))}
        <TableCell className={`text-right font-mono font-bold ${cellClass}`}>
          {row.total || 0}
        </TableCell>
      </TableRow>
    )
  }

  // Calcular total geral
  const grandTotal = data
    .filter(row => row.kind === 'item')
    .reduce((sum, row) => sum + (row.total || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Relatório por Formas Farmacêuticas
        </CardTitle>
        <CardDescription>
          Relatório detalhado organizado por grupos e horários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-700 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/50">
                <TableHead className="sticky left-0 bg-slate-800 z-10 min-w-[250px]">
                  FORMA FARMACÊUTICA
                </TableHead>
                {BUCKETS.map((bucket, index) => (
                  <TableHead key={index} className="text-center whitespace-nowrap px-3">
                    {bucket}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold">
                  TOTAL
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => renderTableRow(row, index))}
              
              {/* Linha de total geral */}
              <TableRow className="bg-slate-600/30 border-t-2 border-slate-500">
                <TableCell className="font-bold text-white py-3">
                  TOTAL DE FÓRMULAS DO DIA
                </TableCell>
                {BUCKETS.map((bucket, bucketIndex) => (
                  <TableCell key={bucketIndex} className="text-center">
                    —
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-white text-lg">
                  {grandTotal}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <div>
            Total de linhas da tabela: {data.length}
          </div>
          <div>
            <strong className="text-blue-400">
              Total geral de fórmulas: {grandTotal}
            </strong>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
