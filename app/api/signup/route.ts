
import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Configuração do servidor indisponível" }, { status: 500 })
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Usuário já existe" }, { status: 400 })
    }

    const hashedPassword = await hash(password, 12)

    // Criar novo usuário
    const { data: user, error } = await (supabaseAdmin as any)
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
      })
      .select('id, name, email')
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
