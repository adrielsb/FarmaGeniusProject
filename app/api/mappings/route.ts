export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { createErrorResponse, createSuccessResponse, sanitizeString, checkRateLimit } from "@/lib/api-utils"
import { mappingSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return createErrorResponse("Não autorizado", 401)
    }

    if (!supabaseAdmin) {
      return createErrorResponse("Erro de configuração do servidor", 500)
    }

    const { data: mappings, error } = await supabaseAdmin
      .from('mappings')
      .select('id, name, description, mapping_data, is_default, created_at, updated_at')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar mapeamentos: ${error.message}`)
    }

    // Converter para formato esperado pelo frontend
    const formattedMappings = (mappings || []).map(mapping => ({
      id: (mapping as any).id,
      name: (mapping as any).name,
      description: (mapping as any).description,
      mappingData: (mapping as any).mapping_data,
      isDefault: (mapping as any).is_default,
      createdAt: (mapping as any).created_at,
      updatedAt: (mapping as any).updated_at
    }))

    return createSuccessResponse(formattedMappings)
  } catch (error) {
    console.error("Erro ao buscar mapeamentos:", error)
    return createErrorResponse("Erro interno do servidor", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return createErrorResponse("Não autorizado", 401)
    }

    const body = await request.json()
    
    // Sanitizar dados
    const sanitizedData = {
      name: body.name ? sanitizeString(body.name) : "",
      description: body.description ? sanitizeString(body.description) : "",
      mappingData: body.mappingData
    }

    // Validar dados
    const validationResult = mappingSchema.safeParse(sanitizedData)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(", ")
      return createErrorResponse(errors, 400)
    }

    const { name, description, mappingData } = validationResult.data

    if (!supabaseAdmin) {
      return createErrorResponse("Erro de configuração do servidor", 500)
    }

    // Verificar se já existe um mapeamento com este nome
    const { data: existingMapping } = await supabaseAdmin
      .from('mappings')
      .select('id')
      .eq('user_id', session.user.id)
      .ilike('name', name) // Case insensitive
      .single()

    if (existingMapping) {
      return createErrorResponse("Já existe um mapeamento com este nome", 400)
    }

    // Verificar se é o primeiro mapeamento (será o padrão)
    const { count: mappingCount } = await supabaseAdmin
      .from('mappings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    // Criar novo mapeamento
    const { data: mapping, error: createError } = await (supabaseAdmin as any)
      .from('mappings')
      .insert({
        name,
        description: description || null,
        mapping_data: mappingData,
        user_id: session.user.id,
        is_default: (mappingCount || 0) === 0 // Primeiro mapeamento é padrão
      })
      .select()
      .single()

    if (createError || !mapping) {
      throw new Error(`Erro ao criar mapeamento: ${createError?.message}`)
    }

    // Converter para formato esperado pelo frontend
    const formattedMapping = {
      id: mapping.id,
      name: mapping.name,
      description: mapping.description,
      mappingData: mapping.mapping_data,
      isDefault: mapping.is_default,
      createdAt: mapping.created_at,
      updatedAt: mapping.updated_at
    }

    return createSuccessResponse(formattedMapping)
  } catch (error) {
    console.error("Erro ao criar mapeamento:", error)
    return createErrorResponse("Erro interno do servidor", 500)
  }
}
