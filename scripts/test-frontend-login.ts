#!/usr/bin/env npx tsx

import 'dotenv/config'

async function testFrontendFlow() {
  console.log('🔐 Simulando o fluxo de login do frontend...\n')

  const credentials = {
    email: 'debug@test.com',
    password: 'debug123'
  }

  try {
    // 1. Criar um usuário de teste se necessário
    console.log('1️⃣ Verificando usuário de teste...')
    
    const signupResponse = await fetch('http://localhost:3000/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 Test Client'
      },
      body: JSON.stringify({
        name: 'Test User Login',
        email: credentials.email,
        password: credentials.password
      })
    })

    const signupResult = await signupResponse.json()
    if (signupResponse.ok) {
      console.log('   ✅ Usuário criado:', signupResult.message)
    } else {
      console.log('   ℹ️  Usuário já existe:', signupResult.error)
    }

    // 2. Simular o login automático como o frontend faz
    console.log('\n2️⃣ Simulando signIn do NextAuth...')
    
    // Obter CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf', {
      headers: {
        'User-Agent': 'Mozilla/5.0 Test Client'
      }
    })
    const { csrfToken } = await csrfResponse.json()
    console.log('   CSRF Token obtido')

    // Fazer login
    const loginData = new URLSearchParams({
      email: credentials.email,
      password: credentials.password,
      csrfToken,
      callbackUrl: '/dashboard',
      json: 'true'
    })

    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 Test Client'
      },
      body: loginData,
      redirect: 'manual' // Não seguir redirects automaticamente
    })

    console.log('   Status do login:', loginResponse.status, loginResponse.statusText)
    
    if (loginResponse.status === 200) {
      const loginResult = await loginResponse.json()
      console.log('   Resposta do login:', loginResult)

      if (loginResult.error) {
        console.log('   ❌ Erro no login:', loginResult.error)
      } else if (loginResult.url) {
        console.log('   ✅ Login bem-sucedido, redirect para:', loginResult.url)
      }
    } else if (loginResponse.status === 302) {
      const location = loginResponse.headers.get('Location')
      console.log('   ✅ Login bem-sucedido, redirect para:', location)
    }

    // 3. Verificar se a sessão foi criada
    console.log('\n3️⃣ Verificando sessão criada...')
    const cookies = loginResponse.headers.get('set-cookie') || ''
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'User-Agent': 'Mozilla/5.0 Test Client',
        'Cookie': cookies
      }
    })

    const session = await sessionResponse.json()
    console.log('   Sessão:', session)

    if (session.user) {
      console.log('   ✅ Usuário logado:', session.user.email)
    } else {
      console.log('   ❌ Nenhuma sessão encontrada')
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error)
  }

  console.log('\n✨ Teste concluído!')
}

if (require.main === module) {
  testFrontendFlow().catch(console.error)
}