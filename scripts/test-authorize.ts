#!/usr/bin/env npx tsx

import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'
import { compare } from 'bcryptjs'

async function testAuthorizeFunction() {
  console.log('🔐 Testando função authorize diretamente...\n')

  const credentials = {
    email: 'debug@test.com',
    password: 'debug123'
  }

  console.log('Testando com credenciais:', { email: credentials.email, hasPassword: !!credentials.password })

  // Implementar a mesma lógica da função authorize
  if (!credentials?.email || !credentials?.password) {
    console.log('❌ Missing credentials')
    return
  }

  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available')
    return
  }

  try {
    console.log('🔍 Searching for user:', credentials.email)
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password')
      .eq('email', credentials.email)
      .single()

    console.log('Query result:', { user: user ? 'found' : 'not found', error })

    if (error) {
      console.log('❌ Supabase error:', error)
      return
    }

    if (!user) {
      console.log('❌ User not found')
      return
    }

    if (!user.password) {
      console.log('❌ User has no password set')
      return
    }

    console.log('✅ User found:', { id: user.id, email: user.email, name: user.name })
    console.log('🔐 Testing password...')

    const isPasswordValid = await compare(credentials.password, user.password)
    console.log('Password comparison result:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return
    }

    console.log('✅ Password valid, authentication successful')

    const result = {
      id: user.id,
      email: user.email,
      name: user.name,
    }

    console.log('🎯 Function would return:', result)

  } catch (error) {
    console.error('❌ Auth error:', error)
  }

  console.log('\n✨ Teste concluído!')
}

if (require.main === module) {
  testAuthorizeFunction().catch(console.error)
}