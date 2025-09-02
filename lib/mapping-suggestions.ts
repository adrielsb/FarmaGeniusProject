// Utilitário para sugestões automáticas de mapeamento
export interface MappingSuggestion {
  category: string
  confidence: number
  reason: string
}

// Categorias farmacêuticas disponíveis
export const PHARMACEUTICAL_CATEGORIES = [
  { value: "CAPSULAS PRONTAS", label: "Cápsulas Prontas", group: "SÓLIDOS" },
  { value: "CAPSULAS", label: "Cápsulas", group: "SÓLIDOS" },
  { value: "CAPSULAS GASTRO", label: "Cápsulas Gastro", group: "SÓLIDOS" },
  { value: "SACHES", label: "Sachês", group: "SÓLIDOS" },
  { value: "MATERIA PRIMA", label: "Matéria Prima", group: "SÓLIDOS" },
  { value: "GEL TRANSDERMICO, GEL VAGINAL", label: "Gel Transdérmico/Vaginal", group: "DERMATO A" },
  { value: "CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA", label: "Cremes e Loções", group: "DERMATO A" },
  { value: "BASE SERUM", label: "Base Serum", group: "DERMATO A" },
  { value: "SHOT", label: "Shot", group: "DERMATO A" },
  { value: "SOLUÇÃO, XAROPE, ESMALTE", label: "Solução/Xarope/Esmalte", group: "DERMATO A" },
  { value: "SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR", label: "Produtos Capilares", group: "DERMATO A" },
  { value: "LOÇÃO CAPILAR, LOÇÃO CAPILAR Ñ ALCOOLICA", label: "Loção Capilar", group: "DERMATO A" },
  { value: "GEL , GEL ACQUAGEL, GEL ALCOOLICO, GEL CREME, GEL DE AMIGEL, GEL FLUIDO, GEL NATROSOL, GEL SEPIGEL", label: "Géis Diversos", group: "DERMATO A" },
  { value: "GEL COMESTIVEL", label: "Gel Comestível", group: "DERMATO A" },
  { value: "LIQUID CAPS", label: "Liquid Caps", group: "DERMATO C" },
  { value: "CAPSULAS VAGINAIS", label: "Cápsulas Vaginais", group: "DERMATO C" },
  { value: "GOMAS", label: "Gomas", group: "DERMATO C" },
  { value: "PASTILHAS", label: "Pastilhas", group: "DERMATO C" },
  { value: "BOMBOM", label: "Bombom", group: "DERMATO C" },
  { value: "FILMES", label: "Filmes", group: "DERMATO C" },
  { value: "OVULOS", label: "Óvulos", group: "DERMATO C" },
  { value: "FILME VAGINAL", label: "Filme Vaginal", group: "DERMATO C" },
  { value: "HOMEOPATIA, FLORAL E VEICULO", label: "Homeopatia/Floral/Veículo", group: "DERMATO C" }
]

// Palavras-chave para mapeamento automático
const KEYWORD_MAPPINGS = {
  // SÓLIDOS
  'CAPSULA': { category: 'CAPSULAS', confidence: 0.9 },
  'CAPS': { category: 'CAPSULAS', confidence: 0.8 },
  'GASTRO': { category: 'CAPSULAS GASTRO', confidence: 0.95 },
  'PRONTAS': { category: 'CAPSULAS PRONTAS', confidence: 0.95 },
  'SACHE': { category: 'SACHES', confidence: 0.95 },
  'MATERIA': { category: 'MATERIA PRIMA', confidence: 0.9 },
  'PRIMA': { category: 'MATERIA PRIMA', confidence: 0.8 },

  // DERMATO A - Géis
  'GEL': { category: 'GEL , GEL ACQUAGEL, GEL ALCOOLICO, GEL CREME, GEL DE AMIGEL, GEL FLUIDO, GEL NATROSOL, GEL SEPIGEL', confidence: 0.8 },
  'TRANSDERMICO': { category: 'GEL TRANSDERMICO, GEL VAGINAL', confidence: 0.95 },
  'VAGINAL': { category: 'GEL TRANSDERMICO, GEL VAGINAL', confidence: 0.95 },
  'COMESTIVEL': { category: 'GEL COMESTIVEL', confidence: 0.95 },

  // DERMATO A - Cremes e Loções  
  'CREME': { category: 'CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA', confidence: 0.85 },
  'LOCAO': { category: 'CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA', confidence: 0.85 },
  'LOÇÃO': { category: 'CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA', confidence: 0.85 },
  'POMADA': { category: 'CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA', confidence: 0.85 },
  'CAPILAR': { category: 'LOÇÃO CAPILAR, LOÇÃO CAPILAR Ñ ALCOOLICA', confidence: 0.9 },

  // DERMATO A - Outros
  'SERUM': { category: 'BASE SERUM', confidence: 0.95 },
  'SHOT': { category: 'SHOT', confidence: 0.95 },
  'SOLUCAO': { category: 'SOLUÇÃO, XAROPE, ESMALTE', confidence: 0.8 },
  'SOLUÇÃO': { category: 'SOLUÇÃO, XAROPE, ESMALTE', confidence: 0.8 },
  'XAROPE': { category: 'SOLUÇÃO, XAROPE, ESMALTE', confidence: 0.9 },
  'ESMALTE': { category: 'SOLUÇÃO, XAROPE, ESMALTE', confidence: 0.9 },
  'SHAMPOO': { category: 'SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR', confidence: 0.85 },
  'SABONETE': { category: 'SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR', confidence: 0.85 },
  'CONDICIONADOR': { category: 'SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR', confidence: 0.9 },

  // DERMATO C
  'LIQUID': { category: 'LIQUID CAPS', confidence: 0.9 },
  'GOMA': { category: 'GOMAS', confidence: 0.95 },
  'PASTILHA': { category: 'PASTILHAS', confidence: 0.95 },
  'BOMBOM': { category: 'BOMBOM', confidence: 0.95 },
  'FILME': { category: 'FILMES', confidence: 0.8 },
  'OVULO': { category: 'OVULOS', confidence: 0.95 },
  'ÓVULO': { category: 'OVULOS', confidence: 0.95 },
  'HOMEOPATIA': { category: 'HOMEOPATIA, FLORAL E VEICULO', confidence: 0.9 },
  'FLORAL': { category: 'HOMEOPATIA, FLORAL E VEICULO', confidence: 0.9 },
  'VEICULO': { category: 'HOMEOPATIA, FLORAL E VEICULO', confidence: 0.8 },
}

