
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Settings, 
  Database, 
  Bell, 
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Save,
  RefreshCw
} from "lucide-react"
import { DashboardHeader } from "./dashboard-header"

interface SettingsContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
}

export function SettingsContent({ user }: SettingsContentProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [mappings, setMappings] = useState<any[]>([])
  const [selectedMapping, setSelectedMapping] = useState<any>(null)
  const [showNewMappingForm, setShowNewMappingForm] = useState(false)

  // Estados das configurações
  const [settings, setSettings] = useState({
    notifications: {
      emailProcessingComplete: true,
      emailWeeklyReport: false,
      pushNotifications: true
    },
    processing: {
      autoBackup: true,
      dataRetentionDays: 90,
      defaultExportFormat: "xlsx"
    },
    display: {
      darkMode: true,
      showAdvancedOptions: false,
      itemsPerPage: 10
    }
  })

  const [newMapping, setNewMapping] = useState({
    name: "",
    description: "",
    mappingData: ""
  })

  // Carregar configurações e mapeamentos
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/user/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
      }
    }

    const loadMappings = async () => {
      try {
        const response = await fetch("/api/mappings")
        if (response.ok) {
          const data = await response.json()
          setMappings(data)
        }
      } catch (error) {
        console.error("Erro ao carregar mapeamentos:", error)
      }
    }

    loadSettings()
    loadMappings()
  }, [])

  const handleSettingsUpdate = async (section: string, newSettings: any) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          settings: newSettings
        })
      })

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          [section]: newSettings
        }))
        toast.success("Configurações salvas com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao salvar configurações")
      }
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar JSON
      const parsedMapping = JSON.parse(newMapping.mappingData)
      
      const response = await fetch("/api/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMapping.name,
          description: newMapping.description,
          mappingData: parsedMapping
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMappings(prev => [...prev, data])
        setNewMapping({ name: "", description: "", mappingData: "" })
        setShowNewMappingForm(false)
        toast.success("Mapeamento criado com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao criar mapeamento")
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("JSON inválido no mapeamento")
      } else {
        toast.error("Erro ao criar mapeamento")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este mapeamento?")) return

    try {
      const response = await fetch(`/api/mappings/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setMappings(prev => prev.filter((m: any) => m.id !== id))
        toast.success("Mapeamento excluído com sucesso!")
      } else {
        toast.error("Erro ao excluir mapeamento")
      }
    } catch (error) {
      toast.error("Erro ao excluir mapeamento")
    }
  }

  const handleSetDefaultMapping = async (id: string) => {
    try {
      const response = await fetch(`/api/mappings/${id}/default`, {
        method: "PUT"
      })

      if (response.ok) {
        setMappings(prev => prev.map((m: any) => ({
          ...m,
          isDefault: m.id === id
        })))
        toast.success("Mapeamento padrão atualizado!")
      } else {
        toast.error("Erro ao definir mapeamento padrão")
      }
    } catch (error) {
      toast.error("Erro ao definir mapeamento padrão")
    }
  }

  const defaultMappingTemplate = `{
  "CAPSULAS": "CAPSULAS",
  "CAPSULAS GASTRO": "CAPSULAS GASTRO", 
  "CAPSULAS PRONTAS": "CAPSULAS PRONTAS",
  "SACHES": "SACHES",
  "MATERIA PRIMA": "MATERIA PRIMA",
  "LOCAO CAPILAR": "LOÇÃO CAPILAR, LOÇÃO CAPILAR Ñ ALCOOLICA",
  "HOMEOPATIA": "HOMEOPATIA, FLORAL E VEICULO",
  "GEL TRANSDERMICO": "GEL TRANSDERMICO, GEL VAGINAL",
  "CREME": "CREME, HYDRA FRESH, SECOND SKIN, CREME CRODA, CREME NÃO IONICO, CREME OIL FREE, CREME AREA DOS OLHOS, CREME CELULITE, LOÇÃO, LOÇÃO CREMOSA, LOÇÃO CRODA, LOÇÃO NÃO IONICA, LOÇÃO OIL FREE, POMADA"
}`

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardHeader user={session?.user} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-slate-400">Personalize o sistema de acordo com suas necessidades</p>
        </div>

        <Tabs defaultValue="mappings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="processing">Processamento</TabsTrigger>
            <TabsTrigger value="display">Interface</TabsTrigger>
          </TabsList>

          <TabsContent value="mappings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">Mapeamentos</h3>
                <p className="text-slate-400">Gerencie os mapeamentos de formas farmacêuticas</p>
              </div>
              <Button 
                onClick={() => setShowNewMappingForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Mapeamento
              </Button>
            </div>

            {showNewMappingForm && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Criar Novo Mapeamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateMapping} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mapping-name">Nome</Label>
                        <Input
                          id="mapping-name"
                          value={newMapping.name}
                          onChange={(e) => setNewMapping(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mapping-description">Descrição</Label>
                        <Input
                          id="mapping-description"
                          value={newMapping.description}
                          onChange={(e) => setNewMapping(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mapping-data">Dados do Mapeamento (JSON)</Label>
                      <Textarea
                        id="mapping-data"
                        value={newMapping.mappingData}
                        onChange={(e) => setNewMapping(prev => ({ ...prev, mappingData: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white font-mono text-sm min-h-[200px]"
                        placeholder={defaultMappingTemplate}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewMappingForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
              {mappings.map((mapping: any) => (
                <Card key={mapping.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          {mapping.name}
                          {mapping.isDefault && (
                            <Badge className="bg-blue-600">Padrão</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {mapping.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        {!mapping.isDefault && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefaultMapping(mapping.id)}
                          >
                            Definir como Padrão
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMapping(mapping)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMapping(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-400">
                      Criado em: {new Date(mapping.createdAt).toLocaleDateString("pt-BR")}
                      <br />
                      Última atualização: {new Date(mapping.updatedAt).toLocaleDateString("pt-BR")}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {mappings.length === 0 && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="text-center py-8">
                    <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">Nenhum mapeamento encontrado</p>
                    <Button 
                      onClick={() => setShowNewMappingForm(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Criar Primeiro Mapeamento
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configurações de Notificação
                </CardTitle>
                <CardDescription>
                  Escolha como e quando deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-white">Email - Processamento Concluído</Label>
                    <p className="text-sm text-slate-400">
                      Receba um email quando o processamento dos arquivos for finalizado
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailProcessingComplete}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate("notifications", {
                        ...settings.notifications,
                        emailProcessingComplete: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-white">Email - Relatório Semanal</Label>
                    <p className="text-sm text-slate-400">
                      Receba um resumo semanal das suas atividades
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailWeeklyReport}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate("notifications", {
                        ...settings.notifications,
                        emailWeeklyReport: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-white">Notificações Push</Label>
                    <p className="text-sm text-slate-400">
                      Receba notificações no navegador
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate("notifications", {
                        ...settings.notifications,
                        pushNotifications: checked
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processing" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Processamento
                </CardTitle>
                <CardDescription>
                  Configure como os dados são processados e armazenados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-white">Backup Automático</Label>
                    <p className="text-sm text-slate-400">
                      Fazer backup automático dos relatórios processados
                    </p>
                  </div>
                  <Switch
                    checked={settings.processing.autoBackup}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate("processing", {
                        ...settings.processing,
                        autoBackup: checked
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Retenção de Dados (dias)</Label>
                  <Input
                    type="number"
                    value={settings.processing.dataRetentionDays}
                    onChange={(e) => 
                      handleSettingsUpdate("processing", {
                        ...settings.processing,
                        dataRetentionDays: parseInt(e.target.value) || 90
                      })
                    }
                    className="bg-slate-700 border-slate-600 text-white max-w-[200px]"
                  />
                  <p className="text-sm text-slate-400">
                    Por quantos dias manter os dados históricos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Formato de Exportação Padrão</Label>
                  <select
                    value={settings.processing.defaultExportFormat}
                    onChange={(e) => 
                      handleSettingsUpdate("processing", {
                        ...settings.processing,
                        defaultExportFormat: e.target.value
                      })
                    }
                    className="bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 max-w-[200px]"
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Configurações de Interface</CardTitle>
                <CardDescription>
                  Personalize a aparência e comportamento da interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-white">Mostrar Opções Avançadas</Label>
                    <p className="text-sm text-slate-400">
                      Exibir configurações avançadas por padrão
                    </p>
                  </div>
                  <Switch
                    checked={settings.display.showAdvancedOptions}
                    onCheckedChange={(checked) => 
                      handleSettingsUpdate("display", {
                        ...settings.display,
                        showAdvancedOptions: checked
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Itens por Página</Label>
                  <select
                    value={settings.display.itemsPerPage}
                    onChange={(e) => 
                      handleSettingsUpdate("display", {
                        ...settings.display,
                        itemsPerPage: parseInt(e.target.value)
                      })
                    }
                    className="bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 max-w-[200px]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
