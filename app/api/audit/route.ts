import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuditLogger } from '@/lib/audit-logger'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'all'

    let logs: any[] = []
    let stats

    switch (type) {
      case 'suspicious':
        logs = await AuditLogger.getSuspiciousActivity(limit)
        break
      case 'by-action':
        if (!action) {
          return NextResponse.json({ error: 'Ação é obrigatória para este tipo' }, { status: 400 })
        }
        logs = await AuditLogger.getLogsByAction(action, limit)
        break
      case 'stats':
        stats = await AuditLogger.getAuditStats(userId || undefined)
        break
      default:
        logs = await AuditLogger.getLogs(userId || undefined, limit, offset)
    }

    if (type === 'stats') {
      return NextResponse.json({
        success: true,
        stats
      })
    }

    // Adicionar estatísticas gerais quando não for um tipo específico
    if (type === 'all') {
      stats = await AuditLogger.getAuditStats(session.user.id as string)
    }

    return NextResponse.json({
      success: true,
      logs,
      stats,
      pagination: {
        limit,
        offset,
        total: logs?.length || 0
      }
    })

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}