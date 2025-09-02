import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

interface AuditLogData {
  userId: string
  action: string
  tableName?: string
  recordId?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  // Log de ações de usuário
  static async log(data: AuditLogData): Promise<void> {
    try {
      if (!supabaseAdmin) {
        console.error('supabaseAdmin não configurado para audit log')
        return
      }
      
      const { error } = await (supabaseAdmin as any)
        .from('audit_logs')
        .insert({
          user_id: data.userId,
          action: data.action,
          table_name: data.tableName || '',
          record_id: data.recordId,
          old_values: data.oldValues,
          new_values: data.newValues,
          ip_address: data.ipAddress,
          user_agent: data.userAgent
        })

      if (error) {
        console.error('Erro ao salvar log de auditoria:', error)
      }
    } catch (error) {
      console.error('Erro ao salvar log de auditoria:', error)
      // Não falhar a operação principal se o log falhar
    }
  }

  // Log de login
  static async logLogin(userId: string, request?: NextRequest, success: boolean = true): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      ipAddress,
      userAgent
    })
  }

  // Log de logout
  static async logLogout(userId: string, request?: NextRequest): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: 'LOGOUT',
      ipAddress,
      userAgent
    })
  }

  // Log de criação de registro
  static async logCreate(userId: string, tableName: string, recordId: string, newValues: any, request?: NextRequest): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: 'CREATE',
      tableName,
      recordId,
      newValues,
      ipAddress,
      userAgent
    })
  }

  // Log de atualização de registro
  static async logUpdate(userId: string, tableName: string, recordId: string, oldValues: any, newValues: any, request?: NextRequest): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: 'UPDATE',
      tableName,
      recordId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    })
  }

  // Log de exclusão de registro
  static async logDelete(userId: string, tableName: string, recordId: string, oldValues: any, request?: NextRequest): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: 'DELETE',
      tableName,
      recordId,
      oldValues,
      ipAddress,
      userAgent
    })
  }

  // Log de ações sensíveis
  static async logSensitiveAction(userId: string, action: string, details?: any, request?: NextRequest): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: `SENSITIVE_${action.toUpperCase()}`,
      newValues: details,
      ipAddress,
      userAgent
    })
  }

  // Log de upload de arquivo
  static async logFileUpload(userId: string, fileName: string, fileSize: number, request?: NextRequest): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: 'FILE_UPLOAD',
      newValues: { fileName, fileSize },
      ipAddress,
      userAgent
    })
  }

  // Log de export de dados
  static async logDataExport(userId: string, exportType: string, recordCount: number, request?: NextRequest): Promise<void> {
    const ipAddress = request ? this.getClientIP(request) : undefined
    const userAgent = request ? request.headers.get('user-agent') || undefined : undefined

    await this.log({
      userId,
      action: 'DATA_EXPORT',
      newValues: { exportType, recordCount },
      ipAddress,
      userAgent
    })
  }

  // Buscar logs de auditoria
  static async getLogs(userId?: string, limit: number = 100, offset: number = 0) {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin não configurado para buscar logs')
      return []
    }

    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          users!inner(name, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  }

  // Buscar logs por ação
  static async getLogsByAction(action: string, limit: number = 100) {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin não configurado para buscar logs por ação')
      return []
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          users!inner(name, email)
        `)
        .eq('action', action)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar logs por ação:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar logs por ação:', error)
      return []
    }
  }

  // Buscar logs suspeitos
  static async getSuspiciousActivity(limit: number = 50) {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin não configurado para buscar atividade suspeita')
      return []
    }

    try {
      const suspiciousActions = [
        'LOGIN_FAILED',
        'SENSITIVE_PASSWORD_CHANGE',
        'SENSITIVE_USER_DELETE',
        'DATA_EXPORT'
      ]

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          users!inner(name, email)
        `)
        .in('action', suspiciousActions)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar atividade suspeita:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar atividade suspeita:', error)
      return []
    }
  }

  // Estatísticas de auditoria
  static async getAuditStats(userId?: string) {
    if (!supabaseAdmin) {
      console.error('supabaseAdmin não configurado para estatísticas de auditoria')
      return {
        totalLogs: 0,
        loginAttempts: 0,
        failedLogins: 0,
        recentActivity: 0,
        successRate: 0
      }
    }

    try {
      // Usar RPC functions ou queries separadas devido à limitação do Supabase
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const promises = []
      
      // Total logs
      let totalQuery = supabaseAdmin.from('audit_logs').select('*', { count: 'exact', head: true })
      if (userId) totalQuery = totalQuery.eq('user_id', userId)
      promises.push(totalQuery)

      // Login attempts
      let loginQuery = supabaseAdmin.from('audit_logs').select('*', { count: 'exact', head: true })
        .in('action', ['LOGIN_SUCCESS', 'LOGIN_FAILED'])
      if (userId) loginQuery = loginQuery.eq('user_id', userId)
      promises.push(loginQuery)

      // Failed logins
      let failedQuery = supabaseAdmin.from('audit_logs').select('*', { count: 'exact', head: true })
        .eq('action', 'LOGIN_FAILED')
      if (userId) failedQuery = failedQuery.eq('user_id', userId)
      promises.push(failedQuery)

      // Recent activity (últimas 24h)
      let recentQuery = supabaseAdmin.from('audit_logs').select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo)
      if (userId) recentQuery = recentQuery.eq('user_id', userId)
      promises.push(recentQuery)

      const [totalResult, loginResult, failedResult, recentResult] = await Promise.all(promises)

      const totalLogs = totalResult.count || 0
      const loginAttempts = loginResult.count || 0
      const failedLogins = failedResult.count || 0
      const recentActivity = recentResult.count || 0

      return {
        totalLogs,
        loginAttempts,
        failedLogins,
        recentActivity,
        successRate: loginAttempts > 0 ? ((loginAttempts - failedLogins) / loginAttempts) * 100 : 0
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de auditoria:', error)
      return {
        totalLogs: 0,
        loginAttempts: 0,
        failedLogins: 0,
        recentActivity: 0,
        successRate: 0
      }
    }
  }

  // Extrair IP do cliente
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIP || remoteAddr || 'unknown'
  }
}