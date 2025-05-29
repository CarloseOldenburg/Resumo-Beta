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
import { Settings, Users, Database, Key, Save, Loader2, Trash2, TestTube, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Sun, Moon, Upload, Download } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import type { SystemSettings } from "@/lib/types"
import { useTheme } from "@/hooks/use-theme"
import { useAutoBackup } from "@/hooks/use-auto-backup"

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
  const [appTitle, setAppTitle] = useState("QA Task Manager")
  const [appDescription, setAppDescription] = useState("Gerencie suas tarefas e gere resumos para daily meetings")
  const [openaiKey, setOpenaiKey] = useState("")
  const [openaiModel, setOpenaiModel] = useState("gpt-4o")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; testResponse?: string } | null>(
    null,
  )
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar configurações
      const settingsResponse = await fetch("/api/admin/settings")
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings(settingsData)

        // Extrair configurações específicas
        const titleSetting = settingsData.find((s: SystemSettings) => s.key === "app_name")
        const descriptionSetting = settingsData.find((s: SystemSettings) => s.key === "app_description")
        const keySetting = settingsData.find((s: SystemSettings) => s.key === "openai_api_key")
        const modelSetting = settingsData.find((s: SystemSettings) => s.key === "openai_model")

        if (titleSetting) setAppTitle(titleSetting.value)
        if (descriptionSetting) setAppDescription(descriptionSetting.value)
        if (keySetting) setOpenaiKey(keySetting.value)
        if (modelSetting) setOpenaiModel(modelSetting.value)
      }

      // Buscar usuários
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

      // Atualizar título
      await updateSetting("app_name", appTitle)

      // Atualizar descrição
      await updateSetting("app_description", appDescription)

      toast({
        title: "Sucesso",
        description:
          "Configurações da aplicação atualizadas com sucesso! Recarregue a página para ver as mudanças no header.",
      })

      // Opcional: recarregar a página automaticamente após 2 segundos
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const refreshPage = () => {
    setRefreshing(true)
    window.location.reload()
  }

  const updateOpenAIConfig = async () => {
    try {
      setSaving(true)
      setTestResult(null)

      // Validar chave
      if (openaiKey && !openaiKey.startsWith("sk-")) {
        toast({
          title: "Erro",
          description: "Formato da chave inválido. A chave deve começar com 'sk-'",
          variant: "destructive",
        })
        return
      }

      // Atualizar chave
      await updateSetting("openai_api_key", openaiKey)

      // Atualizar modelo
      await updateSetting("openai_model", openaiModel)

      toast({
        title: "Sucesso",
        description: "Configurações da OpenAI salvas com sucesso",
      })

      // Se há uma chave, testar automaticamente
      if (openaiKey.trim()) {
        setTimeout(() => testOpenAIConnection(), 500)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
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
          title: "Sucesso",
          description: result.message,
        })
      } else {
        toast({
          title: "Erro na Integração",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "❌ Erro de conexão com o servidor",
      })
      toast({
        title: "Erro",
        description: "Não foi possível testar a conexão",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm("⚠️ Tem certeza que deseja apagar TODO o histórico de dailies? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setClearing(true)

      const response = await fetch("/api/admin/clear-history", {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to clear history")

      const result = await response.json()

      toast({
        title: "Sucesso",
        description: result.message,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível apagar o histórico",
        variant: "destructive",
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
        title: "Sucesso",
        description: "Papel do usuário atualizado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o papel do usuário",
        variant: "destructive",
      })
    }
  }

  const getLastSyncTime = () => {
    if (typeof window === "undefined") return "Nunca"
    return localStorage.getItem('qa-manager-last-sync') || 'Nunca'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
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
          <Badge variant="secondary">Admin</Badge>
          <Button onClick={refreshPage} variant="outline" size="sm" disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="app" className="space-y-4">
        <TabsList>
          <TabsTrigger value="app" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Aplicação</span>
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>OpenAI</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Banco de Dados</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Backup & Tema</span>
          </TabsTrigger>
        </TabsList>

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
                  placeholder="Ex: Resumo Beta, QA Manager, etc."
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

        <TabsContent value="openai" className="space-y-4">
          {/* Guia de Configuração */}
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
                <p className="text-sm mt-2">
                  ⚠️ <strong>Importante:</strong> Certifique-se de que sua conta da OpenAI tem saldo ou assinatura ativa.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Configurações da API OpenAI
              </CardTitle>
              <CardDescription>Configure a integração com OpenAI para geração de resumos inteligentes</CardDescription>
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

              {/* Resultado do Teste */}
              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
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

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>Visualize e gerencie os usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{user.name || "Sem nome"}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Criado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserRole(user.id, user.role === "admin" ? "user" : "admin")}
                      >
                        {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Banco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Usuários</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">-</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tarefas</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">-</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Resumos</div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <strong>Atenção:</strong> Esta ação irá apagar permanentemente todo o histórico de resumos de
                    dailies (automáticos e manuais). As tarefas não serão afetadas.
                  </AlertDescription>
                </Alert>

                <Button onClick={clearHistory} disabled={clearing} variant="destructive" className="w-full">
                  {clearing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Apagar Histórico de Dailies
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          {/* Seção de Tema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações de Tema
              </CardTitle>
              <CardDescription>Personalize a aparência da aplicação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Modo Escuro</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alternar entre tema claro e escuro</p>
                </div>
                {mounted && (
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
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
            </CardContent>
          </Card>

          {/* Seção de Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Backup e Sincronização
              </CardTitle>
              <CardDescription>
                Exporte e importe seus dados para sincronizar entre dispositivos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>💡 Como funciona:</strong> Seus dados são automaticamente salvos localmente.
                  Use o backup para sincronizar entre dispositivos ou como segurança.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Exportar Backup Completo</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Baixe todos os seus dados em formato JSON
                  </p>
                  <Button onClick={exportFullBackup} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Backup
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Importar Backup</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Restaure dados de um arquivo de backup
                  </p>
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
                    onClick={() => document.getElementById('backup-import')?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Backup
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                <p><strong>Última sincronização local:</strong> {getLastSyncTime()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
