
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function DELETE(
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
      .select('is_default')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (findError || !mapping) {
      return NextResponse.json({ error: "Mapeamento não encontrado" }, { status: 404 })
    }

    if ((mapping as any).is_default) {
      return NextResponse.json({ error: "Não é possível excluir o mapeamento padrão" }, { status: 400 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('mappings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new Error(`Erro ao excluir mapeamento: ${deleteError.message}`)
    }

    return NextResponse.json({ message: "Mapeamento excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir mapeamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

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
    
    const { name, description, mappingData } = await request.json()

    const { data: mapping, error: findError } = await supabaseAdmin
      .from('mappings')
      .select('name, description, mapping_data')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (findError || !mapping) {
      return NextResponse.json({ error: "Mapeamento não encontrado" }, { status: 404 })
    }

    const { data: updatedMapping, error: updateError } = await (supabaseAdmin as any)
      .from('mappings')
      .update({
        name: name || (mapping as any).name,
        description: description !== undefined ? description : (mapping as any).description,
        mapping_data: mappingData || (mapping as any).mapping_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, description, mapping_data, is_default, created_at, updated_at')
      .single()

    if (updateError || !updatedMapping) {
      throw new Error(`Erro ao atualizar mapeamento: ${updateError?.message}`)
    }

    // Converter para formato esperado pelo frontend
    const formattedMapping = {
      id: updatedMapping.id,
      name: updatedMapping.name,
      description: updatedMapping.description,
      mappingData: updatedMapping.mapping_data,
      isDefault: updatedMapping.is_default,
      createdAt: updatedMapping.created_at,
      updatedAt: updatedMapping.updated_at
    }

    return NextResponse.json(formattedMapping)
  } catch (error) {
    console.error("Erro ao atualizar mapeamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
