"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const plan = searchParams.get('plan')
  const paymentId = searchParams.get('payment_id')

  useEffect(() => {
    // Simular verificação do pagamento
    const verifyPayment = async () => {
      try {
        if (paymentId) {
          const response = await fetch(`/api/payment?id=${paymentId}`)
          const result = await response.json()
          
          if (!response.ok) {
            throw new Error(result.error || 'Erro ao verificar pagamento')
          }
          
          // Aqui você pode processar o resultado e atualizar o plano do usuário
          console.log('Status do pagamento:', result.data)
        }
        
        setIsLoading(false)
      } catch (error: any) {
        console.error('Erro ao verificar pagamento:', error)
        setError(error.message)
        setIsLoading(false)
      }
    }

    const timer = setTimeout(verifyPayment, 2000) // Aguarda 2s para verificar
    return () => clearTimeout(timer)
  }, [paymentId])

  const handleContinue = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 text-center">
                Verificando seu pagamento...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Erro na Verificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">{error}</p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => router.push('/')}>
                  Voltar ao Início
                </Button>
                <Button onClick={handleContinue}>
                  Ir para Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Pagamento Aprovado!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Obrigado por colaborar com o projeto FarmaGenius!
              </p>
              {plan && (
                <p className="text-sm font-medium text-blue-600 mt-2">
                  Plano ativado: {plan}
                </p>
              )}
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ Pagamento processado com sucesso
              </p>
              <p className="text-sm text-green-800 mt-1">
                ✅ Acesso ao sistema liberado
              </p>
            </div>

            <Button onClick={handleContinue} className="w-full">
              Continuar para o Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 text-center">
                Carregando...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}