interface KiwifyConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
  accountId: string
}

interface KiwifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PaymentData {
  amount: number
  description: string
  customer_email: string
  customer_name: string
  redirect_url?: string
}

class KiwifyService {
  private config: KiwifyConfig
  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  constructor() {
    this.config = {
      baseUrl: 'https://public-api.kiwify.com',
      clientId: '619da537-7eff-4cdb-aa8f-719a85965aac',
      clientSecret: 'a930a793df1436ccc7c600899f66521e5cf228aaa232306f0542a94a625a9eff',
      accountId: 'm98P6JzHbeYwII0'
    }
  }

  private async getAccessToken(): Promise<string> {
    // Verifica se o token ainda é válido
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials'
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ao obter token: ${response.statusText}`)
      }

      const data: KiwifyTokenResponse = await response.json()
      
      this.accessToken = data.access_token
      // Define expiração com margem de segurança (5 minutos antes)
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

      return this.accessToken
    } catch (error) {
      console.error('Erro ao autenticar com Kiwify:', error)
      throw new Error('Falha na autenticação com Kiwify')
    }
  }

  async createPayment(paymentData: PaymentData) {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.config.baseUrl}/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          account_id: this.config.accountId,
          amount: paymentData.amount,
          description: paymentData.description,
          customer: {
            email: paymentData.customer_email,
            name: paymentData.customer_name
          },
          redirect_url: paymentData.redirect_url || `${process.env.NEXTAUTH_URL}/payment/success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Erro ao criar pagamento: ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      throw error
    }
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.config.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao consultar pagamento: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao consultar status do pagamento:', error)
      throw error
    }
  }
}

export const kiwifyService = new KiwifyService()