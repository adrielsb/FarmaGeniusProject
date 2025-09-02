"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react'

interface TestResult {
  connectionInfo: any
  hasAdmin: boolean
  tests: {
    [key: string]: {
      success: boolean
      count?: number
      error?: string | null
      latestRecord?: any
    }
  }
}

export function DatabaseTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-db', {
        method: 'GET'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao executar testes')
      }

      setTestResult(result.data)
    } catch (error: any) {
      setError(error.message || 'Erro interno')
      console.error('Erro nos testes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "secondary" : "destructive"}>
        {success ? "✓ OK" : "✗ ERRO"}
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Teste de Conectividade do Banco de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Executando Testes...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Executar Testes de Conectividade
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Informações da Conexão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <strong>URL:</strong> {testResult.connectionInfo.url}
                  </div>
                  <div className="text-sm">
                    <strong>Project ID:</strong> {testResult.connectionInfo.projectId}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm">Admin Client:</strong>
                    {getStatusBadge(testResult.hasAdmin)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resumo dos Testes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(testResult.tests).map(([testName, result]) => (
                      <div key={testName} className="flex items-center gap-1">
                        {getStatusIcon(result.success)}
                        <span className="text-sm capitalize">{testName}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Detalhes dos Testes</h3>
              
              {Object.entries(testResult.tests).map(([testName, result]) => (
                <Card key={testName} className={result.success ? 'border-green-200' : 'border-red-200'}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        {testName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {getStatusBadge(result.success)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {result.count !== undefined && (
                        <div><strong>Registros encontrados:</strong> {result.count}</div>
                      )}
                      {result.error && (
                        <div className="text-red-600">
                          <strong>Erro:</strong> {result.error}
                        </div>
                      )}
                      {result.latestRecord && (
                        <div>
                          <strong>Último registro:</strong>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(result.latestRecord, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}