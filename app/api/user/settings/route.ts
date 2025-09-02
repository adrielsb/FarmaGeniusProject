
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

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

    // Buscar ou criar configurações do usuário
    const { data: userSettings, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Erro ao buscar configurações: ${error.message}`)
    }

    if (!userSettings) {
      // Criar configurações padrão
      const defaultSettings = {
        notifications: {
          emailProcessingComplete: true,
          emailWeeklyReport: false,
          pushNotifications: true
        },
        processing: {
          autoBackup: true,
          dataRetentionDays: 90,
          defaultExportFormat: "xlsx"
        },
        display: {
          darkMode: true,
          showAdvancedOptions: false,
          itemsPerPage: 10
        }
      }

      const { data: newSettings, error: createError } = await (supabaseAdmin as any)
        .from('user_settings')
        .insert({
          user_id: session.user.id,
          settings: defaultSettings
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Erro ao criar configurações: ${createError.message}`)
      }

      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json((userSettings as any).settings)
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const { section, settings } = await request.json()

    // Buscar configurações atuais
    const { data: userSettings } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    const currentSettings: any = (userSettings as any)?.settings || {
      notifications: {},
      processing: {},
      display: {}
    }

    // Atualizar seção específica
    const updatedSettings = {
      ...currentSettings,
      [section]: settings
    }

    // Salvar configurações
    if (userSettings) {
      const { error: updateError } = await (supabaseAdmin as any)
        .from('user_settings')
        .update({ 
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)

      if (updateError) {
        throw new Error(`Erro ao atualizar configurações: ${updateError.message}`)
      }
    } else {
      const { error: createError } = await (supabaseAdmin as any)
        .from('user_settings')
        .insert({
          user_id: session.user.id,
          settings: updatedSettings
        })

      if (createError) {
        throw new Error(`Erro ao criar configurações: ${createError.message}`)
      }
    }

    return NextResponse.json({ message: "Configurações salvas com sucesso" })
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
