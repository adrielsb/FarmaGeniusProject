"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  const handleRetry = () => {
    router.push('/auth/login')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            <XCircle className="h-6 w-6 text-red-600" />
            <span>Pagamento Cancelado</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Seu pagamento foi cancelado. Não se preocupe, nenhum valor foi cobrado.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                💡 Você pode tentar novamente a qualquer momento
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                💡 Em caso de dúvidas, entre em contato conosco
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button onClick={handleRetry} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                Voltar ao Início
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}