import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Play, Pause, Lightbulb, Wand2, Search, Check, X } from "lucide-react"
import { suggestMapping, type MappingSuggestion } from "@/lib/mapping-suggestions"
import { FormMappingsService } from "@/lib/form-mappings-service"

interface UnmappedItem {
  forma: string
  ocorrencias: number
}

interface UnmappedItemsDialogProps {
  isOpen: boolean
  unmappedItems: UnmappedItem[]
  onContinue: (mappings: Record<string, string>) => void
  onCancel: () => void
  userId?: string
}

// Categorias farmacêuticas baseadas no sistema GROUPS utilizado no processo
const PHARMACEUTICAL_CATEGORIES = [
  // GRUPO SÓLIDOS
  { value: "CAPSULAS PRONTAS", label: "Cápsulas Prontas", group: "SÓLIDOS" },
  { value: "CAPSULAS", label: "Cápsulas", group: "SÓLIDOS" },
  { value: "CAPSULAS GASTRO", label: "Cápsulas Gastro", group: "SÓLIDOS" },
  { value: "SACHES", label: "Sachês", group: "SÓLIDOS" },
  { value: "MATERIA PRIMA", label: "Matéria Prima", group: "SÓLIDOS" },
  
  // GRUPO DERMATO A
  { value: "GEL TRANSDERMICO, GEL VAGINAL", label: "Gel Transdérmico/Vaginal", group: "DERMATO A" },
  { value: "Creme e Loções", label: "Cremes e Loções", group: "DERMATO A" },
  { value: "BASE SERUM", label: "Base Serum", group: "DERMATO A" },
  { value: "SHOT", label: "Shot", group: "DERMATO A" },
  { value: "SOLUÇÃO, XAROPE, ESMALTE", label: "Solução/Xarope/Esmalte", group: "DERMATO A" },
  { value: "SHAMPOO, SABONETE, SABONETE CREMOSO, CONDICIONADOR", label: "Produtos Capilares", group: "DERMATO A" },
  { value: "LOÇÃO CAPILAR, LOÇÃO CAPILAR Ñ ALCOOLICA", label: "Loção Capilar", group: "DERMATO A" },
  { value: "GEL , GEL ACQUAGEL, GEL ALCOOLICO, GEL CREME, GEL DE AMIGEL, GEL FLUIDO, GEL NATROSOL, GEL SEPIGEL", label: "Géis Diversos", group: "DERMATO A" },
  { value: "GEL COMESTIVEL", label: "Gel Comestível", group: "DERMATO A" },
  
  // GRUPO DERMATO C
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

export function UnmappedItemsDialog({ 
  isOpen, 
  unmappedItems, 
  onContinue, 
  onCancel,
  userId
}: UnmappedItemsDialogProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [suggestions, setSuggestions] = useState<Record<string, MappingSuggestion[]>>({})
  const [autoSuggestionApplied, setAutoSuggestionApplied] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const [selectedAll, setSelectedAll] = useState(false)

  // Gerar sugestões automáticas quando itens mudarem
  useEffect(() => {
    const loadSuggestions = async () => {
      const newSuggestions: Record<string, MappingSuggestion[]> = {}
      const autoMappings: Record<string, string> = {}
      
      // Carregar mapeamentos salvos do usuário para melhorar sugestões
      let existingMappings: Record<string, string> = {}
      if (userId) {
        try {
          existingMappings = await FormMappingsService.getUserMappings(userId)
        } catch (error) {
          console.error('Erro ao carregar mapeamentos do usuário:', error)
        }
      }
      
      unmappedItems.forEach(item => {
        // Primeiro verificar se já existe mapeamento salvo
        if (existingMappings[item.forma]) {
          autoMappings[item.forma] = existingMappings[item.forma]
          newSuggestions[item.forma] = [{
            category: existingMappings[item.forma],
            confidence: 1.0,
            reason: "Mapeamento anterior salvo"
          }]
        } else {
          // Gerar sugestões automáticas
          const itemSuggestions = suggestMapping(item.forma)
          newSuggestions[item.forma] = itemSuggestions
          
          // Auto-aplicar sugestões com alta confiança (>= 0.8)
          if (itemSuggestions.length > 0 && itemSuggestions[0].confidence >= 0.8) {
            autoMappings[item.forma] = itemSuggestions[0].category
          }
        }
      })
      
      setSuggestions(newSuggestions)
      
      if (Object.keys(autoMappings).length > 0 && !autoSuggestionApplied) {
        setMappings(autoMappings)
        setAutoSuggestionApplied(true)
      }
    }
    
    if (isOpen && unmappedItems.length > 0) {
      loadSuggestions()
    }
  }, [unmappedItems, autoSuggestionApplied, isOpen, userId])

  const handleCategoryChange = (forma: string, categoria: string) => {
    setMappings(prev => ({
      ...prev,
      [forma]: categoria
    }))
  }

  const handleApplySuggestion = (forma: string, categoria: string) => {
    handleCategoryChange(forma, categoria)
  }

  const handleApplyAllHighConfidence = () => {
    const highConfidenceMappings: Record<string, string> = {}
    
    Object.entries(suggestions).forEach(([forma, formaSuggestions]) => {
      if (formaSuggestions.length > 0 && formaSuggestions[0].confidence >= 0.7) {
        highConfidenceMappings[forma] = formaSuggestions[0].category
      }
    })
    
    setMappings(prev => ({ ...prev, ...highConfidenceMappings }))
  }

  const handleSelectAll = () => {
    if (selectedAll) {
      // Desmarcar todos
      setMappings({})
      setSelectedAll(false)
    } else {
      // Aplicar a melhor sugestão para cada item
      const allMappings: Record<string, string> = {}
      filteredItems.forEach(item => {
        const itemSuggestions = suggestions[item.forma] || []
        if (itemSuggestions.length > 0) {
          allMappings[item.forma] = itemSuggestions[0].category
        }
      })
      setMappings(prev => ({ ...prev, ...allMappings }))
      setSelectedAll(true)
    }
  }

  // Filtrar itens baseado na busca
  const filteredItems = unmappedItems.filter(item =>
    item.forma.toLowerCase().includes(searchFilter.toLowerCase())
  )

  // Verificar se todos os itens filtrados estão mapeados
  useEffect(() => {
    const allFilteredMapped = filteredItems.every(item => mappings[item.forma])
    setSelectedAll(allFilteredMapped && filteredItems.length > 0)
  }, [mappings, filteredItems])

  const handleContinue = () => {
    onContinue(mappings)
  }

  const getSelectedCount = () => Object.keys(mappings).length
  const getTotalItems = () => unmappedItems.length
  const allMapped = getSelectedCount() === getTotalItems()

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-orange-500" />
            Processamento Pausado - Itens Não Mapeados
          </DialogTitle>
          <DialogDescription>
            Encontramos {getTotalItems()} item(s) que não possuem mapeamento. 
            Por favor, escolha a categoria adequada para cada um antes de continuar o processamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Ação Requerida</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-2 text-purple-700 border-purple-300 hover:bg-purple-50"
                >
                  {selectedAll ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  {selectedAll ? 'Limpar Tudo' : 'Mapear Tudo'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleApplyAllHighConfidence}
                  className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                >
                  <Wand2 className="h-3 w-3" />
                  Sugestões Automáticas
                </Button>
              </div>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              O processamento foi pausado porque encontramos formas farmacêuticas não mapeadas. 
              Selecione uma categoria para cada item ou use as sugestões automáticas.
            </p>
          </div>

          {/* Busca e filtros */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar forma farmacêutica..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Mostrando {filteredItems.length} de {unmappedItems.length} itens</span>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Forma Farmacêutica</TableHead>
                  <TableHead className="font-semibold text-center">Ocorrências</TableHead>
                  <TableHead className="font-semibold">Sugestões</TableHead>
                  <TableHead className="font-semibold">Categoria Destino *</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => {
                  const itemSuggestions = suggestions[item.forma] || []
                  const topSuggestion = itemSuggestions[0]
                  
                  return (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {item.forma}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {item.ocorrencias}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {itemSuggestions.length > 0 ? (
                          <div className="space-y-1">
                            {itemSuggestions.slice(0, 2).map((suggestion, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`text-xs h-6 px-2 gap-1 ${
                                    suggestion.confidence >= 0.8 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : suggestion.confidence >= 0.6
                                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                  onClick={() => handleApplySuggestion(item.forma, suggestion.category)}
                                >
                                  <Lightbulb className="h-3 w-3" />
                                  {Math.round(suggestion.confidence * 100)}%
                                </Button>
                                <span className="text-xs text-gray-600 truncate flex-1">
                                  {suggestion.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Nenhuma sugestão</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={mappings[item.forma] || ""} 
                          onValueChange={(value) => handleCategoryChange(item.forma, value)}
                        >
                          <SelectTrigger className={`w-full ${
                            !mappings[item.forma] 
                              ? 'border-orange-300 bg-orange-50' 
                              : mappings[item.forma] === topSuggestion?.category
                              ? 'border-green-300 bg-green-50'
                              : 'border-blue-300 bg-blue-50'
                          }`}>
                            <SelectValue placeholder="-- Selecione uma categoria --" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Mostrar sugestões primeiro */}
                            {itemSuggestions.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                  💡 Sugestões Automáticas
                                </div>
                                {itemSuggestions.map((suggestion, idx) => {
                                  const category = PHARMACEUTICAL_CATEGORIES.find(cat => cat.value === suggestion.category)
                                  return category ? (
                                    <SelectItem key={`suggestion-${idx}`} value={category.value}>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span>{category.label}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {Math.round(suggestion.confidence * 100)}%
                                          </Badge>
                                        </div>
                                        <span className="text-xs text-gray-500">{category.group} • {suggestion.reason}</span>
                                      </div>
                                    </SelectItem>
                                  ) : null
                                })}
                                <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                  📋 Todas as Categorias
                                </div>
                              </>
                            )}
                            {PHARMACEUTICAL_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex flex-col">
                                  <span>{category.label}</span>
                                  <span className="text-xs text-gray-500">{category.group}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Estatísticas e Progresso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">Progresso</span>
              </div>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {getSelectedCount()}/{getTotalItems()}
              </p>
              <p className="text-xs text-blue-600">
                {Math.round((getSelectedCount() / getTotalItems()) * 100)}% completo
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Sugestões</span>
              </div>
              <p className="text-lg font-bold text-green-900 mt-1">
                {Object.values(suggestions).filter(sugs => sugs.length > 0 && sugs[0].confidence >= 0.7).length}
              </p>
              <p className="text-xs text-green-600">
                com alta confiança
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Pendentes</span>
              </div>
              <p className="text-lg font-bold text-orange-900 mt-1">
                {getTotalItems() - getSelectedCount()}
              </p>
              <p className="text-xs text-orange-600">
                requerem atenção
              </p>
            </div>
          </div>

          {allMapped && (
            <div className="bg-green-100 border border-green-300 rounded-md p-3 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">✅ Todos os itens foram mapeados com sucesso!</span>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar Processamento
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!allMapped}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Continuar Processamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}