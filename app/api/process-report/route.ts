
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import * as XLSX from "xlsx"
import { MappingCache } from "@/lib/mapping-suggestions"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutos para processamento de relatório

// Constantes baseadas no protótipo original
const BUCKETS = ["7:00 AS 8:00", "10:00 AS 13:00", "14:00", "15:00", "16:00 AS 17:00", "OUTROS"]

const GROUPS = [
  {
    title: 'SOLIDOS',
    items: ['CAPSULAS PRONTAS', 'CAPSULAS', 'CAPSULAS GASTRO', 'SACHES', 'MATERIA PRIMA'],
    hourlyLabel: 'TOTAL POR HORARIO SOLIDOS',
    extras: ['TOTAL SEM SEDEX (15:00)'],
    solids: true
  },
  {
    title: 'DERMATO A',
    items: [
      'GEL TRANSDERMICO, GEL VAGINAL',
      'CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA',
      'BASE SERUM',
      'SHOT',
      'SOLUÇÃO, XAROPE, ESMALTE',
      'SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR',
      'LOÇÃO CAPILAR, LOÇÃO CAPILAR Ñ ALCOOLICA',
      'GEL , GEL ACQUAGEL, GEL ALCOOLICO, GEL CREME, GEL DE AMIGEL, GEL FLUIDO, GEL NATROSOL, GEL SEPIGEL',
      'GEL COMESTIVEL'
    ],
    hourlyLabel: 'TOTAL POR HORARIO DERMATO A.'
  },
  {
    title: 'DERMATO C',
    items: [
      'LIQUID CAPS',
      'CAPSULAS VAGINAIS',
      'GOMAS',
      'PASTILHAS',
      'BOMBOM',
      'FILMES',
      'OVULOS',
      'FILME VAGINAL',
      'HOMEOPATIA, FLORAL E VEICULO'
    ],
    hourlyLabel: 'TOTAL POR HORARIO DERMATO C.'
  }
]

const DEFAULT_MAP: {[key: string]: string} = {
  "CAPSULAS": "CAPSULAS",
  "CAPSULAS GASTRO": "CAPSULAS GASTRO",
  "CAPSULAS PRONTAS": "CAPSULAS PRONTAS",
  "SACHES": "SACHES",
  "MATERIA PRIMA": "MATERIA PRIMA",
  "LOCAO CAPILAR": "LOÇÃO CAPILAR, LOÇÃO CAPILAR Ñ ALCOOLICA",
  "LOCAO CAPILAR N ALCOOLICA": "LOÇÃO CAPILAR, LOÇÃO CAPILAR Ñ ALCOOLICA",
  "HOMEOPATIA": "HOMEOPATIA, FLORAL E VEICULO",
  "FLORAL": "HOMEOPATIA, FLORAL E VEICULO",
  "VEICULO": "HOMEOPATIA, FLORAL E VEICULO",
  "GEL TRANSDERMICO": "GEL TRANSDERMICO, GEL VAGINAL",
  "GEL VAGINAL": "GEL TRANSDERMICO, GEL VAGINAL",
  "CREME": "CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA",
  "BASE SERUM": "BASE SERUM",
  "SHOT": "SHOT",
  "SOLUCAO": "SOLUÇÃO, XAROPE, ESMALTE",
  "XAROPE": "SOLUÇÃO, XAROPE, ESMALTE",
  "ESMALTE": "SOLUÇÃO, XAROPE, ESMALTE",
  "SHAMPOO": "SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR",
  "SABONETE": "SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR",
  "CONDICIONADOR": "SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR",
  "GEL COMESTIVEL": "GEL COMESTIVEL",
  "GEL": "GEL , GEL ACQUAGEL, GEL ALCOOLICO, GEL CREME, GEL DE AMIGEL, GEL FLUIDO, GEL NATROSOL, GEL SEPIGEL",
  "LIQUID CAPS": "LIQUID CAPS",
  "CAPSULAS VAGINAIS": "CAPSULAS VAGINAIS",
  "GOMAS": "GOMAS",
  "PASTILHAS": "PASTILHAS",
  "BOMBOM": "BOMBOM",
  "FILME OROD.": "FILMES",
  "OVULOS": "OVULOS",
  "FILME VAGINAL": "FILME VAGINAL"
}

// Funções utilitárias do protótipo original
const stripAcc = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
const lowNo = (s: string) => stripAcc(String(s || "").toLowerCase())
const normKey = (v: any) => stripAcc(String(v || "").toUpperCase().trim().replace(/\s+/g, ' '))

