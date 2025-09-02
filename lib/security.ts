import { NextRequest, NextResponse } from 'next/server'

// Rate limiting simples em memória (para desenvolvimento)
// Em produção, usar Redis ou serviço dedicado
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  
  isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const record = this.requests.get(key)
    
    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (record.count >= maxRequests) {
      return false
    }
    
    record.count++
    return true
  }
  
  getRemainingRequests(key: string, maxRequests: number = 10): number {
    const record = this.requests.get(key)
    if (!record || Date.now() > record.resetTime) {
      return maxRequests
    }
    return Math.max(0, maxRequests - record.count)
  }
}

const rateLimiter = new RateLimiter()

export class SecurityService {
  // Rate limiting por IP
  static checkRateLimit(request: NextRequest, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const ip = this.getClientIP(request)
    return rateLimiter.isAllowed(`ip:${ip}`, maxRequests, windowMs)
  }
  
  // Rate limiting por usuário
  static checkUserRateLimit(userId: string, maxRequests: number = 50, windowMs: number = 60000): boolean {
    return rateLimiter.isAllowed(`user:${userId}`, maxRequests, windowMs)
  }
  
  // Rate limiting específico para login
  static checkLoginRateLimit(request: NextRequest): boolean {
    const ip = this.getClientIP(request)
    return rateLimiter.isAllowed(`login:${ip}`, 5, 300000) // 5 tentativas por 5 minutos
  }
  
  // Rate limiting para upload de arquivos
  static checkUploadRateLimit(userId: string): boolean {
    return rateLimiter.isAllowed(`upload:${userId}`, 10, 300000) // 10 uploads por 5 minutos
  }
  
  // Validação de arquivo
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    // Verificar extensão
    const allowedExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Apenas ${allowedExtensions.join(', ')} são aceitos.`
      }
    }
    
    // Verificar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Tamanho máximo permitido: 10MB.'
      }
    }
    
    return { valid: true }
  }
  
  // Sanitizar entrada de texto
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }
  
  // Validar CPF
  static validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, '')
    
    if (cpf.length !== 11 || !/^\d{11}$/.test(cpf)) {
      return false
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false
    }
    
    // Validar dígitos verificadores
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i)
    }
    
    let digit = (sum * 10) % 11
    if (digit === 10) digit = 0
    if (digit !== parseInt(cpf[9])) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i)
    }
    
    digit = (sum * 10) % 11
    if (digit === 10) digit = 0
    if (digit !== parseInt(cpf[10])) return false
    
    return true
  }
  
  // Validar CNPJ
  static validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]+/g, '')
    
    if (cnpj.length !== 14) return false
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false
    
    // Validar primeiro dígito verificador
    let sum = 0
    let multiplier = 5
    
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * multiplier
      multiplier = multiplier === 2 ? 9 : multiplier - 1
    }
    
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (digit !== parseInt(cnpj[12])) return false
    
    // Validar segundo dígito verificador
    sum = 0
    multiplier = 6
    
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * multiplier
      multiplier = multiplier === 2 ? 9 : multiplier - 1
    }
    
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (digit !== parseInt(cnpj[13])) return false
    
    return true
  }
  
  // Validar senha forte
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors = []
    
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Senha deve conter pelo menos um número')
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  // Gerar token seguro
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length)
    if (typeof window !== 'undefined') {
      window.crypto.getRandomValues(array)
    } else {
      // Node.js environment
      const crypto = require('crypto')
      return crypto.randomBytes(length).toString('hex')
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Verificar se IP está na lista de bloqueados
  static isIPBlocked(ip: string): boolean {
    // Lista de IPs bloqueados (em produção, usar banco de dados ou serviço)
    const blockedIPs: string[] = []
    return blockedIPs.includes(ip)
  }
  
  // Detectar atividade suspeita
  static detectSuspiciousActivity(request: NextRequest): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = []
    
    const userAgent = request.headers.get('user-agent') || ''
    const ip = this.getClientIP(request)
    
    // Verificar user agent suspeito
    if (!userAgent || userAgent.length < 10) {
      reasons.push('User agent ausente ou muito curto')
    }
    
    // Verificar bots conhecidos
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i
    ]
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      reasons.push('User agent de bot detectado')
    }
    
    // Verificar IP bloqueado
    if (this.isIPBlocked(ip)) {
      reasons.push('IP está na lista de bloqueados')
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons
    }
  }
  
  // Headers de segurança
  static addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // HSTS apenas em HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    
    return response
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