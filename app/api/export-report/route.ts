
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'xlsx'
    
    const data = await req.json()
    
    if (!data || !data.items) {
      return NextResponse.json({ error: "Dados não fornecidos" }, { status: 400 })
    }

    // Prepare data for export
    const exportData = [
      // Header
      [
        'Forma Normalizada',
        'Linha',
        'Horário',
        'Vendedor',
        'Quantidade',
        'Valor',
        'Categoria',
        'Observações',
        'Arquivo Origem',
        'Status'
      ],
      // Data rows
      ...data.items.map((item: any) => [
        item.formNorm || '',
        item.linha || '',
        item.horario || '',
        item.vendedor || '',
        item.quantidade || 0,
        item.valor || 0,
        item.categoria || '',
        item.observacoes || '',
        item.sourceFile || '',
        item.isMapped ? 'Mapeado' : 'Não mapeado'
      ])
    ]

    if (format === 'csv') {
      // Generate CSV
      const csvContent = exportData
        .map(row => row.map((cell: any) => `"${cell}"`).join(','))
        .join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=relatorio.csv'
        }
      })
    } else {
      // Generate XLSX
      const ws = XLSX.utils.aoa_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
      
      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
      
      return new NextResponse(xlsxBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=relatorio.xlsx'
        }
      })
    }
  } catch (error: any) {
    console.error("Error exporting report:", error)
    return NextResponse.json({ 
      error: "Erro na exportação: " + error.message 
    }, { status: 500 })
  }
}
