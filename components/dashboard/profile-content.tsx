
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  User, 
  Activity, 
  BarChart3,
  Clock,
  FileText,
  Save,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from "lucide-react"
import { DashboardHeader } from "./dashboard-header"
import { useDebounce } from "@/hooks/use-debounce"
import { ProfileFormData, PasswordFormData, UserStats } from "@/lib/validations"

interface ProfileContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
}

interface Activity {
  action: string
  details: string
  createdAt: string
}

export function ProfileContent({ user }: ProfileContentProps) {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)

  // Estados do formulário com validação
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: user?.name || "",
    email: user?.email || ""
  })

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])

  // Debounce para validação em tempo real
  const debouncedProfileForm = useDebounce(profileForm, 500)

  // Validação em tempo real do perfil
  useEffect(() => {
    if (debouncedProfileForm.name || debouncedProfileForm.email) {
      const errors: Record<string, string> = {}
      
      if (debouncedProfileForm.name && debouncedProfileForm.name.length > 100) {
        errors.name = "Nome muito longo (máximo 100 caracteres)"
      }
      
      if (debouncedProfileForm.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(debouncedProfileForm.email)) {
          errors.email = "Email inválido"
        }
      }
      
      setProfileErrors(errors)
    }
  }, [debouncedProfileForm])

  // Carregar dados
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const response = await fetch("/api/user/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else if (response.status === 429) {
          toast.error("Muitas requisições. Tente novamente em alguns segundos.")
        } else {
          toast.error("Erro ao carregar estatísticas")
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
        toast.error("Erro ao carregar estatísticas")
      } finally {
        setStatsLoading(false)
      }
    }

    const loadActivity = async () => {
      try {
        setActivityLoading(true)
        const response = await fetch("/api/user/activity")
        if (response.ok) {
          const data = await response.json()
          setRecentActivity(data)
        } else {
          toast.error("Erro ao carregar atividades")
        }
      } catch (error) {
        console.error("Erro ao carregar atividades:", error)
        toast.error("Erro ao carregar atividades")
      } finally {
        setActivityLoading(false)
      }
    }

    loadStats()
    loadActivity()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      })

      if (response.ok) {
        await update({ 
          ...session, 
          user: { 
            ...session?.user, 
            name: profileForm.name,
            email: profileForm.email
          } 
        })
        toast.success("Perfil atualizado com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao atualizar perfil")
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push("Mínimo 8 caracteres")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Uma letra maiúscula")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Uma letra minúscula")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Um número")
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Um caractere especial")
    }
    
    return errors
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações no frontend
    const errors: Record<string, string> = {}
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Senha atual é obrigatória"
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = "Nova senha é obrigatória"
    } else {
      const passwordValidationErrors = validatePassword(passwordForm.newPassword)
      if (passwordValidationErrors.length > 0) {
        errors.newPassword = `Nova senha deve ter: ${passwordValidationErrors.join(", ")}`
      }
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Senhas não coincidem"
    }
    
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = "A nova senha deve ser diferente da atual"
    }

    setPasswordErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsPasswordLoading(true)

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm)
      })

      if (response.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        setPasswordErrors({})
        toast.success("Senha alterada com sucesso!")
      } else {
        const errorData = await response.json()
        if (response.status === 429) {
          toast.error("Muitas tentativas. Aguarde alguns minutos.")
        } else {
          toast.error(errorData.error || "Erro ao alterar senha")
        }
      }
    } catch (error) {
      toast.error("Erro de conexão. Tente novamente.")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não disponível"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardHeader user={session?.user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
          <p className="text-slate-400">Gerencie suas informações pessoais e configurações de conta</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informações Básicas */}
              <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="required">Nome Completo</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        className={`bg-slate-700 border-slate-600 text-white ${
                          profileErrors.name ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-describedby={profileErrors.name ? 'name-error' : undefined}
                        maxLength={100}
                      />
                      {profileErrors.name && (
                        <div id="name-error" className="flex items-center gap-1 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {profileErrors.name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="required">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        className={`bg-slate-700 border-slate-600 text-white ${
                          profileErrors.email ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-describedby={profileErrors.email ? 'email-error' : undefined}
                      />
                      {profileErrors.email && (
                        <div id="email-error" className="flex items-center gap-1 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {profileErrors.email}
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isLoading || Object.keys(profileErrors).length > 0}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Avatar e Estatísticas Rápidas */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Perfil</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <Avatar className="h-20 w-20 mx-auto">
                    <AvatarFallback className="bg-blue-600 text-white text-xl">
                      {user?.name?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="text-white font-semibold">{user?.name || "Usuário"}</h3>
                    <p className="text-slate-400 text-sm">{user?.email}</p>
                  </div>

                  <div className="space-y-3 pt-4">
                    {statsLoading ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Relatórios processados:</span>
                          <div className="h-5 w-8 bg-slate-600 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Conta criada em:</span>
                          <div className="h-4 w-20 bg-slate-600 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Último acesso:</span>
                          <div className="h-4 w-20 bg-slate-600 rounded animate-pulse"></div>
                        </div>
                      </>
                    ) : stats ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Relatórios processados:</span>
                          <Badge variant="secondary">{stats.totalReports}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Conta criada em:</span>
                          <span className="text-white">{formatDate(stats.accountCreated)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Último acesso:</span>
                          <span className="text-white">{formatDate(stats.lastLogin)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-slate-400 text-sm">
                        Erro ao carregar estatísticas
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Total de Relatórios
                  </CardTitle>
                  <FileText className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-slate-600 rounded animate-pulse"></div>
                    ) : (
                      stats?.totalReports || 0
                    )}
                  </div>
                  <p className="text-xs text-slate-400">processados até agora</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Tempo Total
                  </CardTitle>
                  <Clock className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? (
                      <div className="h-8 w-20 bg-slate-600 rounded animate-pulse"></div>
                    ) : (
                      formatTime(stats?.totalProcessingTime || 0)
                    )}
                  </div>
                  <p className="text-xs text-slate-400">de processamento</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Status da Conta
                  </CardTitle>
                  <Activity className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">Ativa</div>
                  <p className="text-xs text-slate-400">funcionando normalmente</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="required">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          currentPassword: e.target.value
                        }))}
                        className={`bg-slate-700 border-slate-600 text-white pr-10 ${
                          passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-describedby={passwordErrors.currentPassword ? 'current-password-error' : undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <div id="current-password-error" className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {passwordErrors.currentPassword}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="required">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          newPassword: e.target.value
                        }))}
                        className={`bg-slate-700 border-slate-600 text-white pr-10 ${
                          passwordErrors.newPassword ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-describedby={passwordErrors.newPassword ? 'new-password-error' : 'password-requirements'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.newPassword ? (
                      <div id="new-password-error" className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {passwordErrors.newPassword}
                      </div>
                    ) : (
                      <div id="password-requirements" className="text-xs text-slate-400 space-y-1">
                        <p>A senha deve conter:</p>
                        <ul className="list-disc list-inside ml-2">
                          <li>Mínimo 8 caracteres</li>
                          <li>Uma letra maiúscula</li>
                          <li>Uma letra minúscula</li>
                          <li>Um número</li>
                          <li>Um caractere especial</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="required">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          confirmPassword: e.target.value
                        }))}
                        className={`bg-slate-700 border-slate-600 text-white pr-10 ${
                          passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        aria-describedby={passwordErrors.confirmPassword ? 'confirm-password-error' : undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <div id="confirm-password-error" className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {passwordErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isPasswordLoading || Object.keys(passwordErrors).length > 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isPasswordLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      "Alterar Senha"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  Suas últimas ações no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    Nenhuma atividade recente encontrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-slate-700 rounded-lg">
                        <div className="flex-shrink-0">
                          <BarChart3 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{activity.action}</p>
                          <p className="text-slate-400 text-sm">{activity.details}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="text-xs text-slate-400">
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
