#!/usr/bin/env npx tsx

/**
 * Script para testar o login como o frontend faria
 */

import 'dotenv/config'

async function testLogin() {
  console.log('🔐 Testando processo de login...\n')
  
  const baseUrl = 'http://localhost:3000'
  const credentials = {
    email: 'debug@test.com',
    password: 'debug123'
  }

  try {
    // 1. Obter CSRF token
    console.log('1️⃣ Obtendo CSRF token...')
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`)
    const csrfData = await csrfResponse.json()
    console.log('   CSRF token:', csrfData.csrfToken.substring(0, 20) + '...')

    // 2. Tentar fazer login
    console.log('\n2️⃣ Tentando fazer login...')
    const formData = new URLSearchParams()
    formData.append('email', credentials.email)
    formData.append('password', credentials.password)
    formData.append('csrfToken', csrfData.csrfToken)
    formData.append('callbackUrl', '/dashboard')
    formData.append('json', 'true')

    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    console.log('   Status:', loginResponse.status)
    console.log('   Status text:', loginResponse.statusText)

    const loginResult = await loginResponse.text()
    console.log('   Response:', loginResult)

    // 3. Se deu redirect, seguir o redirect
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('location')
      console.log('   Redirect para:', location)
    }

    // 4. Testar acesso direto ao authorize para ver os logs
    console.log('\n3️⃣ Testando função authorize diretamente...')
    const { compare } = await import('bcryptjs')
    const { supabaseAdmin } = await import('../lib/supabase')

    if (!supabaseAdmin) {
      console.log('❌ Supabase admin não disponível')
      return
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password')
      .eq('email', credentials.email)
      .single()

    if (error || !user) {
      console.log('❌ Usuário não encontrado:', error)
      return
    }

    console.log('✅ Usuário encontrado:', { id: user.id, email: user.email })

    const isValid = await compare(credentials.password, user.password)
    console.log('🔐 Senha válida:', isValid ? '✅' : '❌')

  } catch (error) {
    console.error('❌ Erro durante teste:', error)
  }

  console.log('\n✨ Teste concluído!')
}

// Executar o script
if (require.main === module) {
  testLogin().catch(console.error)
}