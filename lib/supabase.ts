import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente público (usado no frontend)
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-my-custom-header': 'FarmaGenius'
      }
    }
  }
)

// Cliente administrativo (usado no backend com mais permissões)
export const supabaseAdmin: SupabaseClient<Database> | null = supabaseServiceRoleKey
  ? createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )
  : null

// Função para verificar conectividade
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('count').limit(1)
    return !error
  } catch (error) {
    console.error('Erro ao testar conexão com Supabase:', error)
    return false
  }
}

// Função para obter informações da conexão
export function getConnectionInfo() {
  return {
    url: supabaseUrl,
    hasServiceRole: !!supabaseServiceRoleKey,
    projectId: supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || 'unknown'
  }
}

// Exportar cliente padrão para compatibilidade
export default supabase