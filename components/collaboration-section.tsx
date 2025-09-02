"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  Coffee, 
  Star, 
  CreditCard, 
  Loader2,
  CheckCircle,
  Info,
  Crown,
  Building
} from 'lucide-react'

interface CollaborationSectionProps {
  className?: string
}

export function CollaborationSection({ className }: CollaborationSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showPlans, setShowPlans] = useState(false)

  const collaborationPlans = [
    {
      id: 'coffee',
      name: 'Cafezinho',
      price: 10.00,
      description: 'Contribuição simbólica',
      icon: Coffee,
      color: 'bg-amber-500',
      popular: false,
      paymentUrl: 'https://pay.kiwify.com.br/sDEMeXh'
    },
    {
      id: 'supporter',
      name: 'Apoiador',
      price: 50.00,
      description: 'Ajude no desenvolvimento de novas funcionalidades',
      icon: Heart,
      color: 'bg-pink-500',
      popular: true,
      paymentUrl: 'https://pay.kiwify.com.br/iBpGuqB'
    },
    {
      id: 'sponsor',
      name: 'Patrocinador',
      price: 100.00,
      description: 'Funcionalidades avançadas',
      icon: Star,
      color: 'bg-purple-500',
      popular: false,
      paymentUrl: 'https://pay.kiwify.com.br/ype79ET'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 200.00,
      description: 'Suporte premium',
      icon: Crown,
      color: 'bg-indigo-500',
      popular: false,
      paymentUrl: 'https://pay.kiwify.com.br/zDXHj86'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 300.00,
      description: 'Apoio empresarial',
      icon: Building,
      color: 'bg-gray-800',
      popular: false,
      paymentUrl: 'https://pay.kiwify.com.br/Xcx0EJq'
    }
  ]

  const handleCollaboration = (planId: string, paymentUrl: string) => {
    setIsProcessing(true)
    setSelectedPlan(planId)
    
    // Redirecionar diretamente para o link de pagamento do Kiwify
    window.open(paymentUrl, '_blank')
    
    // Reset do estado após um breve delay
    setTimeout(() => {
      setIsProcessing(false)
      setSelectedPlan(null)
    }, 1500)
  }

  if (!showPlans) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span>Colabore com o Projeto</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Ajude a manter e evoluir o FarmaGenius
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Sua colaboração é fundamental para manter este projeto gratuito e em constante evolução. 
              Todas as contribuições são usadas para melhorias e novas funcionalidades.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => setShowPlans(true)}
            className="w-full"
            variant="default"
          >
            <Heart className="h-4 w-4 mr-2" />
            Colaborar Agora
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <span>Escolha seu Plano de Colaboração</span>
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowPlans(false)}
          className="mt-2"
        >
          ← Voltar
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-2 max-h-80 overflow-y-auto">
          {collaborationPlans.map((plan) => {
            const IconComponent = plan.icon
            const isSelected = selectedPlan === plan.id
            const isCurrentlyProcessing = isProcessing && isSelected

            return (
              <div
                key={plan.id}
                className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5"
                  >
                    Popular
                  </Badge>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-full ${plan.color} text-white`}>
                      <IconComponent className="h-3 w-3" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs">{plan.name}</h4>
                      <p className="text-xs text-gray-600 leading-tight">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span className="font-bold text-green-600 text-xs">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleCollaboration(plan.id, plan.paymentUrl)}
                      disabled={isProcessing}
                      className={`h-7 px-2 text-xs ${isCurrentlyProcessing ? 'bg-gray-400' : ''}`}
                    >
                      {isCurrentlyProcessing ? (
                        <>
                          <Loader2 className="h-2 w-2 mr-1 animate-spin" />
                          <span className="text-xs">Abrindo...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-2 w-2 mr-1" />
                          <span className="text-xs">Colaborar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <CheckCircle className="h-3 w-3" />
            <span>Pagamento seguro via Kiwify</span>
          </div>
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <CheckCircle className="h-3 w-3" />
            <span>Processamento instantâneo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}