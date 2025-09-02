export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar observações (todas ou por data)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (date) {
      // Buscar observação específica por data
      const { data: observation, error } = await supabaseAdmin
        .from('daily_observations')
        .select(`
          *,
          users!user_id (
            name,
            email
          )
        `)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar observação: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        data: observation
      })
    } else {
      // Buscar todas as observações
      const { data: observations, error } = await supabaseAdmin
        .from('daily_observations')
        .select(`
          *,
          users!user_id (
            name,
            email
          )
        `)
        .order('date', { ascending: false })

      if (error) {
        throw new Error(`Erro ao buscar observações: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        data: observations || []
      })
    }

  } catch (error) {
    console.error('Erro ao buscar observações:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// POST - Criar ou atualizar observação
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }

    const body = await request.json()
    const { date, observation } = body

    if (!date || !observation) {
      return NextResponse.json({ 
        error: 'Data e observação são obrigatórias' 
      }, { status: 400 })
    }

    // Verificar se já existe uma observação para esta data
    const { data: existingObservation } = await supabaseAdmin
      .from('daily_observations')
      .select('id')
      .eq('date', date)
      .single()

    let savedObservation
    if (existingObservation) {
      // Atualizar observação existente
      const { data, error } = await (supabaseAdmin as any)
        .from('daily_observations')
        .update({
          observation,
          user_id: session.user.id,
          author_name: session.user.name || session.user.email || 'Usuário',
          updated_at: new Date().toISOString()
        })
        .eq('date', date)
        .select(`
          *,
          users!user_id (
            name,
            email
          )
        `)
        .single()

      if (error) {
        throw new Error(`Erro ao atualizar observação: ${error.message}`)
      }
      savedObservation = data
    } else {
      // Criar nova observação
      const { data, error } = await (supabaseAdmin as any)
        .from('daily_observations')
        .insert({
          date,
          observation,
          user_id: session.user.id,
          author_name: session.user.name || session.user.email || 'Usuário'
        })
        .select(`
          *,
          users!user_id (
            name,
            email
          )
        `)
        .single()

      if (error) {
        throw new Error(`Erro ao criar observação: ${error.message}`)
      }
      savedObservation = data
    }

    return NextResponse.json({
      success: true,
      data: savedObservation
    })

  } catch (error) {
    console.error('Erro ao salvar observação:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// DELETE - Remover observação
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Erro de configuração do servidor' 
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ 
        error: 'Data é obrigatória' 
      }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('daily_observations')
      .delete()
      .eq('date', date)

    if (error) {
      throw new Error(`Erro ao deletar observação: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Observação removida com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover observação:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
