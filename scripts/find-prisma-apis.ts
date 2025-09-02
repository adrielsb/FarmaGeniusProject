#!/usr/bin/env npx tsx

/**
 * Script para identificar APIs que ainda usam Prisma
 */

import { promises as fs } from 'fs'
import { join } from 'path'

async function findPrismaUsage() {
  console.log('🔍 Procurando APIs que ainda usam Prisma...\n')

  const apiDir = '/home/adrielsb/FarmaGenius/app/api'
  
  const prismaFiles = [
    '/home/adrielsb/FarmaGenius/app/api/defaulters/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/user/settings/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/user/stats/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/user/password/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/user/activity/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/user/profile/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/mappings/[id]/default/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/mappings/[id]/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/mappings/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/production-metrics/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/history/[id]/route.ts',
    '/home/adrielsb/FarmaGenius/app/api/save-report/route.ts'
  ]

  console.log('📁 APIs que ainda usam Prisma:')
  for (const file of prismaFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const lines = content.split('\n')
      const prismaImport = lines.find(line => line.includes('from "@/lib/prisma"'))
      const prismaUsage = lines.filter(line => line.includes('prisma.'))
      
      if (prismaImport || prismaUsage.length > 0) {
        const relativePath = file.replace('/home/adrielsb/FarmaGenius/app/', '')
        console.log(`\n  📄 ${relativePath}`)
        if (prismaImport) {
          console.log(`     Import: ${prismaImport.trim()}`)
        }
        if (prismaUsage.length > 0) {
          console.log(`     Uso: ${prismaUsage.length} ocorrência(s)`)
          prismaUsage.slice(0, 3).forEach(usage => {
            console.log(`       - ${usage.trim().substring(0, 60)}...`)
          })
        }
      }
    } catch (error) {
      console.log(`  ❌ Erro ao ler ${file}: ${error}`)
    }
  }

  console.log('\n📋 Recomendações:')
  console.log('  1. Migrar APIs conforme forem sendo utilizadas')
  console.log('  2. Priorizar: user/profile, mappings, production-metrics')
  console.log('  3. Substituir prisma import por supabaseAdmin')
  console.log('  4. Adaptar queries para sintaxe Supabase')
  
  console.log('\n✨ Script concluído!')
}

if (require.main === module) {
  findPrismaUsage().catch(console.error)
}