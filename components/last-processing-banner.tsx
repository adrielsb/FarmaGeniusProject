
"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, TrendingUp, Users, Package, Award } from "lucide-react"
import { motion } from "framer-motion"

interface LastProcessingBannerProps {
  data: {
    reportDate?: string | null
    processedAt?: string | null
    totalQuantity?: number | null
    totalValue?: number | null
    solidCount?: number | null
    topSeller?: string | null
    diarioFileName?: string | null
    controleFileName?: string | null
  } | null
  onViewHistory?: () => void
}

export function LastProcessingBanner({ data, onViewHistory }: LastProcessingBannerProps) {
  if (!data) return null

  const formatCurrency = (value: number | null | undefined) => {
    if (!value || isNaN(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDateTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return 'Data não disponível'
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) return 'Data inválida'
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const safeNumber = (value: number | null | undefined): number => {
    return value && !isNaN(value) ? value : 0
  }

  const safeString = (value: string | null | undefined): string => {
    return value || 'N/A'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Informações principais */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Último Relatório</p>
                  <p className="text-lg font-bold text-blue-600">{safeString(data.reportDate)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Processado em</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDateTime(data.processedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* KPIs resumidos */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {safeNumber(data.totalQuantity).toLocaleString()} itens
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(data.totalValue)}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {safeNumber(data.solidCount)} sólidos
                </Badge>
              </div>

              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">
                  {safeString(data.topSeller)}
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-2">
              {onViewHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewHistory}
                  className="flex items-center space-x-1"
                >
                  <Users className="h-4 w-4" />
                  <span>Ver Histórico</span>
                </Button>
              )}
            </div>
          </div>

          {/* Arquivos processados */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span className="flex items-center space-x-1">
                <span className="font-medium">Diário:</span>
                <span>{safeString(data.diarioFileName)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span className="font-medium">Controle:</span>
                <span>{safeString(data.controleFileName)}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
