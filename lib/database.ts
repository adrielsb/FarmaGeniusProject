import { supabase, supabaseAdmin, testSupabaseConnection } from './supabase'
import type { Database } from '../types/supabase'

// Tipos auxiliares
export type TableNames = keyof Database['public']['Tables']
export type SupabaseQueryBuilder = ReturnType<typeof supabase.from>

// Interface para operações CRUD
export interface CrudOperations<T> {
  findById(id: string): Promise<T | null>
  findMany(filters?: Record<string, any>): Promise<T[]>
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null>
  update(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
}

// Classe base para operações de database
export class DatabaseService<T = any> {
  private tableName: TableNames
  private client = supabase

  constructor(tableName: TableNames, useAdmin: boolean = false) {
    this.tableName = tableName
    if (useAdmin && supabaseAdmin) {
      this.client = supabaseAdmin
    }
  }

  // Buscar por ID
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(`Erro ao buscar ${this.tableName} por ID:`, error)
        return null
      }

      return data as T
    } catch (error) {
      console.error(`Erro inesperado ao buscar ${this.tableName}:`, error)
      return null
    }
  }

  // Buscar múltiplos registros
  async findMany(filters: Record<string, any> = {}, options: {
    limit?: number
    offset?: number
    orderBy?: { column: string; ascending?: boolean }
    select?: string
  } = {}): Promise<T[]> {
    try {
      let query = this.client
        .from(this.tableName)
        .select(options.select || '*')

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        })
      }

      // Aplicar paginação
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error(`Erro ao buscar ${this.tableName}:`, error)
        return []
      }

      return (data || []) as T[]
    } catch (error) {
      console.error(`Erro inesperado ao buscar ${this.tableName}:`, error)
      return []
    }
  }

  // Criar novo registro
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        // @ts-ignore
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error(`Erro ao criar ${this.tableName}:`, error)
        return null
      }

      return result as T
    } catch (error) {
      console.error(`Erro inesperado ao criar ${this.tableName}:`, error)
      return null
    }
  }

  // Atualizar registro
  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        // @ts-ignore
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error(`Erro ao atualizar ${this.tableName}:`, error)
        return null
      }

      return result as T
    } catch (error) {
      console.error(`Erro inesperado ao atualizar ${this.tableName}:`, error)
      return null
    }
  }

  // Deletar registro
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error(`Erro ao deletar ${this.tableName}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro inesperado ao deletar ${this.tableName}:`, error)
      return false
    }
  }

  // Contar registros
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { count, error } = await query

      if (error) {
        console.error(`Erro ao contar ${this.tableName}:`, error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error(`Erro inesperado ao contar ${this.tableName}:`, error)
      return 0
    }
  }

  // Executar query customizada
  async customQuery(queryFunction: (client: typeof supabase) => any): Promise<any> {
    try {
      return await queryFunction(this.client)
    } catch (error) {
      console.error(`Erro na query customizada para ${this.tableName}:`, error)
      return null
    }
  }
}

// Services específicos para cada tabela
export const usersService = new DatabaseService<Database['public']['Tables']['users']['Row']>('users')
export const reportsService = new DatabaseService<Database['public']['Tables']['reports']['Row']>('reports')
export const reportItemsService = new DatabaseService<Database['public']['Tables']['report_items']['Row']>('report_items')
export const mappingsService = new DatabaseService<Database['public']['Tables']['mappings']['Row']>('mappings')
export const observationsService = new DatabaseService<Database['public']['Tables']['daily_observations']['Row']>('daily_observations')
export const defaultersService = new DatabaseService<Database['public']['Tables']['defaulters']['Row']>('defaulters')
export const auditLogsService = new DatabaseService<Database['public']['Tables']['audit_logs']['Row']>('audit_logs')
export const inventoryService = new DatabaseService<Database['public']['Tables']['inventory_items']['Row']>('inventory_items')
export const prescriptionsService = new DatabaseService<Database['public']['Tables']['digital_prescriptions']['Row']>('digital_prescriptions')
export const productionMetricsService = new DatabaseService<Database['public']['Tables']['production_metrics']['Row']>('production_metrics')

// Funções utilitárias
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const start = Date.now()
  
  try {
    const isConnected = await testSupabaseConnection()
    const latency = Date.now() - start
    
    return {
      connected: isConnected,
      latency
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função para executar migração do esquema (usar com cuidado)
export async function executeSchemaMigration(sql: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('Service role key necessária para executar migrações')
    return false
  }

  try {
    // @ts-ignore
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Erro ao executar migração:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro inesperado na migração:', error)
    return false
  }
}

// Função para backup de dados
export async function exportTableData(tableName: TableNames): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')

    if (error) {
      console.error(`Erro ao exportar dados da tabela ${tableName}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Erro inesperado ao exportar ${tableName}:`, error)
    return null
  }
}

export default {
  supabase,
  supabaseAdmin,
  DatabaseService,
  usersService,
  reportsService,
  reportItemsService,
  mappingsService,
  observationsService,
  defaultersService,
  auditLogsService,
  inventoryService,
  prescriptionsService,
  productionMetricsService,
  checkDatabaseHealth,
  executeSchemaMigration,
  exportTableData
}