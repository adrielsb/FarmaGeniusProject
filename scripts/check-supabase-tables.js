const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey)
  process.exit(1)
}

// Usar service role key para ter acesso completo
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkTables() {
  console.log('🔍 Verificando tabelas do Supabase...\n')
  
  try {
    // Tentar conectar diretamente às tabelas conhecidas
    console.log('📋 Verificando tabelas conhecidas:')
    
    const knownTables = ['form_mappings', 'mappings', 'reports', 'processed_reports', 'production_data', 'medication_alerts']
    const existingTables = []
    
    for (const tableName of knownTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`  ✅ ${tableName} (${count || 0} registros)`)
          existingTables.push(tableName)
        } else {
          console.log(`  ❌ ${tableName} - ${error.message}`)
        }
      } catch (err) {
        console.log(`  ❌ ${tableName} - Erro: ${err.message}`)
      }
    }

    // Verificar se form_mappings existe
    const formMappingsExists = existingTables.includes('form_mappings')
    console.log(`\n🔍 Tabela form_mappings: ${formMappingsExists ? '✅ Existe' : '❌ Não encontrada'}`)

    if (formMappingsExists) {
      // Testar inserção de um registro de teste
      console.log('\n🧪 Testando inserção na tabela mappings...')
      const testMapping = {
        user_id: 'test-user-123',
        original_form: 'TESTE FORM',
        mapped_category: 'CATEGORIA TESTE'
      }

      const { data: insertData, error: insertError } = await supabase
        .from('mappings')
        .insert(testMapping)
        .select()

      if (insertError) {
        console.error('❌ Erro no teste de inserção:', insertError)
      } else {
        console.log('✅ Teste de inserção bem-sucedido:', insertData)
        
        // Limpar o registro de teste
        const { error: deleteError } = await supabase
          .from('mappings')
          .delete()
          .eq('user_id', 'test-user-123')
          .eq('original_form', 'TESTE FORM')

        if (deleteError) {
          console.warn('⚠️ Não foi possível limpar o registro de teste:', deleteError)
        } else {
          console.log('🧹 Registro de teste removido')
        }
      }
    } else {
      console.log('\n⚠️ A tabela form_mappings não existe. Será necessário criá-la!')
      console.log('\n📝 Script SQL para criar a tabela:')
      console.log(`
CREATE TABLE form_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  original_form VARCHAR NOT NULL,
  mapped_category VARCHAR NOT NULL,
  confidence_score INTEGER DEFAULT 0,
  suggestion_reason TEXT,
  mapping_source VARCHAR DEFAULT 'manual' CHECK (mapping_source IN ('manual', 'suggestion', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, original_form)
);

-- Create RLS policies
ALTER TABLE form_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mappings" ON form_mappings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own mappings" ON form_mappings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own mappings" ON form_mappings
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own mappings" ON form_mappings
  FOR DELETE USING (true);
      `)
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkTables()