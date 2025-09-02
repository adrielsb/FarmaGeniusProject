// ARQUIVO OBSOLETO - USADO PARA MIGRAÇÃO DO PRISMA PARA SUPABASE
// Este arquivo foi usado para exportar dados do banco SQLite (Prisma) para o Supabase
// Pode ser removido após confirmação de que a migração foi bem-sucedida

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function exportData() {
  try {
    console.log('🔍 Verificando dados no SQLite...')
    
    // Verificar usuários
    const users = await prisma.user.findMany()
    console.log(`👤 Usuários: ${users.length}`)
    
    // Verificar relatórios
    const reports = await prisma.report.findMany()
    console.log(`📊 Relatórios: ${reports.length}`)
    
    // Verificar report items
    const reportItems = await prisma.reportItem.findMany()
    console.log(`📝 Itens de relatório: ${reportItems.length}`)
    
    // Verificar mapeamentos
    const mappings = await prisma.mapping.findMany()
    console.log(`🗺️ Mapeamentos: ${mappings.length}`)
    
    // Verificar observações
    const observations = await prisma.dailyObservation.findMany()
    console.log(`📋 Observações diárias: ${observations.length}`)
    
    // Verificar processamento
    const lastProcessing = await prisma.lastProcessing.findMany()
    console.log(`⚙️ Último processamento: ${lastProcessing.length}`)
    
    // Verificar histórico
    const history = await prisma.processingHistory.findMany()
    console.log(`📈 Histórico: ${history.length}`)
    
    // Verificar configurações
    const settings = await prisma.userSettings.findMany()
    console.log(`⚙️ Configurações: ${settings.length}`)
    
    console.log('\n✅ Dados disponíveis para exportação!')
    
    // Exportar dados em formato JSON
    const exportData = {
      users,
      reports,
      reportItems,
      mappings,
      observations,
      lastProcessing,
      history,
      settings
    }
    
    require('fs').writeFileSync('/home/adrielsb/FarmaGenius/export-backup.json', JSON.stringify(exportData, null, 2))
    console.log('💾 Backup salvo em: export-backup.json')
    
  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()