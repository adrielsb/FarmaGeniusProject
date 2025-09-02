
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Removida verificação de autenticação - qualquer um pode ver relatórios
    // if (!session?.user || !session.user.id) {
    //   return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    // }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: "Erro de configuração do servidor" 
      }, { status: 500 })
    }

    const { id } = await params

    // Buscar relatório (removida verificação de proprietário)
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 })
    }

    // Buscar itens do relatório
    const { data: reportItems, error: itemsError } = await supabaseAdmin
      .from('report_items')
      .select('*')
      .eq('report_id', id)
      .order('row_index', { ascending: true })

    if (itemsError) {
      console.warn(`Erro ao buscar itens do relatório: ${itemsError.message}`)
    }

    // Buscar dados do usuário (se autenticado)
    let user = null
    if (session?.user?.id) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', session.user.id)
        .single()
      user = userData
    }

    // Buscar observação do dia se existir (assumindo que existe uma tabela daily_observations)
    const { data: observation } = await supabaseAdmin
      .from('daily_observations')
      .select('*, users!user_id(name, email)')
      .eq('date', (report as any).date)
      .single()

    // Reconstruir os dados no formato esperado pelas abas
    const processedData = {
      date: (report as any).date,
      reportId: (report as any).id,
      items: (reportItems || []).map((item, index) => ({
        id: index,
        formaNorm: (item as any).form_norm,
        linha: (item as any).linha,
        horario: (item as any).horario,
        vendedor: (item as any).vendedor,
        quantidade: (item as any).quantidade,
        valor: (item as any).valor,
        categoria: (item as any).categoria,
        source: (item as any).source_file
      })),
      tableRows: (report as any).processed_data ? ((report as any).processed_data as any).tableRows || [] : [],
      kpis: {
        totalQuantity: (report as any).total_quantity,
        totalValue: (report as any).total_value,
        solidCount: (report as any).solid_count,
        topSeller: (report as any).top_seller,
        formulasProcessed: (report as any).total_quantity // formulasProcessed é o mesmo que totalQuantity
      },
      sellersData: (report as any).sellers_data || [],
      kanbanData: (report as any).kanban_data || null,
      hourlyTotals: (report as any).processed_data ? ((report as any).processed_data as any).hourlyTotals || {} : {},
      unmappedData: (report as any).processed_data ? ((report as any).processed_data as any).unmappedData || [] : []
    }

    // Adicionar dados do usuário ao relatório
    const reportWithUser = {
      ...(report as any),
      user
    }

    return NextResponse.json({
      success: true,
      data: {
        report: reportWithUser,
        processedData,
        observation
      }
    })

  } catch (error: any) {
    console.error("Error fetching report:", error)
    return NextResponse.json({ 
      error: "Erro ao buscar relatório: " + error.message 
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Removida verificação de autenticação - qualquer um pode deletar relatórios
    // if (!session?.user || !session.user.id) {
    //   return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    // }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: "Erro de configuração do servidor" 
      }, { status: 500 })
    }

    const { id } = await params

    // Verificar se o relatório existe (removida verificação de proprietário)
    const { data: report, error: findError } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !report) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 })
    }

    // Deletar itens do relatório primeiro (se não houver cascade)
    const { error: itemsDeleteError } = await supabaseAdmin
      .from('report_items')
      .delete()
      .eq('report_id', id)

    if (itemsDeleteError) {
      console.warn(`Aviso ao deletar itens: ${itemsDeleteError.message}`)
    }

    // Deletar relatório
    const { error: deleteError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new Error(`Erro ao excluir relatório: ${deleteError.message}`)
    }

    return NextResponse.json({ 
      success: true,
      message: "Relatório excluído com sucesso" 
    })

  } catch (error: any) {
    console.error("Error deleting report:", error)
    return NextResponse.json({ 
      error: "Erro ao excluir relatório: " + error.message 
    }, { status: 500 })
  }
}
