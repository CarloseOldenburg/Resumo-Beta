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
import { Badge } from "@/components/ui/badge"
import { Sparkles, Save, Loader2, Calendar, CheckCircle, Wand2, ExternalLink, Zap, Brain, Target } from "lucide-react"
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
        title: "⚠️ Aviso",
        description: "Digite um texto para gerar tarefas",
        variant: "destructive",
        duration: 5000,
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
        title: "🎉 Sucesso",
        description: `${data.tasks?.length || 0} tarefas geradas com sucesso!`,
        duration: 6000,
      })
    } catch (error) {
      console.error("Erro ao gerar tarefas:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível gerar as tarefas. Verifique se o Groq está configurado.",
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setGenerating(false)
    }
  }

  const saveGeneratedTasks = async () => {
    if (generatedTasks.length === 0) {
      toast({
        title: "⚠️ Aviso",
        description: "Não há tarefas para salvar",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    try {
      setLoading(true)

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
        title: "✅ Sucesso",
        description: `${savedTasks.length} tarefas salvas com sucesso!`,
        duration: 6000,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push("/tarefas")} className="ml-2">
            <ExternalLink className="h-4 w-4 mr-1" />
            Ver Tarefas
          </Button>
        ),
      })

      setGeneratedTasks([])
      setTaskText("")

      setTimeout(() => {
        router.push("/tarefas")
      }, 2000)
    } catch (error) {
      console.error("Erro ao salvar tarefas:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível salvar as tarefas",
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-gray-700 mx-auto"></div>
          </div>
          <p className="text-gray-400 font-medium">Carregando gerador...</p>
        </div>
      </div>
    )
  }

  const isValidDate = selectedDate && !isNaN(Date.parse(selectedDate + "T00:00:00"))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <Brain className="h-10 w-10 mr-4 text-green-400" />
                Gerador de Tarefas com IA
              </h1>
              <p className="text-gray-400 text-lg">Transforme texto em tarefas organizadas automaticamente</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700 rounded-lg">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">IA Ativa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Date Selector */}
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Calendar className="h-5 w-5 mr-3 text-blue-400" />
                Data das Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 w-auto"
                />
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Tarefas serão criadas para:</span>
                  <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">
                    {isValidDate
                      ? format(new Date(selectedDate + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : selectedDate}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Generator */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Wand2 className="h-5 w-5 mr-3 text-green-400" />
                Gerar Tarefas com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="task-text" className="text-gray-300 font-medium">
                  Descreva suas atividades
                </Label>
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
                  className="min-h-[200px] bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500 resize-none"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{taskText.length} caracteres</span>
                  <span className="text-gray-500">A IA identificará tarefas e clientes automaticamente</span>
                </div>
              </div>

              <Alert className="border-green-700 bg-green-900/20">
                <Sparkles className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  <strong>💡 Dica:</strong> Mencione nomes de clientes no texto (Saipos, Chiquinho, etc.) para que a IA
                  atribua as tags automaticamente às tarefas.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={generateTasksFromText}
                  disabled={generating || !taskText.trim()}
                  size="lg"
                  className="button-hover bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0 flex-1"
                >
                  {generating ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  {generating ? "Gerando..." : "Gerar Tarefas com IA"}
                </Button>

                {generatedTasks.length > 0 && (
                  <Button
                    onClick={saveGeneratedTasks}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                    className="button-hover border-blue-600 text-blue-300 hover:bg-blue-900/50 hover:text-white flex-1 sm:flex-none"
                  >
                    {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    Salvar e Ir para Tarefas ({generatedTasks.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generated Tasks */}
          {generatedTasks.length > 0 && (
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl fade-in">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 mr-3 text-green-400" />
                    Tarefas Geradas ({generatedTasks.length})
                  </div>
                  <Button
                    onClick={() => router.push("/tarefas")}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Todas as Tarefas
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedTasks.map((task, index) => (
                    <div
                      key={index}
                      className="p-6 border border-gray-700 rounded-lg bg-gradient-to-r from-gray-700/50 to-gray-800/50 hover:from-gray-700/70 hover:to-gray-800/70 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg mb-2">{task.title}</h4>
                          {task.description && <p className="text-gray-300 mb-3 leading-relaxed">{task.description}</p>}
                          <div className="flex items-center flex-wrap gap-2">
                            <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">Em Andamento</Badge>
                            {task.client_tags && task.client_tags.length > 0 && (
                              <>
                                {task.client_tags.map((tagName: string) => {
                                  const clientTag = clientTags.find((ct) => ct.name === tagName)
                                  return (
                                    <Badge
                                      key={tagName}
                                      style={{
                                        backgroundColor: clientTag?.color || "#374151",
                                        color: clientTag?.color
                                          ? Number.parseInt(clientTag.color.substring(1, 3), 16) * 0.299 +
                                              Number.parseInt(clientTag.color.substring(3, 5), 16) * 0.587 +
                                              Number.parseInt(clientTag.color.substring(5, 7), 16) * 0.114 >
                                            186
                                            ? "#000000"
                                            : "#FFFFFF"
                                          : "#FFFFFF",
                                        border: `1px solid ${clientTag?.color || "#4B5563"}`,
                                      }}
                                      className="font-medium"
                                    >
                                      {tagName}
                                    </Badge>
                                  )
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-green-300 font-medium">Próximo passo</p>
                      <p className="text-green-400 text-sm">
                        Clique em "Salvar e Ir para Tarefas" para adicionar essas tarefas ao seu sistema e visualizá-las
                        na aba de tarefas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
