import { NextRequest, NextResponse } from 'next/server'
import { kiwifyService } from '@/lib/kiwify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, description, planType, customer } = body

    if (!amount || !description || !customer) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: amount, description, customer' },
        { status: 400 }
      )
    }

    // Criar pagamento no Kiwify para colaboração pública
    const payment = await kiwifyService.createPayment({
      amount: parseFloat(amount),
      description: `${description} - Colaboração FarmaGenius`,
      customer_email: customer.email,
      customer_name: customer.name,
      redirect_url: `${process.env.NEXTAUTH_URL}/payment/success?plan=${planType}&type=collaboration`
    })

    return NextResponse.json({
      success: true,
      data: payment
    })

  } catch (error: any) {
    console.error('Erro ao criar pagamento público:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}