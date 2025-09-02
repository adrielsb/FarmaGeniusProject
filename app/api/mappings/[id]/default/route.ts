
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const { data: mapping, error: findError } = await supabaseAdmin
      .from('mappings')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (findError || !mapping) {
      return NextResponse.json({ error: "Mapeamento não encontrado" }, { status: 404 })
    }

    // Remover is_default de todos os outros mapeamentos do usuário
    const { error: updateManyError } = await (supabaseAdmin as any)
      .from('mappings')
      .update({ is_default: false })
      .eq('user_id', session.user.id)
      .eq('is_default', true)

    if (updateManyError) {
      throw new Error(`Erro ao atualizar mapeamentos existentes: ${updateManyError.message}`)
    }

    // Definir este mapeamento como padrão
    const { error: setDefaultError } = await (supabaseAdmin as any)
      .from('mappings')
      .update({ is_default: true })
      .eq('id', id)

    if (setDefaultError) {
      throw new Error(`Erro ao definir mapeamento padrão: ${setDefaultError.message}`)
    }

    return NextResponse.json({ message: "Mapeamento padrão definido com sucesso" })
  } catch (error) {
    console.error("Erro ao definir mapeamento padrão:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