// Normalizar texto para busca
function normalizeText(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
}

// Calcular similaridade entre strings (algoritmo de Levenshtein simplificado)
function calculateSimilarity(str1: string, str2: string): number {
  const a = normalizeText(str1)
  const b = normalizeText(str2)
  
  if (a === b) return 1.0
  if (a.length === 0 || b.length === 0) return 0.0
  
  // Busca por substring
  if (a.includes(b) || b.includes(a)) return 0.7
  
  // Palavras em comum
  const wordsA = a.split(' ')
  const wordsB = b.split(' ')
  const commonWords = wordsA.filter(word => wordsB.includes(word))
  
  if (commonWords.length > 0) {
    return 0.4 + (commonWords.length / Math.max(wordsA.length, wordsB.length)) * 0.3
  }
  
  return 0.0
}

// Sugerir mapeamento para uma forma farmacêutica
export function suggestMapping(forma: string): MappingSuggestion[] {
  const suggestions: MappingSuggestion[] = []
  const normalizedForma = normalizeText(forma)

  // 1. Busca por palavras-chave exatas
  for (const [keyword, mapping] of Object.entries(KEYWORD_MAPPINGS)) {
    if (normalizedForma.includes(keyword)) {
      suggestions.push({
        category: mapping.category,
        confidence: mapping.confidence,
        reason: `Contém palavra-chave: "${keyword}"`
      })
    }
  }

  // 2. Busca por similaridade com categorias existentes
  for (const category of PHARMACEUTICAL_CATEGORIES) {
    const similarity = calculateSimilarity(forma, category.label)
    if (similarity > 0.6) {
      suggestions.push({
        category: category.value,
        confidence: similarity * 0.8, // Reduzir confiança para similaridade
        reason: `Similar a "${category.label}" (${Math.round(similarity * 100)}%)`
      })
    }
  }

  // 3. Busca em subcategorias (para categorias compostas)
  for (const category of PHARMACEUTICAL_CATEGORIES) {
    const subCategories = category.value.split(', ')
    for (const subCat of subCategories) {
      const similarity = calculateSimilarity(forma, subCat)
      if (similarity > 0.7) {
        suggestions.push({
          category: category.value,
          confidence: similarity * 0.9,
          reason: `Corresponde a subcategoria: "${subCat}"`
        })
      }
    }
  }

  // Ordenar por confiança (maior primeiro) e remover duplicatas
  const uniqueSuggestions = suggestions
    .reduce((acc, current) => {
      const existing = acc.find(item => item.category === current.category)
      if (!existing || existing.confidence < current.confidence) {
        return acc.filter(item => item.category !== current.category).concat(current)
      }
      return acc
    }, [] as MappingSuggestion[])
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3) // Máximo 3 sugestões

  return uniqueSuggestions
}

// Cache para mapeamentos conhecidos (melhoria de performance)
export class MappingCache {
  private knownMappings = new Set<string>()
  private suggestions = new Map<string, MappingSuggestion[]>()

  constructor(existingMappings: Record<string, string> = {}) {
    this.updateKnownMappings(existingMappings)
  }

  updateKnownMappings(mappings: Record<string, string>) {
    this.knownMappings.clear()
    Object.keys(mappings).forEach(key => this.knownMappings.add(normalizeText(key)))
  }

  isMapped(forma: string): boolean {
    return this.knownMappings.has(normalizeText(forma))
  }

  getSuggestions(forma: string): MappingSuggestion[] {
    const key = normalizeText(forma)
    if (!this.suggestions.has(key)) {
      this.suggestions.set(key, suggestMapping(forma))
    }
    return this.suggestions.get(key) || []
  }

  // Pré-filtro rápido para verificar se há itens não mapeados
  hasUnmappedItems(formas: string[]): boolean {
    return formas.some(forma => !this.isMapped(forma))
  }
}