const parseHour = (h: any): number | null => {
  if (h == null) return null
  if (typeof h === 'number') {
    if (h >= 0 && h < 1) return Math.floor(h * 24)
    return Math.floor(h)
  }
  const s = String(h).trim()
  const m = s.match(/^(\d{1,2})(?::\d{1,2})?/)
  if (m) return parseInt(m[1], 10)
  const n = Number(s.replace(',', '.'))
  if (!Number.isNaN(n)) {
    if (n >= 0 && n < 1) return Math.floor(n * 24)
    return Math.floor(n)
  }
  return null
}

const bucket = (h: any): string => {
  const n = parseHour(h)
  if (n === 8) return BUCKETS[0]
  if (n !== null && n >= 10 && n <= 13) return BUCKETS[1]
  if (n === 14) return BUCKETS[2]
  if (n === 15) return BUCKETS[3]
  if (n === 0 || (n !== null && n >= 16 && n <= 23)) return BUCKETS[4]
  return BUCKETS[5]
}

const detectCol = (obj: any, cands: string[]): string | null => {
  const ks = Object.keys(obj || {}), low = ks.map(k => lowNo(k))
  for (const p of cands) {
    const pp = lowNo(p)
    const i = low.findIndex(k => k.includes(pp))
    if (i >= 0) return ks[i]
  }
  return null
}

