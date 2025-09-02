
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  let title, date, items, kpis, sellersData, kanbanData;

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: "Erro de configuração do servidor" 
      }, { status: 500 })
    }

    // Verificar se o usuário existe
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json({ 
        error: "Usuário não encontrado no banco de dados" 
      }, { status: 401 })
    }

    const body = await req.json();
    ({ title, date, items, kpis, sellersData, kanbanData } = body)

    // Validações mais robustas dos dados de entrada
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: "Título do relatório é obrigatório" }, { status: 400 })
    }

    if (!date || date.trim() === '') {
      return NextResponse.json({ error: "Data do relatório é obrigatória" }, { status: 400 })
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Itens do relatório devem ser fornecidos como array" }, { status: 400 })
    }

    // Validar estrutura dos KPIs
    const validatedKpis = {
      totalQuantity: Number(kpis?.totalQuantity) || 0,
      totalValue: Number(kpis?.totalValue) || 0,
      solidCount: Number(kpis?.solidCount) || 0,
      topSeller: kpis?.topSeller || '—'
    }

    // Create report
    const { data: report, error: reportError } = await (supabaseAdmin as any)
      .from('reports')
      .insert({
        title: title.trim(),
        date: date.trim(),
        status: "completed",
        user_id: session.user.id,
        total_quantity: validatedKpis.totalQuantity,
        total_value: validatedKpis.totalValue,
        solid_count: validatedKpis.solidCount,
        top_seller: validatedKpis.topSeller,
        processed_data: {
          items: Array.isArray(items) ? items : [],
          kpis: validatedKpis,
          sellersData: Array.isArray(sellersData) ? sellersData : [],
          kanbanData: kanbanData || {}
        },
        kanban_data: kanbanData || {},
        sellers_data: Array.isArray(sellersData) ? sellersData : []
      })
      .select('*')
      .single()

    if (reportError || !report) {
      console.error('Erro detalhado ao salvar relatório:', {
        error: reportError,
        userId: session.user.id,
        title: title?.substring(0, 50),
        date: date,
        itemsCount: items?.length || 0
      })
      throw new Error(`Erro ao salvar relatório: ${reportError?.message}`)
    }

    // TODO: This should be a transaction to ensure data integrity.
    // If creating report items fails, the report should be rolled back.
    if (items && Array.isArray(items) && items.length > 0) {
      try {
        const reportItems = items
          .filter(item => item && typeof item === 'object') // Filtrar itens válidos
          .map((item: any, index: number) => ({
            report_id: report.id,
            form_norm: String(item.formaNorm || item.formNorm || '').trim(),
            linha: String(item.linha || '').trim(),
            horario: String(item.horario || item.bucket || '').trim(),
            vendedor: String(item.vendedor || '—').trim(),
            quantidade: Number(item.quantidade) || 0,
            valor: Number(item.valor) || 0,
            categoria: String(item.categoria || '').trim(),
            observacoes: String(item.observacoes || '').trim(),
            source_file: String(item.sourceFile || 'controle').trim(),
            row_index: Number(item.rowIndex) || index,
            is_mapped: item.isMapped !== false
          }))

        if (reportItems.length > 0) {
          const { error: itemsError } = await (supabaseAdmin as any)
            .from('report_items')
            .insert(reportItems)

          if (itemsError) {
            console.error('Erro ao salvar itens do relatório, revertendo criação do relatório:', {
              error: itemsError,
              reportId: report.id,
            })
            // Rollback the report creation
            await supabaseAdmin.from('reports').delete().eq('id', report.id)
            throw new Error(`Erro ao salvar itens do relatório: ${itemsError.message}`)
          } else {
            console.log(`✅ ${reportItems.length} itens salvos com sucesso para relatório ${report.id}`)
          }
        }
      } catch (itemsProcessingError: any) {
        console.error('Erro ao processar itens do relatório, revertendo criação do relatório:', itemsProcessingError)
        // Rollback the report creation
        await supabaseAdmin.from('reports').delete().eq('id', report.id)
        throw itemsProcessingError
      }
    }

    console.log(`✅ Relatório salvo com sucesso! ID: ${report.id}, Usuário: ${session.user.id}, Data: ${date}`)
    
    return NextResponse.json({ 
      message: "Relatório salvo com sucesso",
      reportId: report.id 
    })
  } catch (error: any) {
    console.error("Erro detalhado ao salvar relatório:", {
      error: error.message,
      stack: error.stack,
      userId: session?.user?.id,
      requestBody: {
        hasTitle: !!title,
        hasDate: !!date,
        itemsCount: Array.isArray(items) ? items.length : 'not_array',
        hasKpis: !!kpis
      }
    })
    
    // Determinar tipo de erro para melhor resposta
    let errorMessage = "Erro interno do servidor ao salvar relatório"
    let statusCode = 500
    
    if (error.message.includes('foreign key constraint')) {
      errorMessage = "Erro de autenticação: usuário não encontrado"
      statusCode = 401
    } else if (error.message.includes('duplicate key')) {
      errorMessage = "Relatório com esta data já existe"
      statusCode = 409
    } else if (error.message.includes('not null')) {
      errorMessage = "Dados obrigatórios em falta"
      statusCode = 400
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error.message 
    }, { status: statusCode })
  }
}
