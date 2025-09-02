import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
}

// Criar cliente para uso no front-end com chave pública
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface FormMapping {
  id?: string
  user_id: string
  original_form: string
  mapped_category: string
  confidence_score?: number
  suggestion_reason?: string
  mapping_source?: 'manual' | 'suggestion' | 'auto'
  created_at?: string
  updated_at?: string
}

export class FormMappingsService {
  // Buscar todos os mapeamentos do usuário
  static async getUserMappings(userId: string): Promise<Record<string, string>> {
    try {
      // Validar se userId foi fornecido
      if (!userId || userId.trim() === '') {
        console.error('getUserMappings: userId é obrigatório')
        return {}
      }

      // Verificar se as variáveis de ambiente estão configuradas
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('getUserMappings: Variáveis de ambiente do Supabase não configuradas')
        return {}
      }

      const { data, error } = await supabase
        .from('form_mappings')
        .select('original_form, mapped_category')
        .eq('user_id', userId)

      if (error) {
        console.error('Erro ao buscar mapeamentos do usuário:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId: userId
        })
        
        // Retornar erro específico baseado no tipo
        if (error.code === 'PGRST116') {
          console.error('Tabela form_mappings não encontrada no banco de dados')
        } else if (error.code === '42501') {
          console.error('Permissões insuficientes para acessar form_mappings')
        }
        
        return {}
      }

      // Verificar se data existe e é um array
      if (!data || !Array.isArray(data)) {
        console.warn('getUserMappings: Nenhum dado retornado do Supabase')
        return {}
      }

      // Converter para formato de dicionário
      const mappings: Record<string, string> = {}
      data.forEach(row => {
        if (row && row.original_form && row.mapped_category) {
          mappings[row.original_form] = row.mapped_category
        }
      })

      console.log(`getUserMappings: Encontrados ${Object.keys(mappings).length} mapeamentos para usuário ${userId}`)
      return mappings
      
    } catch (error) {
      console.error('Erro inesperado ao buscar mapeamentos do usuário:', error)
      return {}
    }
  }

  // Salvar mapeamento único
  static async saveMapping(mapping: FormMapping): Promise<boolean> {
    try {
      // Validações básicas
      if (!mapping.user_id || !mapping.original_form || !mapping.mapped_category) {
        console.error('saveMapping: Campos obrigatórios não fornecidos', {
          user_id: !!mapping.user_id,
          original_form: !!mapping.original_form,
          mapped_category: !!mapping.mapped_category
        })
        return false
      }

      // Verificar configuração do Supabase
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('saveMapping: Variáveis de ambiente do Supabase não configuradas')
        return false
      }

      const { error } = await supabase
        .from('form_mappings')
        .upsert({
          user_id: mapping.user_id,
          original_form: mapping.original_form,
          mapped_category: mapping.mapped_category,
          confidence_score: mapping.confidence_score || 0,
          suggestion_reason: mapping.suggestion_reason,
          mapping_source: mapping.mapping_source || 'manual'
        }, {
          onConflict: 'user_id,original_form'
        })

      if (error) {
        console.error('Erro ao salvar mapeamento:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          mapping: {
            user_id: mapping.user_id,
            original_form: mapping.original_form,
            mapped_category: mapping.mapped_category
          }
        })
        return false
      }

      console.log(`saveMapping: Mapeamento salvo com sucesso para usuário ${mapping.user_id}`)
      return true
    } catch (error) {
      console.error('Erro inesperado ao salvar mapeamento:', error)
      return false
    }
  }

  // Salvar múltiplos mapeamentos em lote
  static async saveMappings(form_mappings: FormMapping[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('form_mappings')
        .upsert(
          form_mappings.map(mapping => ({
            user_id: mapping.user_id,
            original_form: mapping.original_form,
            mapped_category: mapping.mapped_category,
            confidence_score: mapping.confidence_score || 0,
            suggestion_reason: mapping.suggestion_reason,
            mapping_source: mapping.mapping_source || 'manual'
          })),
          {
            onConflict: 'user_id,original_form'
          }
        )

      if (error) {
        console.error('Erro ao salvar mapeamentos em lote:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao salvar mapeamentos em lote:', error)
      return false
    }
  }

  // Remover mapeamento específico
  static async removeMapping(userId: string, originalForm: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('form_mappings')
        .delete()
        .eq('user_id', userId)
        .eq('original_form', originalForm)

      if (error) {
        console.error('Erro ao remover mapeamento:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao remover mapeamento:', error)
      return false
    }
  }

  // Buscar estatísticas de mapeamentos do usuário
  static async getMappingStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('form_mappings')
        .select('mapped_category, mapping_source, confidence_score')
        .eq('user_id', userId)

      if (error) {
        console.error('Erro ao buscar estatísticas:', error)
        return null
      }

      const stats = {
        total: data.length,
        byCategory: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        avgConfidence: 0
      }

      let totalConfidence = 0
      
      data.forEach(row => {
        // Contar por categoria
        stats.byCategory[row.mapped_category] = (stats.byCategory[row.mapped_category] || 0) + 1
        
        // Contar por fonte
        stats.bySource[row.mapping_source] = (stats.bySource[row.mapping_source] || 0) + 1
        
        // Somar confiança
        totalConfidence += row.confidence_score || 0
      })

      // Calcular média de confiança
      stats.avgConfidence = data.length > 0 ? totalConfidence / data.length : 0

      return stats
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error)
      return null
    }
  }

  // Buscar mapeamentos recentes do usuário
  static async getRecentMappings(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('form_mappings')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar mapeamentos recentes:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar mapeamentos recentes:', error)
      return []
    }
  }

  // Exportar mapeamentos para backup
  static async exportUserMappings(userId: string): Promise<FormMapping[]> {
    try {
      const { data, error } = await supabase
        .from('form_mappings')
        .select('*')
        .eq('user_id', userId)
        .order('original_form')

      if (error) {
        console.error('Erro ao exportar mapeamentos:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Erro ao exportar mapeamentos:', error)
      return []
    }
  }
}