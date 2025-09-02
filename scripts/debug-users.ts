#!/usr/bin/env npx tsx

import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'
import { compare } from 'bcryptjs'

async function debugUsers() {
  console.log('🔍 Debug de Usuários e Autenticação\n')

  if (!supabaseAdmin) {
    console.log('❌ Supabase admin client não disponível')
    return
  }

  // Buscar todos os usuários
  console.log('📊 Usuários no banco de dados:')
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, password, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Erro ao buscar usuários:', error)
    return
  }

  if (!users || users.length === 0) {
    console.log('   Nenhum usuário encontrado')
    return
  }

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Password hash: ${user.password ? user.password.substring(0, 30) + '...' : 'SEM SENHA'}`)
    console.log(`   Criado: ${user.created_at}`)
    console.log('')
  })

  // Testar hash da senha para usuários específicos
  console.log('🔐 Testando validação de senhas:')
  
  for (const user of users) {
    if (user.email === 'final@exemplo.com') {
      console.log(`\nTestando senha para ${user.email}:`)
      if (!user.password) {
        console.log('   ❌ Usuário não tem senha definida')
        continue
      }

      try {
        const isValid = await compare('senha456', user.password)
        console.log(`   Senha 'senha456': ${isValid ? '✅ Válida' : '❌ Inválida'}`)
        
        // Testar senha simples
        const isValidSimple = await compare('123456', user.password)
        console.log(`   Senha '123456': ${isValidSimple ? '✅ Válida' : '❌ Inválida'}`)
      } catch (error) {
        console.log(`   ❌ Erro ao comparar senha: ${error}`)
      }
    }

    if (user.email === 'novo@exemplo.com') {
      console.log(`\nTestando senha para ${user.email}:`)
      if (!user.password) {
        console.log('   ❌ Usuário não tem senha definida')
        continue
      }

      try {
        const isValid = await compare('senha123', user.password)
        console.log(`   Senha 'senha123': ${isValid ? '✅ Válida' : '❌ Inválida'}`)
      } catch (error) {
        console.log(`   ❌ Erro ao comparar senha: ${error}`)
      }
    }
  }

  console.log('\n✨ Debug concluído!')
}

// Executar o script
if (require.main === module) {
  debugUsers().catch(console.error)
}