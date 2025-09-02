"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  Link,
  AlertTriangle,
  Info
} from "lucide-react"
import { toast } from "sonner"

interface VerificationResult {
  success: boolean
  verification: {
    tables: Record<string, { success?: boolean, error?: string, count: number }>
    userData: {
      currentUser: { success?: boolean, error?: string, id?: string, name?: string, email?: string }
      reports: { success?: boolean, error?: string, count?: number, data?: any[] }
      settings: { success?: boolean, error?: string, count?: number, keys?: string[] }
      lastProcessing: { success?: boolean, error?: string, count?: number, data?: any[] }
    }
    relationships: {
      reportsItems: { 
        success?: boolean, 
        error?: string, 
        totalReports?: number,
        reportsWithoutItems?: number,
        orphanedReports?: any[]
      }
    }
    crudTest: {
      insert: { success?: boolean, error?: string }
      update: { success?: boolean, error?: string }
      delete: { success?: boolean, error?: string }
    }
    summary: {
      tablesOk: boolean
      userDataOk: boolean
      relationshipsOk: boolean
      crudOk: boolean
      allOk: boolean
    }
    timestamp: string
  }
  message: string
}

export function DatabaseVerification() {
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runVerification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/verify-database')
      const data = await response.json()
      
      if (data.success) {
        setVerification(data)
        toast.success('Verificação concluída')
      } else {
        toast.error('Erro na verificação: ' + data.error)
      }
    } catch (error) {
      toast.error('Erro ao executar verificação')
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success?: boolean) => {
    if (success === undefined) return <Info className="h-4 w-4 text-blue-500" />
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (success?: boolean, label: string = '') => {
    if (success === undefined) {
      return <Badge variant="outline">N/A</Badge>
    }
    return success ? 
      <Badge className="bg-green-500">{label || 'OK'}</Badge> : 
      <Badge variant="destructive">{label || 'Erro'}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Verificação de Integridade do Banco de Dados
          </CardTitle>
          <CardDescription>
            Diagnóstico completo das tabelas, dados, relacionamentos e operações CRUD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runVerification}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isLoading ? 'Verificando...' : 'Executar Verificação'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {verification && (
        <>
          {/* Resumo Geral */}
          <Alert variant={verification.verification.summary.allOk ? "default" : "destructive"}>
            {verification.verification.summary.allOk ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              <strong>{verification.message}</strong>
              <br />
              <small>Verificação realizada em: {new Date(verification.verification.timestamp).toLocaleString('pt-BR')}</small>
            </AlertDescription>
          </Alert>

          {/* Status das Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <span className="font-medium">Tabelas</span>
                  </div>
                  {getStatusBadge(verification.verification.summary.tablesOk)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Dados Usuário</span>
                  </div>
                  {getStatusBadge(verification.verification.summary.userDataOk)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    <span className="font-medium">Relacionamentos</span>
                  </div>
                  {getStatusBadge(verification.verification.summary.relationshipsOk)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Operações CRUD</span>
                  </div>
                  {getStatusBadge(verification.verification.summary.crudOk)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes das Tabelas */}
          <Card>
            <CardHeader>
              <CardTitle>Estrutura das Tabelas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(verification.verification.tables).map(([table, info]) => (
                  <div key={table} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(info.success)}
                      <span className="font-medium text-slate-100">{table}</span>
                      {info.error && (
                        <small className="text-red-400">{info.error}</small>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-slate-700 text-slate-200 border-slate-500">
                      {info.count.toLocaleString()} registros
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dados do Usuário Atual */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Usuário Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informações básicas */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.verification.userData.currentUser?.success)}
                    <div>
                      <span className="font-medium text-slate-100">Usuário</span>
                      {verification.verification.userData.currentUser?.name && (
                        <p className="text-sm text-slate-300">
                          {verification.verification.userData.currentUser.name} 
                          ({verification.verification.userData.currentUser.email})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Relatórios */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.verification.userData.reports?.success)}
                    <div>
                      <span className="font-medium text-slate-100">Relatórios</span>
                      <p className="text-sm text-gray-600">
                        {verification.verification.userData.reports?.count || 0} relatórios encontrados
                      </p>
                    </div>
                  </div>
                  <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                </div>

                {/* Configurações */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.verification.userData.settings?.success)}
                    <div>
                      <span className="font-medium text-slate-100">Configurações</span>
                      <p className="text-sm text-gray-600">
                        {verification.verification.userData.settings?.count || 0} configurações
                        {verification.verification.userData.settings?.keys?.length && verification.verification.userData.settings.keys.length > 0 && (
                          <span> ({verification.verification.userData.settings.keys.join(', ')})</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Settings className="h-5 w-5 text-purple-500" />
                </div>

                {/* Último processamento */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.verification.userData.lastProcessing?.success)}
                    <div>
                      <span className="font-medium text-slate-100">Último Processamento</span>
                      <p className="text-sm text-gray-600">
                        {verification.verification.userData.lastProcessing?.count || 0} registros
                      </p>
                    </div>
                  </div>
                  <RefreshCw className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teste CRUD */}
          <Card>
            <CardHeader>
              <CardTitle>Teste de Operações CRUD</CardTitle>
              <CardDescription>
                Teste de INSERT, UPDATE e DELETE na tabela user_settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                  {getStatusIcon(verification.verification.crudTest.insert?.success)}
                  <div>
                    <span className="font-medium text-slate-100">INSERT</span>
                    {verification.verification.crudTest.insert?.error && (
                      <p className="text-sm text-red-600">
                        {verification.verification.crudTest.insert.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                  {getStatusIcon(verification.verification.crudTest.update?.success)}
                  <div>
                    <span className="font-medium text-slate-100">UPDATE</span>
                    {verification.verification.crudTest.update?.error && (
                      <p className="text-sm text-red-600">
                        {verification.verification.crudTest.update.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                  {getStatusIcon(verification.verification.crudTest.delete?.success)}
                  <div>
                    <span className="font-medium text-slate-100">DELETE</span>
                    {verification.verification.crudTest.delete?.error && (
                      <p className="text-sm text-red-600">
                        {verification.verification.crudTest.delete.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relacionamentos */}
          {verification.verification.relationships?.reportsItems && (
            <Card>
              <CardHeader>
                <CardTitle>Integridade dos Relacionamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(verification.verification.relationships.reportsItems?.success)}
                      <div>
                        <span className="font-medium text-slate-100">Relatórios → Itens</span>
                        <p className="text-sm text-slate-300">
                          {verification.verification.relationships.reportsItems?.totalReports || 0} relatórios,
                          {' '}{verification.verification.relationships.reportsItems?.reportsWithoutItems || 0} sem itens
                        </p>
                      </div>
                    </div>
                  </div>

                  {verification.verification.relationships.reportsItems?.orphanedReports?.length && verification.verification.relationships.reportsItems.orphanedReports.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Relatórios sem itens encontrados:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {verification.verification.relationships.reportsItems?.orphanedReports?.map((report: any) => (
                            <li key={report.id} className="text-sm">
                              {report.title} (ID: {report.id})
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}