const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Configuração do Supabase
const supabaseUrl = 'https://yhtnlxnntpipnshtivqx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodG5seG5udHBpcG5zaHRpdnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzQxNDksImV4cCI6MjA3MTkxMDE0OX0.MdE9PWSWFFLMcudTw40lehT2HXiG-S6S4gfWfod0mVM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateToSupabase() {
  try {
    console.log('🚀 Iniciando migração para Supabase...')
    
    // Ler dados do backup
    const backupData = JSON.parse(fs.readFileSync('/home/adrielsb/FarmaGenius/export-backup.json', 'utf8'))
    
    console.log('📊 Dados a migrar:')
    console.log(`👤 Usuários: ${backupData.users.length}`)
    console.log(`📋 Relatórios: ${backupData.reports.length}`)
    console.log(`📝 Itens de relatório: ${backupData.reportItems.length}`)
    console.log(`🗺️ Mapeamentos: ${backupData.mappings.length}`)
    
    // Migrar usuários
    if (backupData.users.length > 0) {
      console.log('\\n👤 Migrando usuários...')
      for (const user of backupData.users) {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            email_verified: user.emailVerified,
            image: user.image,
            created_at: user.createdAt,
            updated_at: user.updatedAt
          })
        
        if (error) {
          console.error(`❌ Erro ao migrar usuário ${user.email}:`, error.message)
        } else {
          console.log(`✅ Usuário ${user.email} migrado`)
        }
      }
    }
    
    // Migrar relatórios
    if (backupData.reports.length > 0) {
      console.log('\\n📋 Migrando relatórios...')
      for (const report of backupData.reports) {
        const { error } = await supabase
          .from('reports')
          .upsert({
            id: report.id,
            title: report.title,
            date: report.date,
            status: report.status,
            user_id: report.userId,
            created_at: report.createdAt,
            updated_at: report.updatedAt,
            diario_file_name: report.diarioFileName,
            controle_file_name: report.controleFileName,
            total_quantity: report.totalQuantity,
            total_value: report.totalValue,
            solid_count: report.solidCount,
            top_seller: report.topSeller,
            processed_data: report.processedData,
            kanban_data: report.kanbanData,
            sellers_data: report.sellersData
          })
        
        if (error) {
          console.error(`❌ Erro ao migrar relatório ${report.title}:`, error.message)
        } else {
          console.log(`✅ Relatório ${report.title} migrado`)
        }
      }
    }
    
    // Migrar itens de relatório
    if (backupData.reportItems.length > 0) {
      console.log('\\n📝 Migrando itens de relatório...')
      
      // Migrar em lotes de 100 para evitar timeout
      const batchSize = 100
      for (let i = 0; i < backupData.reportItems.length; i += batchSize) {
        const batch = backupData.reportItems.slice(i, i + batchSize)
        
        const formattedBatch = batch.map(item => ({
          id: item.id,
          report_id: item.reportId,
          form_norm: item.formNorm,
          linha: item.linha,
          horario: item.horario,
          vendedor: item.vendedor,
          quantidade: item.quantidade,
          valor: item.valor,
          categoria: item.categoria,
          observacoes: item.observacoes,
          source_file: item.sourceFile,
          row_index: item.rowIndex,
          is_mapped: item.isMapped,
          created_at: item.createdAt || new Date().toISOString(),
          updated_at: item.updatedAt || new Date().toISOString()
        }))
        
        const { error } = await supabase
          .from('report_items')
          .upsert(formattedBatch)
        
        if (error) {
          console.error(`❌ Erro ao migrar lote ${Math.floor(i/batchSize) + 1}:`, error.message)
        } else {
          console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} migrado (${batch.length} itens)`)
        }
      }
    }
    
    // Migrar mapeamentos
    if (backupData.mappings.length > 0) {
      console.log('\\n🗺️ Migrando mapeamentos...')
      for (const mapping of backupData.mappings) {
        const { error } = await supabase
          .from('mappings')
          .upsert({
            id: mapping.id,
            user_id: mapping.userId,
            name: mapping.name,
            description: mapping.description,
            mapping_data: mapping.mappingData,
            is_default: mapping.isDefault,
            created_at: mapping.createdAt,
            updated_at: mapping.updatedAt
          })
        
        if (error) {
          console.error(`❌ Erro ao migrar mapeamento ${mapping.name}:`, error.message)
        } else {
          console.log(`✅ Mapeamento ${mapping.name} migrado`)
        }
      }
    }
    
    // Migrar último processamento
    if (backupData.lastProcessing.length > 0) {
      console.log('\\n⚙️ Migrando último processamento...')
      for (const processing of backupData.lastProcessing) {
        const { error } = await supabase
          .from('last_processing')
          .upsert({
            id: processing.id,
            report_date: processing.reportDate,
            report_id: processing.reportId,
            processed_at: processing.processedAt,
            total_quantity: processing.totalQuantity,
            total_value: processing.totalValue,
            solid_count: processing.solidCount,
            top_seller: processing.topSeller,
            diario_file_name: processing.diarioFileName,
            controle_file_name: processing.controleFileName,
            created_at: processing.createdAt,
            updated_at: processing.updatedAt
          })
        
        if (error) {
          console.error(`❌ Erro ao migrar processamento ${processing.reportDate}:`, error.message)
        } else {
          console.log(`✅ Processamento ${processing.reportDate} migrado`)
        }
      }
    }
    
    // Migrar histórico
    if (backupData.history.length > 0) {
      console.log('\\n📈 Migrando histórico...')
      for (const historyItem of backupData.history) {
        const { error } = await supabase
          .from('processing_history')
          .upsert({
            id: historyItem.id,
            report_id: historyItem.reportId,
            action: historyItem.action,
            details: historyItem.details,
            status: historyItem.status,
            duration: historyItem.duration,
            error_message: historyItem.errorMessage,
            created_at: historyItem.createdAt
          })
        
        if (error) {
          console.error(`❌ Erro ao migrar histórico:`, error.message)
        } else {
          console.log(`✅ Histórico migrado`)
        }
      }
    }
    
    console.log('\\n🎉 Migração concluída com sucesso!')
    console.log('\\n📊 Verificando dados no Supabase...')
    
    // Verificar migração
    const { data: users } = await supabase.from('users').select('count')
    const { data: reports } = await supabase.from('reports').select('count')
    const { data: reportItems } = await supabase.from('report_items').select('count')
    
    console.log(`👤 Usuários no Supabase: ${users?.[0]?.count || 0}`)
    console.log(`📋 Relatórios no Supabase: ${reports?.[0]?.count || 0}`)
    console.log(`📝 Itens no Supabase: ${reportItems?.[0]?.count || 0}`)
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
  }
}

migrateToSupabase()