

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { createErrorResponse, createSuccessResponse, sanitizeString, checkRateLimit } from "@/lib/api-utils"
import { profileSchema } from "@/lib/validations"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return createErrorResponse("Não autorizado", 401)
    }

    const body = await request.json()
    
    // Validar e sanitizar dados
    const validationResult = profileSchema.safeParse({
      name: body.name ? sanitizeString(body.name) : "",
      email: body.email ? body.email.toLowerCase().trim() : ""
    })

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => err.message).join(", ")
      return createErrorResponse(errors, 400)
    }

    const { name, email } = validationResult.data

    if (!supabaseAdmin) {
      return createErrorResponse("Erro de configuração do servidor", 500)
    }

    // Verificar se o email já existe para outro usuário
    if (email && email !== session.user.email?.toLowerCase()) {
      const { data: existingUser, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (!error && existingUser && (existingUser as any).id !== session.user.id) {
        return createErrorResponse("Este email já está em uso", 400)
      }
    }

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await (supabaseAdmin as any)
      .from('users')
      .update({
        name: name || undefined,
        email: email || session.user.email || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select('id, name, email')
      .single()

    if (updateError || !updatedUser) {
      throw new Error(`Erro ao atualizar usuário: ${updateError?.message}`)
    }

    return createSuccessResponse(updatedUser)
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return createErrorResponse("Erro interno do servidor", 500)
  }
}
