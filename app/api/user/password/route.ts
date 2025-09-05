

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import bcryptjs from "bcryptjs"
import { createErrorResponse, createSuccessResponse, checkRateLimit } from "@/lib/api-utils"
import { passwordSchema } from "@/lib/validations"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return createErrorResponse("Não autorizado", 401)
    }

    const body = await request.json()
    
    // Validar dados com schema robusto
    const validationResult = passwordSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => err.message).join(", ")
      return createErrorResponse(errors, 400)
    }

    const { currentPassword, newPassword } = validationResult.data

    // Verificar se nova senha é diferente da atual
    if (currentPassword === newPassword) {
      return createErrorResponse("A nova senha deve ser diferente da senha atual", 400)
    }

    if (!supabaseAdmin) {
      return createErrorResponse("Erro de configuração do servidor", 500)
    }

    // Buscar usuário com senha atual
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('password')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      throw new Error(`Erro ao buscar usuário: ${userError.message}`)
    }

    if (!user || !(user as any).password) {
      return createErrorResponse("Usuário não encontrado ou sem senha cadastrada", 404)
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, (user as any).password)
    
    if (!isCurrentPasswordValid) {
      return createErrorResponse("Senha atual incorreta", 400)
    }

    // Hash da nova senha com salt mais alto
    const hashedNewPassword = await bcryptjs.hash(newPassword, 14)

    // Atualizar senha
    const { error: updateError } = await (supabaseAdmin as any)
      .from('users')
      .update({
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (updateError) {
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`)
    }

    return createSuccessResponse({ message: "Senha alterada com sucesso" })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return createErrorResponse("Erro interno do servidor", 500)
  }
}
