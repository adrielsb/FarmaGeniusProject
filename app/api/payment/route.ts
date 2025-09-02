import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kiwifyService } from '@/lib/kiwify'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, description, planType } = body

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: amount, description' },
        { status: 400 }
      )
    }

    // Criar pagamento no Kiwify
    const payment = await kiwifyService.createPayment({
      amount: parseFloat(amount),
      description,
      customer_email: session.user.email!,
      customer_name: session.user.name!,
      redirect_url: `${process.env.NEXTAUTH_URL}/payment/success?plan=${planType}`
    })

    return NextResponse.json({
      success: true,
      data: payment
    })

  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento obrigatório' },
        { status: 400 }
      )
    }

    // Consultar status do pagamento
    const paymentStatus = await kiwifyService.getPaymentStatus(paymentId)

    return NextResponse.json({
      success: true,
      data: paymentStatus
    })

  } catch (error: any) {
    console.error('Erro ao consultar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}