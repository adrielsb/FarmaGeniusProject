
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

interface UserActivity {
  action: string
  details: string
  createdAt: string
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

    // Buscar atividades do usuário baseadas nos relatórios
    const { data: recentReports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('title, status, created_at, date')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (reportsError) {
      throw new Error(`Erro ao buscar relatórios: ${reportsError.message}`)
    }

    // Converter reports em atividades
    const activities: UserActivity[] = (recentReports || []).map(report => ({
      action: getActionByStatus((report as any).status),
      details: `Relatório "${(report as any).title}" (${(report as any).date})`,
      createdAt: (report as any).created_at
    }))

    // Adicionar algumas atividades de exemplo se não houver dados
    if (activities.length === 0) {
      activities.push(
        {
          action: "Login",
          details: "Primeiro acesso ao sistema",
          createdAt: new Date().toISOString()
        },
        {
          action: "Configuração",
          details: "Perfil de usuário criado",
          createdAt: new Date(Date.now() - 60000).toISOString()
        }
      )
    }

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Erro ao buscar atividade do usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

function getActionByStatus(status: string): string {
  switch (status) {
    case 'completed':
      return 'Processamento'
    case 'processing':
      return 'Upload'
    case 'error':
      return 'Erro'
    default:
      return 'Atividade'
  }
}
