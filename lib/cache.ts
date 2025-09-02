import { Redis } from '@upstash/redis'

// Para desenvolvimento local, vamos usar uma implementação em memória
// Em produção, configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>()

  async get(key: string): Promise<any> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  async set(key: string, value: any, ttl = 300): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async flushall(): Promise<void> {
    this.cache.clear()
  }
}

// Configuração do Redis
const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : new MemoryCache()

export class CacheService {
  private static readonly DEFAULT_TTL = 300 // 5 minutos

  // Cache para analytics
  static async getAnalytics(userId: string, period: string = '30'): Promise<any> {
    const key = `analytics:${userId}:${period}`
    try {
      const cached = await redis.get(key)
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async setAnalytics(userId: string, period: string, data: any, ttl = this.DEFAULT_TTL): Promise<void> {
    const key = `analytics:${userId}:${period}`
    try {
      await redis.set(key, JSON.stringify(data))
      // Para desenvolvimento, definir TTL manualmente se necessário
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Cache para relatórios
  static async getReport(reportId: string): Promise<any> {
    const key = `report:${reportId}`
    try {
      const cached = await redis.get(key)
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async setReport(reportId: string, data: any, ttl = 600): Promise<void> {
    const key = `report:${reportId}`
    try {
      await redis.set(key, JSON.stringify(data))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Cache para histórico
  static async getHistory(userId: string): Promise<any> {
    const key = `history:${userId}`
    try {
      const cached = await redis.get(key)
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async setHistory(userId: string, data: any, ttl = 180): Promise<void> {
    const key = `history:${userId}`
    try {
      await redis.set(key, JSON.stringify(data))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Cache para métricas de produção
  static async getProductionMetrics(userId: string): Promise<any> {
    const key = `production_metrics:${userId}`
    try {
      const cached = await redis.get(key)
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async setProductionMetrics(userId: string, data: any, ttl = 300): Promise<void> {
    const key = `production_metrics:${userId}`
    try {
      await redis.set(key, JSON.stringify(data))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  // Invalidar cache específico
  static async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `analytics:${userId}:*`,
      `history:${userId}`,
      `production_metrics:${userId}`
    ]

    try {
      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          // Para desenvolvimento, invalidar manualmente
          const keys = ['7', '30', '90', '365']
          for (const key of keys) {
            await redis.del(`analytics:${userId}:${key}`)
          }
        } else {
          await redis.del(pattern)
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  // Limpar todo o cache
  static async clearAll(): Promise<void> {
    try {
      await redis.flushall()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }
}