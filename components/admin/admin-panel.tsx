"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  Users,
  Database,
  Key,
  Save,
  Loader2,
  Trash2,
  TestTube,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Sun,
  Moon,
  Upload,
  Download,
  Tag,
  Palette,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { SystemSettings } from "@/lib/types"
import { useTheme } from "@/hooks/use-theme"
import { useAutoBackup } from "@/hooks/use-auto-backup"
import { getCurrentUser } from "@/lib/auth"
import ClientTagManager from "./client-tag-manager"
import SystemMonitor from "./system-monitor"

interface UserData {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

export default function AdminPanel() {
  const { theme, toggleTheme, mounted } = useTheme()
  const { exportFullBackup, importBackup } = useAutoBackup()
  const [settings, setSettings] = useState<SystemSettings[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [appTitle, setAppTitle] = useState("Resumo Beta")
  const [appDescription, setAppDescription] = useState("Gerencie suas tarefas e gere resumos para daily meetings")
  const [openaiKey, setOpenaiKey] = useState("")
  const [openaiModel, setOpenaiModel] = useState("gpt-4o")
  const [primaryColor, setPrimaryColor] = useState("#3B82F6")
  const [accentColor, setAccentColor] = useState("#10B981")
  const [logoUrl, setLogoUrl] = useState("")
  const [favicon, setFavicon] = useState("")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; testResponse?: string } | null>(
    null,
  )
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [creatingUser, setCreatingUser] = useState(false)
  const { toast } = useToast()

  // Verificar se o usuário atual é o super admin
  const currentUser = getCurrentUser()
  const isSuperAdmin = currentUser?.email === "carlos.oldenburg@videosoft.com.br"

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar configurações
      try {
        const settingsResponse = await fetch("/api/admin/settings", {
          headers: { Accept: "application/json" },
        })

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings(settingsData)

          // Extrair configurações específicas
          const titleSetting = settingsData.find((s: SystemSettings) => s.key === "app_name")
          const descriptionSetting = settingsData.find((s: SystemSettings) => s.key === "app_description")
          const keySetting = settingsData.find((s: SystemSettings) => s.key === "openai_api_key")
          const modelSetting = settingsData.find((s: SystemSettings) => s.key === "openai_model")
          const primaryColorSetting = settingsData.find((s: SystemSettings) => s.key === "primary_color")
          const accentColorSetting = settingsData.find((s: SystemSettings) => s.key === "accent_color")
          const logoSetting = settingsData.find((s: SystemSettings) => s.key === "logo_url")
          const faviconSetting = settingsData.find((s: SystemSettings) => s.key === "favicon_url")

          if (titleSetting) setAppTitle(titleSetting.value)
          if (descriptionSetting) setAppDescription(descriptionSetting.value)
          if (keySetting) setOpenaiKey(keySetting.value)
          if (modelSetting) setOpenaiModel(modelSetting.value)
          if (primaryColorSetting) setPrimaryColor(primaryColorSetting.value)
          if (accentColorSetting) setAccentColor(accentColorSetting.value)
          if (logoSetting) setLogoUrl(logoSetting.value)
          if (faviconSetting) setFavicon(faviconSetting.value)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      }

      // Buscar usuários (apenas para super admin)
      if (isSuperAdmin) {
        try {
          const usersResponse = await fetch("/api/admin/users", {
            headers: { Accept: "application/json" },
          })

          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            setUsers(usersData)
          }
        } catch (error) {
          console.error("Error fetching users:", error)
        }
      }
    } catch (error) {
      console.error("General error in fetchData:", error)
      toast({
        title: "Aviso",
        description: "Alguns dados podem não estar disponíveis no momento",
        variant: "default",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast({
        title: "❌ Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    try {
      setCreatingUser(true)

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          role: "user",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar usuário")
      }

      toast({
        title: "✅ Sucesso",
        description: `Usuário ${newUserName} criado com sucesso!`,
        duration: 5000,
      })

      // Limpar formulário
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserName("")

      // Recarregar lista de usuários
      fetchData()
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message || "Não foi possível criar o usuário",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setCreatingUser(false)
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving(true)
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })

      if (!response.ok) throw new Error("Failed to update setting")

      setSettings(settings.map((s) => (s.key === key ? { ...s, value } : s)))

      return true
    } catch (error) {
      throw error
    } finally {
      setSaving(false)
    }
  }

  const updateAppConfig = async () => {
    try {
      setSaving(true)

      await updateSetting("app_name", appTitle)
      await updateSetting("app_description", appDescription)

      toast({
        title: "✅ Sucesso",
        description: "Configurações da aplicação atualizadas com sucesso!",
        duration: 5000,
      })

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível atualizar as configurações",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const updateThemeConfig = async () => {
    try {
      setSaving(true)

      await updateSetting("primary_color", primaryColor)
      await updateSetting("accent_color", accentColor)
      await updateSetting("logo_url", logoUrl)
      await updateSetting("favicon_url", favicon)

      document.documentElement.style.setProperty("--primary", primaryColor)
      document.documentElement.style.setProperty("--accent", accentColor)

      toast({
        title: "✅ Sucesso",
        description: "Tema personalizado aplicado com sucesso!",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível atualizar o tema",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const updateOpenAIConfig = async () => {
    try {
      setSaving(true)
      setTestResult(null)

      if (openaiKey && !openaiKey.startsWith("sk-")) {
        toast({
          title: "❌ Erro",
          description: "Formato da chave inválido. A chave deve começar com 'sk-'",
          variant: "destructive",
          duration: 5000,
        })
        return
      }

      await updateSetting("openai_api_key", openaiKey)
      await updateSetting("openai_model", openaiModel)

      toast({
        title: "✅ Sucesso",
        description: "Configurações da OpenAI salvas com sucesso",
        duration: 5000,
      })

      if (openaiKey.trim()) {
        setTimeout(() => testOpenAIConnection(), 500)
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const testOpenAIConnection = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      const response = await fetch("/api/admin/test-openai", {
        method: "POST",
      })

      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast({
          title: "✅ Sucesso",
          description: result.message,
          duration: 5000,
        })
      } else {
        toast({
          title: "❌ Erro na Integração",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "❌ Erro de conexão com o servidor",
      })
      toast({
        title: "❌ Erro",
        description: "Não foi possível testar a conexão",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setTesting(false)
    }
  }

  const clearAllData = async () => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Tem certeza que deseja apagar TODOS os dados? Isso incluirá:\n\n• Histórico de resumos\n• Todas as tarefas\n• Configurações personalizadas\n\nEsta ação NÃO PODE ser desfeita!",
      )
    ) {
      return
    }

    if (!confirm("🚨 ÚLTIMA CONFIRMAÇÃO: Todos os dados serão perdidos permanentemente. Continuar?")) {
      return
    }

    try {
      setClearing(true)

      const summariesResponse = await fetch("/api/admin/clear-history", {
        method: "DELETE",
      })

      const tasksResponse = await fetch("/api/admin/clear-tasks", {
        method: "DELETE",
      })

      if (!summariesResponse.ok || !tasksResponse.ok) {
        throw new Error("Failed to clear all data")
      }

      toast({
        title: "✅ Sucesso",
        description: "Todos os dados foram apagados com sucesso",
        duration: 5000,
      })

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível apagar todos os dados",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setClearing(false)
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })

      if (!response.ok) throw new Error("Failed to update user role")

      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)))

      toast({
        title: "✅ Sucesso",
        description: "Papel do usuário atualizado com sucesso",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível atualizar o papel do usuário",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === "carlos.oldenburg@videosoft.com.br") {
      toast({
        title: "❌ Erro",
        description: "Não é possível deletar o usuário super admin",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    if (!confirm(`Tem certeza que deseja deletar o usuário ${userEmail}?`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to delete user")

      setUsers(users.filter((u) => u.id !== userId))

      toast({
        title: "✅ Sucesso",
        description: "Usuário deletado com sucesso",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível deletar o usuário",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const refreshPage = () => {
    setRefreshing(true)
    window.location.reload()
  }

  const getLastSyncTime = () => {
    if (typeof window === "undefined") return "Nunca"
    return localStorage.getItem("qa-manager-last-sync") || "Nunca"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie configurações do sistema e usuários</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{isSuperAdmin ? "Super Admin" : "Admin"}</Badge>
          <Button onClick={refreshPage} variant="outline" size="sm" disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList className={`grid w-full ${isSuperAdmin ? "grid-cols-6" : "grid-cols-5"}`}>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Dados & Setup</span>
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Aplicação</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Tema</span>
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>OpenAI</span>
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="clients" className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Clientes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <SystemMonitor />

          {/* Backup e Sincronização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Backup e Sincronização
              </CardTitle>
              <CardDescription>Exporte e importe seus dados para sincronizar entre dispositivos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>💡 Como funciona:</strong> Seus dados são automaticamente salvos localmente. Use o backup para
                  sincronizar entre dispositivos ou como segurança.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Exportar Backup Completo</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Baixe todos os seus dados em formato JSON</p>
                  <Button onClick={exportFullBackup} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Backup
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Importar Backup</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restaure dados de um arquivo de backup</p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) importBackup(file)
                    }}
                    className="hidden"
                    id="backup-import"
                  />
                  <Button
                    onClick={() => document.getElementById("backup-import")?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Backup
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                <p>
                  <strong>Última sincronização local:</strong> {getLastSyncTime()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Perigo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5 mr-2" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>Ações irreversíveis que afetam os dados do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    <strong>⚠️ ATENÇÃO:</strong> Esta ação irá apagar permanentemente:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Todo o histórico de resumos de dailies</li>
                      <li>Todas as tarefas (abertas e fechadas)</li>
                      <li>Configurações personalizadas</li>
                    </ul>
                    <strong className="block mt-2">Esta ação NÃO PODE ser desfeita!</strong>
                  </AlertDescription>
                </Alert>

                <Button onClick={clearAllData} disabled={clearing} variant="destructive" className="w-full">
                  {clearing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Apagar TODOS os Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Aplicação</CardTitle>
              <CardDescription>
                Personalize o nome e a descrição da aplicação. O nome aparecerá no header de todas as páginas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>💡 Dica:</strong> Após salvar as configurações, a página será recarregada automaticamente para
                  aplicar as mudanças no header e em toda a aplicação.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="app-title">Nome da Aplicação (aparece no header)</Label>
                <Input
                  id="app-title"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  placeholder="Ex: Resumo Beta, Task Manager, etc."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Este nome aparecerá no canto superior esquerdo de todas as páginas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-description">Descrição da Aplicação</Label>
                <Textarea
                  id="app-description"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Descreva brevemente o propósito da aplicação"
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Aparece em algumas páginas como subtítulo</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button onClick={updateAppConfig} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar e Aplicar Mudanças
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">A página será recarregada após salvar</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Personalização Visual
              </CardTitle>
              <CardDescription>Customize cores, logo e aparência da aplicação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Cor de Destaque</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="#10B981" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url">URL do Logo (opcional)</Label>
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Logo que aparecerá no header. Deixe vazio para usar apenas texto.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon">URL do Favicon (opcional)</Label>
                <Input
                  id="favicon"
                  value={favicon}
                  onChange={(e) => setFavicon(e.target.value)}
                  placeholder="https://exemplo.com/favicon.ico"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Ícone que aparece na aba do navegador.</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Modo Escuro</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alternar entre tema claro e escuro</p>
                </div>
                {mounted && (
                  <Button onClick={toggleTheme} variant="outline" className="flex items-center space-x-2">
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Modo Claro</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Modo Escuro</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <Button onClick={updateThemeConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Aplicar Tema Personalizado
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openai" className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <p className="font-medium">🧠 Como Configurar sua Integração com o ChatGPT (OpenAI)</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>
                    Crie sua chave de API acessando:{" "}
                    <a
                      href="https://platform.openai.com/account/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                    >
                      OpenAI API Keys <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>No campo abaixo, cole sua chave (sk-...).</li>
                  <li>
                    Escolha o modelo desejado. 👉 Recomendamos <code>gpt-4o</code> (mais rápido e eficiente).
                  </li>
                  <li>
                    Clique em <strong>Salvar Configurações</strong>.
                  </li>
                  <li>
                    Use o botão <strong>Testar Integração</strong> para validar se está tudo funcionando.
                  </li>
                </ol>
                <p className="text-sm mt-2">⚠️ Importante: OpenAI é a IA principal. O Groq é usado como backup.</p>
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Configurações da API OpenAI (Principal)
              </CardTitle>
              <CardDescription>Configure a integração com OpenAI como IA principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">Chave da API OpenAI</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sua chave será armazenada de forma segura e não será exibida após salvar.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-model">Modelo da OpenAI</Label>
                <Select value={openaiModel} onValueChange={setOpenaiModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Recomendado - Rápido e Eficiente)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4 (Mais Preciso)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais Barato)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button onClick={updateOpenAIConfig} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Configurações
                </Button>
                <Button onClick={testOpenAIConnection} disabled={testing || !openaiKey.trim()} variant="outline">
                  {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                  Testar Integração
                </Button>
              </div>

              {testResult && (
                <Alert
                  className={
                    testResult.success
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  }
                >
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertDescription
                    className={
                      testResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                    }
                  >
                    <div className="space-y-2">
                      <p className="font-medium">{testResult.message}</p>
                      {testResult.testResponse && (
                        <div className="text-sm bg-white/50 dark:bg-black/50 p-2 rounded border">
                          <strong>Resposta de teste:</strong> {testResult.testResponse}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Gerenciar Usuários
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie os usuários do sistema. Apenas você tem acesso a esta funcionalidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Criar Novo Usuário */}
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Criar Novo Usuário
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-user-name">Nome Completo</Label>
                      <Input
                        id="new-user-name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-email">Email</Label>
                      <Input
                        id="new-user-email"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="joao@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-password">Senha</Label>
                      <Input
                        id="new-user-password"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Senha segura"
                      />
                    </div>
                  </div>
                  <Button onClick={createUser} disabled={creatingUser} className="mt-4">
                    {creatingUser ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Criar Usuário
                      </>
                    )}
                  </Button>
                </div>

                {/* Lista de Usuários */}
                <div className="space-y-4">
                  <h4 className="font-medium">Usuários Existentes</h4>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{user.name || "Sem nome"}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Criado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.email === "carlos.oldenburg@videosoft.com.br" ? "Super Admin" : user.role}
                          </Badge>
                          {user.email !== "carlos.oldenburg@videosoft.com.br" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRole(user.id, user.role === "admin" ? "user" : "admin")}
                              >
                                {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id, user.email)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="clients" className="space-y-4">
          <ClientTagManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
