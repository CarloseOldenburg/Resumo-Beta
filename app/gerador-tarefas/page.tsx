"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, Save, Loader2, Calendar, CheckCircle, Wand2, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface ClientTag {
  id: string
  name: string
  color: string
  description: string
}

export default function TaskGeneratorPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return format(today, "yyyy-MM-dd")
  })
  const [taskText, setTaskText] = useState("")
  const [clientTags, setClientTags] = useState<ClientTag[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchClientTags()
    }
  }, [authLoading, isAuthenticated])

  const fetchClientTags = async () => {
    try {
      const response = await fetch("/api/client-tags")
      if (response.ok) {
        const data = await response.json()
        setClientTags(data)
      }
    } catch (error) {
      console.error("Error fetching client tags:", error)
    }
  }

  const generateTasksFromText = async () => {
    if (!taskText.trim()) {
      toast({
        title: "Aviso",
        description: "Digite um texto para gerar tarefas",
        variant: "destructive",
      })
      return
    }

    try {
      setGenerating(true)
      const response = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: taskText,
          date: selectedDate,
          clientTags: clientTags,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate tasks")
      }

      const data = await response.json()
      setGeneratedTasks(data.tasks || [])
      toast({
        title: "Sucesso",
        description: `${data.tasks?.length || 0} tarefas geradas com sucesso!`,
      })
    } catch (error) {
      console.error("Erro ao gerar tarefas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar as tarefas. Verifique se o Groq está configurado.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const saveGeneratedTasks = async () => {
    if (generatedTasks.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há tarefas para salvar",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Salvar as tarefas no banco
      const response = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: generatedTasks,
          date: selectedDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save tasks")
      }

      const savedTasks = await response.json()

      toast({
        title: "Sucesso",
        description: `${savedTasks.length} tarefas salvas com sucesso!`,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push("/tarefas")} className="ml-2">
            <ExternalLink className="h-4 w-4 mr-1" />
            Ver Tarefas
          </Button>
        ),
      })

      // Limpar o formulário
      setGeneratedTasks([])
      setTaskText("")

      // Opcional: redirecionar automaticamente após 2 segundos
      setTimeout(() => {
        router.push("/tarefas")
      }, 2000)
    } catch (error) {
      console.error("Erro ao salvar tarefas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as tarefas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isValidDate = selectedDate && !isNaN(Date.parse(selectedDate + "T00:00:00"))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gerador de Tarefas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Use IA para gerar tarefas automaticamente a partir de texto
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Seletor de Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Data das Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  As tarefas serão criadas para:{" "}
                  {isValidDate
                    ? format(new Date(selectedDate + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : selectedDate}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gerador de Tarefas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2" />
                Gerar Tarefas com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-text">Descreva suas atividades</Label>
                <Textarea
                  id="task-text"
                  placeholder="Exemplo:
- Revisar funcionalidade de login do sistema Saipos
- Testar integração com API do Chiquinho
- Corrigir bugs encontrados no módulo de relatórios
- Reunião de alinhamento com equipe Mania de Churrasco
- Documentar casos de teste para nova feature"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  rows={8}
                  className="min-h-[200px]"
                />
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{taskText.length} caracteres</span>
                  <span>A IA identificará tarefas e clientes automaticamente</span>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>💡 Dica:</strong> Mencione nomes de clientes no texto (Saipos, Chiquinho, etc.) para que a IA
                  atribua as tags automaticamente às tarefas.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-2">
                <Button onClick={generateTasksFromText} disabled={generating || !taskText.trim()} size="lg">
                  {generating ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  Gerar Tarefas com IA
                </Button>

                {generatedTasks.length > 0 && (
                  <Button onClick={saveGeneratedTasks} disabled={loading} variant="outline" size="lg">
                    {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    Salvar e Ir para Tarefas ({generatedTasks.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tarefas Geradas */}
          {generatedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Tarefas Geradas ({generatedTasks.length})
                  </div>
                  <Button onClick={() => router.push("/tarefas")} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Todas as Tarefas
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedTasks.map((task, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              Em Andamento
                            </span>
                            {task.client_tags && task.client_tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {task.client_tags.map((tagName: string) => {
                                  const clientTag = clientTags.find((ct) => ct.name === tagName)
                                  return (
                                    <span
                                      key={tagName}
                                      style={{
                                        backgroundColor: clientTag?.color || "#6B7280",
                                        color: clientTag?.color
                                          ? Number.parseInt(clientTag.color.substring(1, 3), 16) * 0.299 +
                                              Number.parseInt(clientTag.color.substring(3, 5), 16) * 0.587 +
                                              Number.parseInt(clientTag.color.substring(5, 7), 16) * 0.114 >
                                            186
                                            ? "#000000"
                                            : "#FFFFFF"
                                          : "#FFFFFF",
                                      }}
                                      className="text-xs px-2 py-0.5 rounded-full"
                                    >
                                      {tagName}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ <strong>Próximo passo:</strong> Clique em "Salvar e Ir para Tarefas" para adicionar essas tarefas
                    ao seu sistema e visualizá-las na aba de tarefas.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
