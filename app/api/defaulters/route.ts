
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import * as XLSX from "xlsx"

export const dynamic = "force-dynamic"

interface ClientPayment {
  name: string
  phone: string
  date: Date
  totalValue: number
  received: string // 'S' ou 'N'
  pedidos: number
}

// Função para converter data Excel serial para Date
const excelDateToJSDate = (serial: number) => {
  const epoch = new Date(1900, 0, 1); // Excel epoch
  return new Date(epoch.getTime() + (serial - 2) * 24 * 60 * 60 * 1000); // -2 para corrigir bug do Excel
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: "Erro de configuração do servidor" 
      }, { status: 500 })
    }

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status') || 'all'

    // Buscar todos os relatórios do usuário
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (reportsError) {
      throw new Error(`Erro ao buscar relatórios: ${reportsError.message}`)
    }

    const clientsMap = new Map<string, ClientPayment>()

    // Processar cada relatório
    for (const report of reports) {
      try {
        // Tentar ler arquivo de controle (que tem os dados completos)
        const path = require('path')
        const fs = require('fs')
        const controleFilePath = path.join(process.cwd(), '../Uploads', (report as any).controle_file_name || '')
        
        if ((report as any).controle_file_name && fs.existsSync(controleFilePath)) {
          const workbook = XLSX.readFile(controleFilePath)
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(sheet)

          // Processar cada linha
          for (const row of data) {
            const rowData = row as any // Type assertion para acessar propriedades
            const nomeCliente = rowData['NomeCliente']
            const telefone = String(rowData['TEL'] || '').replace(/\D/g, '') // Limpar telefone
            const dataSerial = rowData['Data']
            const valor = parseFloat(rowData['Valor'] || 0)
            const recebido = String(rowData['Recebido'] || 'N').toUpperCase()
            
            if (nomeCliente && telefone && valor > 0) {
              const clientKey = `${nomeCliente}-${telefone}`
              const data = typeof dataSerial === 'number' ? excelDateToJSDate(dataSerial) : new Date()
              
              if (clientsMap.has(clientKey)) {
                const existing = clientsMap.get(clientKey)!
                existing.totalValue += valor
                existing.pedidos += 1
                // Manter data mais recente
                if (data > existing.date) {
                  existing.date = data
                }
                // Se qualquer pedido não foi recebido, marcar como 'N'
                if (existing.received === 'S' && recebido === 'N') {
                  existing.received = 'N'
                }
              } else {
                clientsMap.set(clientKey, {
                  name: nomeCliente,
                  phone: telefone,
                  date: data,
                  totalValue: valor,
                  received: recebido,
                  pedidos: 1
                })
              }
            }
          }
        }
      } catch (fileError) {
        console.log(`Erro ao processar arquivo ${(report as any).controle_file_name}:`, fileError)
        continue
      }
    }

    // Converter para array e filtrar
    const allClients = Array.from(clientsMap.values())
    
    let filteredClients = allClients
    if (statusFilter === 'received') {
      filteredClients = allClients.filter(c => c.received === 'S')
    } else if (statusFilter === 'pending') {
      filteredClients = allClients.filter(c => c.received === 'N')
    }

    // Calcular estatísticas
    const stats = {
      total: allClients.length,
      totalAmount: allClients.reduce((sum, c) => sum + c.totalValue, 0),
      received: allClients.filter(c => c.received === 'S').length,
      pending: allClients.filter(c => c.received === 'N').length,
      totalOrders: allClients.reduce((sum, c) => sum + c.pedidos, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        clients: filteredClients.sort((a, b) => b.date.getTime() - a.date.getTime()),
        stats
      }
    })
  } catch (error) {
    console.error("Erro ao buscar dados de clientes:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erro interno do servidor" 
    }, { status: 500 })
  }
}

// As outras operações não são mais necessárias já que os dados são extraídos automaticamente
// Poderia implementar apenas um PUT para alterar status de "Recebido" se necessário
