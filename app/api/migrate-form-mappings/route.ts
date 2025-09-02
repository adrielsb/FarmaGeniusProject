import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Variáveis de ambiente do Supabase não configuradas' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // SQL para criar a tabela form_mappings
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS form_mappings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id TEXT NOT NULL,
        original_form TEXT NOT NULL,
        mapped_category TEXT NOT NULL,
        confidence_score DECIMAL(3,2) DEFAULT 0,
        suggestion_reason TEXT,
        mapping_source TEXT DEFAULT 'manual',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(user_id, original_form)
      )
    `

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_form_mappings_user_id ON form_mappings(user_id);
      CREATE INDEX IF NOT EXISTS idx_form_mappings_original_form ON form_mappings(original_form);
      CREATE INDEX IF NOT EXISTS idx_form_mappings_mapped_category ON form_mappings(mapped_category);
    `

    const enableRLSSQL = `
      ALTER TABLE form_mappings ENABLE ROW LEVEL SECURITY;
    `

    const createPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Users can manage own form mappings" 
      ON form_mappings FOR ALL USING (auth.uid()::text = user_id);
    `

    // Executar as queries
    const results = []

    // 1. Criar tabela
    const { error: createError } = await supabase.rpc('exec', { 
      sql: createTableSQL 
    })

    if (createError) {
      console.log('Erro ao criar tabela, verificando se já existe...')
      const { data: existingTable, error: checkError } = await supabase
        .from('form_mappings')
        .select('id')
        .limit(1)

      if (!checkError) {
        results.push({ step: 'create_table', status: 'success', message: 'Tabela já existe' })
      } else {
        results.push({ step: 'create_table', status: 'error', message: 'Erro ao criar ou verificar a tabela' })
      }
    } else {
        results.push({ step: 'create_table', status: 'success', message: 'Tabela criada com sucesso' })
    }

    return NextResponse.json({
      success: true,
      message: 'Verificação da tabela form_mappings concluída',
      results
    })

  } catch (error) {
    console.error('Erro na migração:', error)
    return NextResponse.json(
      { error: 'Erro interno na migração', details: error },
      { status: 500 }
    )
  }
}