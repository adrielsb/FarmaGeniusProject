import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import * as XLSX from "xlsx"
import { MappingCache } from "@/lib/mapping-suggestions"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutos para processamento de período

// Reutilizar as constantes e funções do processo diário
const BUCKETS = ["7:00 AS 8:00", "10:00 AS 13:00", "14:00", "15:00", "16:00 AS 17:00", "OUTROS"]

const GROUPS = [
  {
    title: 'SOLIDOS',
    items: ['CAPSULAS PRONTAS', 'CAPSULAS', 'CAPSULAS GASTRO', 'SACHES', 'MATERIA PRIMA'],
    hourlyLabel: 'TOTAL POR HORARIO SOLIDOS',
    solids: true
  },
  {
    title: 'DERMATO A',
    items: [
      'GEL TRANSDERMICO, GEL VAGINAL',
      'Creme e Loções',
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
  "CREME": "Creme e Loções",
  "HYDRA FRESH": "Creme e Loções",
  "SECOND SKIN": "Creme e Loções",
  "CREME CRODA": "Creme e Loções",
  "CREME NAO IONICO": "Creme e Loções",
  "CREME OIL FREE": "Creme e Loções",
  "CREME AREA DOS OLHOS": "Creme e Loções",
  "CREME CELULITE": "Creme e Loções",
  "LOCAO": "Creme e Loções",
  "LOCAO CREMOSA": "Creme e Loções",
  "LOCAO CRODA": "Creme e Loções",
  "LOCAO NAO IONICA": "Creme e Loções",
  "LOCAO OIL FREE": "Creme e Loções",
  "POMADA": "Creme e Loções",
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

// Funções utilitárias
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
  if (n !== null && n >= 7 && n <= 8) return BUCKETS[0] // "7:00 AS 8:00"
  if (n !== null && n >= 10 && n <= 13) return BUCKETS[1] // "10:00 AS 13:00"
  if (n === 14) return BUCKETS[2] // "14:00"
  if (n === 15) return BUCKETS[3] // "15:00"
  if (n !== null && n >= 16 && n <= 17) return BUCKETS[4] // "16:00 AS 17:00"
  return BUCKETS[5] // "OUTROS"
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

// Cache para evitar logs duplicados
const adjustmentCache = new Set<string>()

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
  
  // Log apenas uma vez por data ajustada
  if (originalDate !== adjustedDate && !adjustmentCache.has(originalDate)) {
    adjustmentCache.add(originalDate)
    console.log(`📅 Data de entrega ajustada: ${originalDate} → ${adjustedDate} (domingo → segunda-feira)`)
  }
  
  return adjustedDate
}

// Função para detectar datas nos dados
const extractDateFromData = (row: any): string | null => {
  // Procurar em todos os campos do registro
  for (const [field, value] of Object.entries(row)) {
    if (!value) continue
    
    // Se for um número (serial date do Excel)
    if (typeof value === 'number' && value > 40000 && value < 50000) {
      // Converter número serial do Excel para data
      const excelEpoch = new Date(1900, 0, 1)
      const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
      const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
      return moveWeekendToNextBusinessDay(dateStr)
    }
    
    // Se for uma string que pode conter data
    if (typeof value === 'string') {
      // Procurar padrões de data como DD/MM, DD/MM/YY, DD/MM/YYYY
      const patterns = [
        /(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?/,  // DD/MM ou DD/MM/YY ou DD/MM/YYYY
        /(\d{1,2})-(\d{1,2})(?:-\d{2,4})?/,   // DD-MM ou DD-MM-YY ou DD-MM-YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/         // YYYY-MM-DD
      ]
      
      for (const pattern of patterns) {
        const match = value.match(pattern)
        if (match) {
          let dateStr: string
          if (match[3]) {
            // Formato YYYY-MM-DD
            dateStr = `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}`
          } else {
            // Formato DD/MM ou DD-MM
            dateStr = `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}`
          }
          return moveWeekendToNextBusinessDay(dateStr)
        }
      }
      
      // Procurar texto que contenha data como "01/08/2024" ou "01 ago 2024"
      const fullDatePattern = /(\d{1,2})[\/\-\s](\d{1,2}|\w{3})[\/\-\s](\d{2,4})/i
      const fullMatch = value.match(fullDatePattern)
      if (fullMatch) {
        // Se o segundo grupo é um mês em texto, convertê-lo
        const monthMap: {[key: string]: string} = {
          'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
          'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
          'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
        }
        
        let month = fullMatch[2]
        if (isNaN(parseInt(month))) {
          month = monthMap[month.toLowerCase()] || '01'
        }
        
        const dateStr = `${fullMatch[1].padStart(2, '0')}/${month.padStart(2, '0')}`
        return moveWeekendToNextBusinessDay(dateStr)
      }
    }
    
    // Se for um objeto Date
    if (value instanceof Date) {
      const dateStr = `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}`
      return moveWeekendToNextBusinessDay(dateStr)
    }
  }
  
  return null
}

// Função para verificar itens não mapeados em uma data específica
async function checkUnmappedItemsForDate(
  diario: any[],
  controle: any[],
  formMap: {[key: string]: string},
  date: string
): Promise<Array<{forma: string, ocorrencias: number}>> {
  // Detecta colunas pelo 1º registro (lógica do protótipo)
  const ds = diario[0] || {}, cs = controle[0] || {}
  const dForma = detectCol(ds, ["forma", "farmac", "farmacêutica"]) || Object.keys(ds)[0]
  const dRec = detectCol(ds, ["receita", "pedido", "número", "numero"]) || Object.keys(ds)[1]
  const dSq = detectCol(ds, ["sq", "seq"]) || Object.keys(ds)[2]
  const dQtde = detectCol(ds, ["qtde", "quantidade"])

  const cNum = detectCol(cs, ["numero", "número", "receita", "pedido"]) || Object.keys(cs)[0]
  const cSeq = detectCol(cs, ["seq", "sq"]) || Object.keys(cs)[1]
  const cHora = detectCol(cs, ["hora", "horário"]) || Object.keys(cs)[2]

  if (!dForma || !dRec || !dSq || !cNum || !cSeq || !cHora) {
    throw new Error(`Colunas essenciais não detectadas para ${date}`)
  }

  // Índices do diário → forma/qtde por (num|seq)
  const recTo = { form: new Map(), qtde: new Map() }
  for (const r of diario) {
    const row = r as any
    const key = `${normKey(row[dRec])}|${normKey(row[dSq])}`
    recTo.form.set(key, normKey(row[dForma]))
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
      quantidade: recTo.qtde.get(key) || 1
    })
  }

  // Verificar itens não mapeados
  const noMap = new Map()
  for (const row of merged) {
    if (!formMap[row.formaNorm]) {
      const k = row.formaNorm || '(vazio)'
      noMap.set(k, (noMap.get(k) || 0) + row.quantidade)
    }
  }

  return Array.from(noMap.entries()).map(([forma, ocorrencias]) => ({ forma, ocorrencias }))
}

// Função principal para processar um período
async function processPeriodData(
  diario: any[],
  controle: any[],
  formMap: {[key: string]: string},
  userId: string,
  checkOnly: boolean = false,
  mappingCache?: MappingCache
) {
  // Limpar cache de ajustes para novo processamento
  adjustmentCache.clear()
  
  console.log('📅 Detectando datas nos arquivos...')
  
  // Debug: examinar estrutura dos primeiros registros
  console.log('📝 Exemplo de registro do diário:', JSON.stringify(diario[0], null, 2))
  console.log('📝 Exemplo de registro do controle:', JSON.stringify(controle[0], null, 2))
  
  // Detectar todas as datas únicas nos dados
  const datesFound = new Set<string>()
  
  // Verificar datas no diário
  diario.forEach((row, index) => {
    const date = extractDateFromData(row)
    if (date) {
      datesFound.add(date)
      if (index < 5) {  // Log primeiros 5 matches
        console.log(`📅 Data encontrada no diário linha ${index}: ${date}`)
      }
    }
  })
  
  // Verificar datas no controle
  controle.forEach((row, index) => {
    const date = extractDateFromData(row)
    if (date) {
      datesFound.add(date)
      if (index < 5) {  // Log primeiros 5 matches
        console.log(`📅 Data encontrada no controle linha ${index}: ${date}`)
      }
    }
  })
  
  console.log('📅 Datas encontradas:', Array.from(datesFound))
  
  if (datesFound.size === 0) {
    throw new Error('Nenhuma data foi encontrada nos arquivos. Verifique se os arquivos contêm campos de data válidos.')
  }
  
  const processedReports = []
  const allUnmappedData = new Map<string, number>() // Agregar unmapped data de todas as datas
  
  // Processar cada data encontrada (versão otimizada com processamento paralelo)
  const dateArray = Array.from(datesFound)
  console.log(`🚀 Iniciando processamento de ${dateArray.length} datas usando processamento paralelo...`)
  
  // Função para processar uma data individual
  const processDate = async (date: string) => {
    console.log(`🔄 ${checkOnly ? 'Verificando' : 'Processando'} data: ${date}`)
    
    // Filtrar dados por data
    const diarioForDate = diario.filter(row => extractDateFromData(row) === date)
    const controleForDate = controle.filter(row => extractDateFromData(row) === date)
    
    if (diarioForDate.length === 0 || controleForDate.length === 0) {
      console.log(`⚠️ Dados insuficientes para ${date}, pulando...`)
      return { date, report: null, unmappedData: [] }
    }
    
    if (checkOnly) {
      // Apenas verificar itens não mapeados sem salvar
      const unmappedData = await checkUnmappedItemsForDate(diarioForDate, controleForDate, formMap, date)
      return { date, report: null, unmappedData }
    } else {
      // Processar usando a mesma lógica do processo diário
      const { report, unmappedData } = await processSingleDate(diarioForDate, controleForDate, formMap, date, userId)
      return { date, report, unmappedData }
    }
  }
  
  // Processar em lotes para evitar sobrecarga de memória e banco de dados
  const BATCH_SIZE = 3 // Processar até 3 datas em paralelo
  const results = []
  
  for (let i = 0; i < dateArray.length; i += BATCH_SIZE) {
    const batch = dateArray.slice(i, i + BATCH_SIZE)
    console.log(`📦 Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dateArray.length / BATCH_SIZE)} com ${batch.length} datas: ${batch.join(', ')}`)
    
    // Processar lote em paralelo
    const batchResults = await Promise.all(batch.map(processDate))
    results.push(...batchResults)
    
    // Pequena pausa entre lotes para permitir garbage collection
    if (i + BATCH_SIZE < dateArray.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // Agregar resultados
  for (const { report, unmappedData } of results) {
    if (report) {
      processedReports.push(report)
    }
    
    // Agregar unmapped data desta data
    for (const item of unmappedData) {
      const currentCount = allUnmappedData.get(item.forma) || 0
      allUnmappedData.set(item.forma, currentCount + item.ocorrencias)
    }
  }
  
  console.log(`✅ Processamento paralelo concluído! ${processedReports.length} relatórios processados`)
  
  // Converter unmapped data agregado para formato esperado
  const aggregatedUnmappedData = Array.from(allUnmappedData.entries()).map(([forma, ocorrencias]) => ({ 
    forma, 
    ocorrencias 
  }))
  
  return { processedReports, aggregatedUnmappedData }
}

// Função para processar uma única data (adaptada do process-report)
async function processSingleDate(
  diario: any[],
  controle: any[],
  formMap: {[key: string]: string},
  date: string,
  userId: string
) {
  // A quantidade de fórmulas é o número de linhas do diário para esta data
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
    throw new Error(`Colunas essenciais não detectadas para ${date}`)
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
  let grand = 0, totalValue = 0, solidsNo15 = 0, totalSolids = 0
  const sellerAgg = new Map()
  const hourlyTotals = Object.fromEntries(BUCKETS.map(b => [b, 0]))
  const solidsSet = new Set(GROUPS.find(g => g.solids)?.items || [])

  for (const row of merged) {
    const mapped = formMap[row.formaNorm] || row.formaNorm || '(SEM MAPA)'
    if (!formMap[row.formaNorm]) {
      const k = row.formaNorm || '(vazio)'
      noMap.set(k, (noMap.get(k) || 0) + row.quantidade) // Manter a soma de quantidade para itens não mapeados
    }
    const k2 = `${mapped}|${row.bucket}`
    mat.set(k2, (mat.get(k2) || 0) + 1) // Contar por fórmula
    hourlyTotals[row.bucket] = (hourlyTotals[row.bucket] || 0) + 1 // Contar por fórmula

    const name = row.vendedor || '—'
    const prev = sellerAgg.get(name) || { qty: 0, value: 0 }
    prev.qty += 1 // Contar por fórmula
    prev.value += Number(row.valor || 0)
    sellerAgg.set(name, prev)

    if (solidsSet.has(mapped)) {
      totalSolids += 1 // Contar por fórmula
      if (row.bucket !== '15:00') {
        solidsNo15 += 1 // Contar por fórmula
      }
    }
    grand += row.quantidade // Manter grand como a soma total de quantidades para possível uso futuro
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
  const responseData: any = {
    date: date,
    items: merged.map((item, index) => ({ ...item, id: index })),
    tableRows: lines,
    kpis: {
      totalQuantity: merged.length, // Corrigido para contagem de fórmulas processadas
      totalValue,
      solidCount: totalSolids,
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

  // Salvar no banco de dados usando a mesma lógica do process-report
  console.log(`💾 Salvando relatório para ${date}...`)
  
  // Verificar se já existe um relatório para esta data
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized')
  }
  
  const { data: existingReport } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('date', date)
    .eq('user_id', userId)
    .maybeSingle()

  let savedReport: any

  if (existingReport) {
    console.log(`🔄 Atualizando relatório existente para ${date} com ID:`, (existingReport as any).id)
    
    // Atualizar relatório existente
    const { data: updatedReport, error: reportError } = await (supabaseAdmin as any)
      .from('reports')
      .update({
        title: `Relatório ${date}`,
        status: 'completed',
        diario_file_name: 'Período - Diário de Receitas',
        controle_file_name: 'Período - Controle de Fórmulas',
        total_quantity: merged.length, // Corrigido para contagem de fórmulas processadas
        total_value: totalValue,
        solid_count: totalSolids,
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
      throw new Error(`Erro ao atualizar relatório para ${date}: ${reportError?.message}`)
    }
    
    savedReport = updatedReport
  } else {
    // Criar novo relatório
    const { data: newReport, error: reportError } = await (supabaseAdmin as any)
      .from('reports')
      .insert({
        title: `Relatório ${date}`,
        date: date,
        status: 'completed',
        user_id: userId,
        diario_file_name: 'Período - Diário de Receitas',
        controle_file_name: 'Período - Controle de Fórmulas',
        total_quantity: merged.length, // Corrigido para contagem de fórmulas processadas
        total_value: totalValue,
        solid_count: totalSolids,
        top_seller: topSeller,
        processed_data: responseData,
        kanban_data: kanbanData,
        sellers_data: responseData.sellersData
      })
      .select('*')
      .single()

    if (reportError || !newReport) {
      throw new Error(`Erro ao criar relatório para ${date}: ${reportError?.message}`)
    }
    
    savedReport = newReport
  }

  // Salvar itens do relatório
  if (merged.length > 0) {
    // Se está atualizando um relatório existente, remover itens antigos
    if (existingReport) {
      await supabaseAdmin
        .from('report_items')
        .delete()
        .eq('report_id', savedReport.id)
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
      source_file: 'controle',
      row_index: index,
      is_mapped: !!formMap[item.formaNorm]
    }))

    const { error: itemsError } = await (supabaseAdmin as any)
      .from('report_items')
      .insert(reportItems)

    if (itemsError) {
      throw new Error(`Erro ao salvar itens do relatório para ${date}: ${itemsError.message}`)
    }
  }

  // Atualizar último processamento
  const { data: existingLastProcessing } = await supabaseAdmin
    .from('last_processing')
    .select('id')
    .eq('report_date', date)
    .maybeSingle()

  const lastProcessingData: any = {
    report_date: date,
    report_id: savedReport.id,
    processed_at: new Date().toISOString(),
    total_quantity: merged.length, // Corrigido para contagem de fórmulas processadas
    total_value: totalValue,
    solid_count: totalSolids,
    top_seller: topSeller,
    diario_file_name: 'Período - Diário de Receitas',
    controle_file_name: 'Período - Controle de Fórmulas',
    updated_at: new Date().toISOString()
  }

  if (existingLastProcessing) {
    await (supabaseAdmin as any)
      .from('last_processing')
      .update(lastProcessingData)
      .eq('report_date', date)
  } else {
    await supabaseAdmin
      .from('last_processing')
      .insert(lastProcessingData)
  }

  return { 
    report: { date, reportId: savedReport.id, summary: responseData.kpis },
    unmappedData: Array.from(noMap.entries()).map(([forma, ocorrencias]) => ({ forma, ocorrencias }))
  }
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

    console.log('🚀 Iniciando processamento por período...')
    console.log(`📊 Dados carregados: ${diario.length} linhas do diário, ${controle.length} linhas do controle`)

    // Processar período
    const { processedReports, aggregatedUnmappedData } = await processPeriodData(diario, controle, formMap, session.user.id, checkOnly, mappingCache)

    if (checkOnly) {
      console.log(`🔍 Verificação concluída! ${aggregatedUnmappedData.length} itens não mapeados encontrados`)
      return NextResponse.json({
        success: true,
        checkOnly: true,
        unmappedData: aggregatedUnmappedData
      })
    }

    console.log(`✅ Processamento concluído! ${processedReports.length} relatórios criados/atualizados`)

    return NextResponse.json({
      success: true,
      message: `${processedReports.length} relatórios processados com sucesso`,
      processedReports: processedReports,
      unmappedData: aggregatedUnmappedData
    })

  } catch (error: any) {
    console.error("Error processing period:", error)
    return NextResponse.json({ 
      error: "Erro no processamento dos arquivos por período: " + error.message 
    }, { status: 500 })
  }
}