const parseMoney = (v: any): number => {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return v
  let s = String(v).trim().replace(/[^0-9.,-]/g, '')
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

const normalizeMapKeys = (obj: any) => {
  const out: {[key: string]: string} = {}
  for (const [k, v] of Object.entries(obj || {})) out[normKey(k)] = v as string
  return out
}

// Função para mover datas de domingo para próximo dia útil (segunda-feira)
const moveWeekendToNextBusinessDay = (dateStr: string): string => {
  const [day, month] = dateStr.split('/').map(Number)
  
  // Assumir ano 2024 para cálculo do dia da semana
  const date = new Date(2024, month - 1, day)
  const dayOfWeek = date.getDay() // 0 = Domingo, 6 = Sábado
  const originalDate = dateStr
  
  // Se for domingo, mover para próximo dia útil (sábado segue normal)
  if (dayOfWeek === 0) { // Domingo
    date.setDate(date.getDate() + 1) // Segunda-feira
  }
  // Sábado mantém a data original
  
  // Retornar no formato DD/MM
  const adjustedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
  
  return adjustedDate
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Verificar se o usuário existe
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (userError || !existingUser) {
      return NextResponse.json({ 
        error: "Usuário não encontrado no banco de dados" 
      }, { status: 401 })
    }

    const formData = await req.formData()
    const diarioFile = formData.get('diario') as File
    const controleFile = formData.get('controle') as File
    const originalDate = formData.get('date') as string
    const date = moveWeekendToNextBusinessDay(originalDate) // Ajustar fim de semana para próximo dia útil
    
    if (originalDate !== date) {
      console.log(`📅 Data ajustada de domingo: ${originalDate} → ${date} (domingo → segunda-feira)`)
    }
    
    const mappingStr = formData.get('mapping') as string || '{}'
    const checkOnly = formData.get('checkOnly') === 'true'

    if (!diarioFile || !controleFile) {
      return NextResponse.json({ error: "Arquivos obrigatórios não fornecidos" }, { status: 400 })
    }

    // Parse mapping data com fallback para o mapa padrão
    let formMap: {[key: string]: string} = {}
    try {
      const userMapping = mappingStr ? JSON.parse(mappingStr) : {}
      formMap = normalizeMapKeys({ ...DEFAULT_MAP, ...userMapping })
    } catch (error) {
      console.log("Invalid mapping JSON, using default mapping")
      formMap = normalizeMapKeys(DEFAULT_MAP)
    }

    // Criar cache de mapeamentos para otimização
    const mappingCache = new MappingCache(formMap)

    // Process files
    const diarioBuffer = await diarioFile.arrayBuffer()
    const diarioWorkbook = XLSX.read(diarioBuffer)
    const diarioSheet = diarioWorkbook.Sheets[diarioWorkbook.SheetNames[0]]
    const diario = XLSX.utils.sheet_to_json(diarioSheet)

    const controleBuffer = await controleFile.arrayBuffer()
    const controleWorkbook = XLSX.read(controleBuffer)
    const controleSheet = controleWorkbook.Sheets[controleWorkbook.SheetNames[0]]
    const controle = XLSX.utils.sheet_to_json(controleSheet)

    if (!diario.length || !controle.length) {
      return NextResponse.json({ error: "Arquivos sem dados" }, { status: 400 })
    }

    // A quantidade de fórmulas é o número de linhas do diário
    const totalFormulas = diario.length

    // Detecta colunas pelo 1º registro (lógica do protótipo)
    const ds = diario[0] || {}, cs = controle[0] || {}
    const dForma = detectCol(ds, ["forma", "farmac", "farmacêutica"]) || Object.keys(ds)[0]
    const dRec = detectCol(ds, ["receita", "pedido", "número", "numero"]) || Object.keys(ds)[1]
    const dSq = detectCol(ds, ["sq", "seq"]) || Object.keys(ds)[2]
    const dVend = detectCol(ds, ["vendedor", "atendente", "vend", "responsável", "responsavel", "usuario", "colaborador"])
    const dVal = detectCol(ds, ["valor", "vlr", "total", "preço", "preco", "r$", "valor receita"])
    const dQtde = detectCol(ds, ["qtde", "quantidade"])

    const cNum = detectCol(cs, ["numero", "número", "receita", "pedido"]) || Object.keys(cs)[0]
    const cSeq = detectCol(cs, ["seq", "sq"]) || Object.keys(cs)[1]
    const cHora = detectCol(cs, ["hora", "horário"]) || Object.keys(cs)[2]
    const cLinha = detectCol(cs, ["linha", "bancada"])

    if (!dForma || !dRec || !dSq || !cNum || !cSeq || !cHora) {
      return NextResponse.json({ error: "Colunas essenciais não detectadas" }, { status: 400 })
    }

    // Índices do diário → forma/vendedor/valor/qtde por (num|seq)
    const recTo = { form: new Map(), vend: new Map(), val: new Map(), qtde: new Map() }
    for (const r of diario) {
      const row = r as any
      const key = `${normKey(row[dRec])}|${normKey(row[dSq])}`
      recTo.form.set(key, normKey(row[dForma]))
      if (dVend) recTo.vend.set(key, String(row[dVend] || '').trim() || '—')
      if (dVal) recTo.val.set(key, parseMoney(row[dVal]))
      if (dQtde) recTo.qtde.set(key, parseInt(row[dQtde], 10) || 1)
    }

    // Merge com controle (usa 1ª ocorrência por (num|seq))
    const seen = new Set(), merged = []
    for (const r of controle) {
      const row = r as any
      const key = `${normKey(row[cNum])}|${normKey(row[cSeq])}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push({
        formaNorm: recTo.form.get(key) || '',
        bucket: bucket(row[cHora]),
        vendedor: recTo.vend.get(key) || '—',
        valor: recTo.val.get(key) || 0,
        quantidade: recTo.qtde.get(key) || 1,
        linha: cLinha ? String(row[cLinha] || '') : null
      })
    }

    // Agregações
    const mat = new Map(), noMap = new Map()
    let grand = 0, totalValue = 0, solidsNo15 = 0
    const sellerAgg = new Map()
    const hourlyTotals = Object.fromEntries(BUCKETS.map(b => [b, 0]))
    const solidsSet = new Set(GROUPS.find(g => g.solids)?.items || [])

    for (const row of merged) {
      const mapped = formMap[row.formaNorm] || row.formaNorm || '(SEM MAPA)'
      if (!formMap[row.formaNorm]) {
        const k = row.formaNorm || '(vazio)'
        noMap.set(k, (noMap.get(k) || 0) + row.quantidade)
      }
      const k2 = `${mapped}|${row.bucket}`
      mat.set(k2, (mat.get(k2) || 0) + row.quantidade)
      hourlyTotals[row.bucket] = (hourlyTotals[row.bucket] || 0) + row.quantidade

      const name = row.vendedor || '—'
      const prev = sellerAgg.get(name) || { qty: 0, value: 0 }
      prev.qty += row.quantidade
      prev.value += Number(row.valor || 0)
      sellerAgg.set(name, prev)

      if (solidsSet.has(mapped) && row.bucket !== '15:00') solidsNo15 += row.quantidade
      grand += row.quantidade
      totalValue += Number(row.valor || 0)
    }

    // Linhas da tabela (por grupos)
    const lines = []
    for (const g of GROUPS) {
      lines.push({ kind: 'section', label: g.title })
      const hourly = Object.fromEntries(BUCKETS.map(b => [b, 0]))
      for (const item of g.items) {
        const row: any = { kind: 'item', label: item }
        let tot = 0
        for (const b of BUCKETS) {
          const v = (mat.get(`${item}|${b}`) || 0)
          row[b] = v
          tot += v
          hourly[b] += v
        }
        row.total = tot
        lines.push(row)
      }
      const rowH: any = { kind: 'subtotalH', label: g.hourlyLabel }
      let totH = 0
      for (const b of BUCKETS) { 
        rowH[b] = hourly[b]
        totH += hourly[b] 
      }
      rowH.total = totH
      lines.push(rowH)

      if (g.extras) {
        for (const e of g.extras) {
          if (/SEM\s*SEDEX\s*\(15:00\)/i.test(e) && g.title === 'SOLIDOS') {
            const ex: any = { kind: 'extra', label: e }
            let t = 0
            for (const b of BUCKETS) {
              const v = (b === '15:00') ? 0 : rowH[b]
              ex[b] = v
              t += v
            }
            ex.total = t
            lines.push(ex)
          }
        }
      }
    }

    // Find top seller
    let topSeller = "—"
    let maxValue = 0
    for (const [seller, data] of sellerAgg.entries()) {
      if ((data as any).value > maxValue) {
        maxValue = (data as any).value
        topSeller = seller
      }
    }

    // Preparar dados do kanban
    const kanbanData = {
      buckets: BUCKETS.map(bucketName => ({
        title: bucketName,
        items: Array.from(mat.entries())
          .filter(([key]) => key.endsWith(`|${bucketName}`))
          .map(([key, count]) => ({
            title: key.split('|')[0],
            count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12)
      }))
    }

    // Response data
    // Otimização: verificação rápida se todos os itens já estão mapeados
    if (checkOnly) {
      // Pré-filtro rápido usando o cache
      const formasUnicas = Array.from(new Set(merged.map(row => row.formaNorm)))
      const hasUnmappedItems = mappingCache.hasUnmappedItems(formasUnicas)
      
      if (!hasUnmappedItems) {
        console.log(`⚡ Verificação otimizada: todos os itens já estão mapeados`)
        return NextResponse.json({
          success: true,
          checkOnly: true,
          unmappedData: []
        })
      }
      
      // Se há itens não mapeados, fazer verificação completa
      const unmappedItems = Array.from(noMap.entries()).map(([forma, ocorrencias]) => ({ forma, ocorrencias }))
      console.log(`🔍 Verificação de itens não mapeados: encontrados ${unmappedItems.length} itens`)
      return NextResponse.json({
        success: true,
        checkOnly: true,
        unmappedData: unmappedItems
      })
    }

    const responseData: any = {
      date: date,
      items: merged.map((item, index) => ({ ...item, id: index })),
      tableRows: lines,
      kpis: {
        totalQuantity: totalFormulas,
        totalValue,
        solidCount: solidsNo15,
        topSeller,
        formulasProcessed: merged.length
      },
      sellersData: Array.from(sellerAgg.entries()).map(([name, data]: [string, any]) => ({
        name,
        qty: data.qty,
        value: data.value,
        avg: data.qty ? (data.value / data.qty) : 0
      })).sort((a, b) => b.value - a.value),
      kanbanData,
      hourlyTotals,
      unmappedData: Array.from(noMap.entries()).map(([forma, ocorrencias]) => ({ forma, ocorrencias }))
    }

    // Salvar no banco de dados
    console.log('🔄 Iniciando salvamento no banco de dados...')
    console.log('📊 Dados do relatório:', {
      userId: session.user.id,
      date,
      totalQuantity: totalFormulas,
      totalValue,
      solidCount: solidsNo15,
      topSeller,
      mergedItemsCount: merged.length,
      totalQtySum: grand
    })

    // Verificar se já existe um relatório para esta data
    console.log('🔍 Verificando relatório existente para data:', date)
    const { data: existingReport } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('date', date)
      .eq('user_id', session.user.id)
      .maybeSingle()

    let savedReport: any

    if (existingReport) {
      console.log('🔄 Atualizando relatório existente com ID:', (existingReport as any).id)
      
      // Atualizar relatório existente
      const { data: updatedReport, error: reportError } = await (supabaseAdmin as any)
        .from('reports')
        .update({
          title: `Relatório ${date}`,
          status: 'completed',
          diario_file_name: diarioFile.name,
          controle_file_name: controleFile.name,
          total_quantity: totalFormulas,
          total_value: totalValue,
          solid_count: solidsNo15,
          top_seller: topSeller,
          processed_data: responseData,
          kanban_data: kanbanData,
          sellers_data: responseData.sellersData,
          updated_at: new Date().toISOString()
        })
        .eq('id', (existingReport as any).id)
        .select('*')
        .single()

      if (reportError || !updatedReport) {
        console.error('❌ Erro ao atualizar relatório:', reportError)
        throw new Error(`Erro ao atualizar relatório: ${reportError?.message}`)
      }
      
      savedReport = updatedReport
    } else {
      console.log('🆕 Criando novo relatório para data:', date)
      
      // Criar novo relatório
      const { data: newReport, error: reportError } = await (supabaseAdmin as any)
        .from('reports')
        .insert({
          title: `Relatório ${date}`,
          date: date,
          status: 'completed',
          user_id: session.user.id,
          diario_file_name: diarioFile.name,
          controle_file_name: controleFile.name,
          total_quantity: totalFormulas,
          total_value: totalValue,
          solid_count: solidsNo15,
          top_seller: topSeller,
          processed_data: responseData,
          kanban_data: kanbanData,
          sellers_data: responseData.sellersData
        })
        .select('*')
        .single()

      if (reportError || !newReport) {
        console.error('❌ Erro ao criar relatório:', reportError)
        throw new Error(`Erro ao criar relatório: ${reportError?.message}`)
      }
      
      savedReport = newReport
    }

    console.log('✅ Relatório processado com ID:', savedReport.id)

    // Salvar itens do relatório
    if (merged.length > 0) {
      console.log(`🔄 Processando ${merged.length} itens do relatório...`)
      
      // Se está atualizando um relatório existente, remover itens antigos
      if (existingReport) {
        console.log('🗑️  Removendo itens antigos do relatório...')
        const { error: deleteError } = await supabaseAdmin
          .from('report_items')
          .delete()
          .eq('report_id', savedReport.id)

        if (deleteError) {
          console.error('❌ Erro ao remover itens antigos:', deleteError)
          throw new Error(`Erro ao remover itens antigos: ${deleteError.message}`)
        }
        console.log('✅ Itens antigos removidos')
      }
      
      // Inserir novos itens
      const reportItems = merged.map((item: any, index) => ({
        report_id: savedReport.id,
        form_norm: item.formaNorm,
        linha: item.linha,
        horario: item.bucket,
        vendedor: item.vendedor,
        quantidade: Number(item.quantidade || 1),
        valor: Number(item.valor || 0),
        categoria: formMap[item.formaNorm] || item.formaNorm,
        source_file: 'controle', // Baseado na estrutura atual
        row_index: index,
        is_mapped: !!formMap[item.formaNorm]
      }))

      console.log('📝 Exemplo de item a ser salvo:', reportItems[0])

      const { error: itemsError } = await (supabaseAdmin as any)
        .from('report_items')
        .insert(reportItems)

      if (itemsError) {
        console.error('❌ Erro ao salvar itens do relatório:', itemsError)
        throw new Error(`Erro ao salvar itens do relatório: ${itemsError.message}`)
      }

      console.log('✅ Itens do relatório salvos com sucesso')
    }

    // Atualizar último processamento - primeiro verifica se existe
    console.log('🔄 Atualizando último processamento...')
    
    const { data: existingRecord } = await supabaseAdmin
      .from('last_processing')
      .select('id')
      .eq('report_date', date)
      .maybeSingle()

    console.log('🔍 Registro existente encontrado:', !!existingRecord)

    const lastProcessingData: any = {
      report_date: date,
      report_id: savedReport.id,
      processed_at: new Date().toISOString(),
      total_quantity: totalFormulas,
      total_value: totalValue,
      solid_count: solidsNo15,
      top_seller: topSeller,
      diario_file_name: diarioFile.name,
      controle_file_name: controleFile.name,
      updated_at: new Date().toISOString()
    }

    console.log('📋 Dados do último processamento:', lastProcessingData)

    let upsertError: any = null

    if (existingRecord) {
      console.log('🔄 Atualizando registro existente...')
      // Atualizar registro existente
      const { error } = await (supabaseAdmin as any)
        .from('last_processing')
        .update(lastProcessingData)
        .eq('report_date', date)
      upsertError = error
    } else {
      console.log('🆕 Inserindo novo registro...')
      // Inserir novo registro
      const { error } = await (supabaseAdmin as any)
        .from('last_processing')
        .insert(lastProcessingData)
      upsertError = error
    }

    if (upsertError) {
      console.error('❌ Erro ao atualizar último processamento:', upsertError)
      throw new Error(`Erro ao atualizar último processamento: ${upsertError.message}`)
    }

    console.log('✅ Último processamento atualizado com sucesso')

    // Adicionar ID do relatório à resposta
    responseData.reportId = (savedReport as any).id

    console.log('🎉 Todos os dados salvos com sucesso no banco!')
      
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Error processing report:", error)
    return NextResponse.json({ 
      error: "Erro no processamento dos arquivos: " + error.message 
    }, { status: 500 })
  }
}
