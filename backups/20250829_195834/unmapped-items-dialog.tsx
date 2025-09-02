"use client"

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
import { AlertTriangle, Play, Pause } from "lucide-react"

interface UnmappedItem {
  forma: string
  ocorrencias: number
}

interface UnmappedItemsDialogProps {
  isOpen: boolean
  unmappedItems: UnmappedItem[]
  onContinue: (mappings: Record<string, string>) => void
  onCancel: () => void
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

export function UnmappedItemsDialog({ 
  isOpen, 
  unmappedItems, 
  onContinue, 
  onCancel 
}: UnmappedItemsDialogProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})

  const handleCategoryChange = (forma: string, categoria: string) => {
    setMappings(prev => ({
      ...prev,
      [forma]: categoria
    }))
  }

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
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Ação Requerida</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              O processamento foi pausado porque encontramos formas farmacêuticas não mapeadas. 
              Selecione uma categoria para cada item para continuar.
            </p>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Forma Farmacêutica</TableHead>
                  <TableHead className="font-semibold text-center">Ocorrências</TableHead>
                  <TableHead className="font-semibold">Categoria Destino *</TableHead>
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
                      <Select 
                        value={mappings[item.forma] || ""} 
                        onValueChange={(value) => handleCategoryChange(item.forma, value)}
                      >
                        <SelectTrigger className={`w-full ${!mappings[item.forma] ? 'border-orange-300 bg-orange-50' : ''}`}>
                          <SelectValue placeholder="-- Selecione uma categoria --" />
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Progresso:</strong> {getSelectedCount()} de {getTotalItems()} itens mapeados
              {allMapped && " ✅ Todos os itens foram mapeados!"}
            </p>
          </div>
        </div>

        <DialogFooter>
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