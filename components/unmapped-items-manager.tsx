
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"

interface UnmappedItem {
  forma: string
  ocorrencias: number
  categoria?: string
}

interface UnmappedItemsManagerProps {
  unmappedData: any[]
  onApplyMappings?: (mappings: Record<string, string>) => void
  isProcessing?: boolean
  showMappingOnly?: boolean
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
  { value: "CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA", label: "Cremes e Loções", group: "DERMATO A" },
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

export function UnmappedItemsManager({ unmappedData, onApplyMappings, isProcessing, showMappingOnly = false }: UnmappedItemsManagerProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [unmappedItems, setUnmappedItems] = useState<UnmappedItem[]>([])

  useEffect(() => {
    if (unmappedData && unmappedData.length > 0) {
      // Processar dados não mapeados e contar ocorrências
      const itemCounts: Record<string, number> = {}
      
      unmappedData.forEach(item => {
        const forma = item.forma?.toString().toUpperCase().trim() || "INDEFINIDO"
        itemCounts[forma] = (itemCounts[forma] || 0) + 1
      })

      const items: UnmappedItem[] = Object.entries(itemCounts).map(([forma, ocorrencias]) => ({
        forma,
        ocorrencias
      }))

      setUnmappedItems(items)
    } else {
      setUnmappedItems([])
    }
  }, [unmappedData])

  const handleCategoryChange = (forma: string, categoria: string) => {
    setMappings(prev => ({
      ...prev,
      [forma]: categoria
    }))
  }

  const handleClearSelection = () => {
    setMappings({})
    toast.success("Seleção limpa")
  }

  const handleApplyMappings = () => {
    if (Object.keys(mappings).length === 0) {
      toast.error("Selecione pelo menos uma categoria para aplicar")
      return
    }

    if (onApplyMappings) {
      onApplyMappings(mappings)
      toast.success(`${Object.keys(mappings).length} mapeamento(s) aplicado(s)`)
    }
  }

  const getSelectedCount = () => Object.keys(mappings).length
  const getTotalItems = () => unmappedItems.length

  if (unmappedItems.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Todos os itens foram mapeados com sucesso. Nenhuma ação manual necessária.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          {showMappingOnly ? "Itens sem mapeamento" : "Sem mapeamento"}
        </CardTitle>
        <CardDescription>
          {showMappingOnly 
            ? `${getTotalItems()} item(s) não foram mapeados durante o processamento por período. Configure o mapeamento no arquivo JSON para processamentos futuros.`
            : `Selecione a categoria alvo para cada termo (${getSelectedCount()}/${getTotalItems()} selecionados)`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Forma (normalizada)</TableHead>
                <TableHead className="font-semibold text-center">Ocorrências</TableHead>
                <TableHead className="font-semibold">Categoria destino</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmappedItems.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {item.forma}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {item.ocorrencias}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {showMappingOnly ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Não mapeado
                      </Badge>
                    ) : (
                      <Select 
                        value={mappings[item.forma] || ""} 
                        onValueChange={(value) => handleCategoryChange(item.forma, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- escolher --" />
                        </SelectTrigger>
                        <SelectContent>
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
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!showMappingOnly && (
          <>
            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline" 
                onClick={handleClearSelection}
                disabled={Object.keys(mappings).length === 0 || isProcessing}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar seleção
              </Button>
              
              <Button 
                onClick={handleApplyMappings}
                disabled={Object.keys(mappings).length === 0 || isProcessing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                Aplicar mapeamentos e reprocessar
              </Button>
            </div>

            {getSelectedCount() > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>{getSelectedCount()}</strong> item(s) selecionado(s) para mapeamento. 
                  Clique em "Aplicar mapeamentos e reprocessar" para salvar as alterações.
                </p>
              </div>
            )}
          </>
        )}

        {showMappingOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-sm text-amber-800">
              Estes itens não foram mapeados durante o processamento por período. 
              Configure o mapeamento JSON antes de processar novos arquivos para evitar este problema.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
