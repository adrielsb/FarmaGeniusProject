import { NextRequest, NextResponse } from 'next/server'
import { SecurityService } from '@/lib/security'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Adicionar headers de segurança
  SecurityService.addSecurityHeaders(response)
  
  // Verificar atividade suspeita
  const suspiciousCheck = SecurityService.detectSuspiciousActivity(request)
  if (suspiciousCheck.suspicious) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    console.warn(`Atividade suspeita detectada de ${clientIP}:`, suspiciousCheck.reasons)
    // Em produção, poderia bloquear ou alertar administradores
  }
  
  // Rate limiting geral mais permissivo em desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development'
  const generalLimit = isDevelopment ? 500 : 100 // 500 em dev, 100 em prod
  
  if (!SecurityService.checkRateLimit(request, generalLimit, 60000)) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
      { status: 429 }
    )
  }
  
  // Rate limiting específico para rotas de login (mais permissivo em dev)
  if (request.nextUrl.pathname.includes('/api/auth') && request.method === 'POST') {
    if (!SecurityService.checkLoginRateLimit(request)) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em 5 minutos.' },
        { status: 429 }
      )
    }
  }
  
  // Rate limiting para APIs sensíveis (mais permissivo em dev)
  const sensitiveRoutes = [
    '/api/process-report',
    '/api/export-report', 
    '/api/user',
    '/api/analytics'  // Adicionado analytics que estava causando limite
  ]
  
  if (sensitiveRoutes.some(route => request.nextUrl.pathname.includes(route))) {
    const sensitiveLimit = isDevelopment ? 100 : 20 // 100 em dev, 20 em prod
    if (!SecurityService.checkRateLimit(request, sensitiveLimit, 60000)) {
      return NextResponse.json(
        { error: 'Limite de requisições excedido para esta funcionalidade.' },
        { status: 429 }
      )
    }
  }
  
  return response
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}