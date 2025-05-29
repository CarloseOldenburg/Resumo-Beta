"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sparkles,
  Calendar,
  CheckCircle,
  FileText,
  Save,
  Loader2,
  AlertTriangle,
  Settings,
  Copy,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Task } from "@/lib/types"

export default function GenerateSummaryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return format(today, "yyyy-MM-dd")
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [existingManualSummary, setExistingManualSummary] = useState("")
  const [generatedSummary, setGeneratedSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showApiWarning, setShowApiWarning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchTasks()
      fetchExistingSummary()
    }
  }, [authLoading, isAuthenticated, selectedDate])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks?date=${selectedDate}`)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data)

      // Auto-selecionar tarefas concluídas
      const completedTaskIds = data.filter((task: Task) => task.completed).map((task: Task) => task.id)
      setSelectedTasks(completedTaskIds)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingSummary = async () => {
    try {
      const response = await fetch(`/api/daily-summary?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setExistingManualSummary(data.manual_summary || "")
        setGeneratedSummary(data.generated_summary || "")
      } else {
        setExistingManualSummary("")
        setGeneratedSummary("")
      }
    } catch (error) {
      console.error("Error fetching existing summary:", error)
    }
  }

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId])
    } else {
      setSelectedTasks(selectedTasks.filter((id) => id !== taskId))
    }
  }

  const generateSummary = async () => {
    if (generating) {
      toast({
        title: "Aviso",
        description: "Já existe uma geração em andamento. Aguarde...",
        variant: "destructive",
      })
      return
    }

    if (selectedTasks.length === 0 && !existingManualSummary.trim()) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma tarefa ou adicione um resumo manual primeiro",
        variant: "destructive",
      })
      return
    }

    try {
      setGenerating(true)
      setShowApiWarning(false)
      setGeneratedSummary("")

      const selectedTasksData = tasks.filter((task) => selectedTasks.includes(task.id))

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_date: selectedDate,
          manual_summary: existingManualSummary,
          completed_tasks: selectedTasksData,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate summary")

      const data = await response.json()
      setGeneratedSummary(data.generated_summary)

      // Verificar se foi usado fallback
      if (data.generated_summary && data.generated_summary.includes("OpenAI indisponível")) {
        setShowApiWarning(true)
        toast({
          title: "Resumo Gerado",
          description: "Resumo criado com sucesso (modo básico - OpenAI indisponível)",
        })
      } else {
        toast({
          title: "Sucesso",
          description: "Resumo da daily gerado com sucesso!",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o resumo da daily",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const saveSummary = async () => {
    if (!generatedSummary) {
      toast({
        title: "Aviso",
        description: "Não há resumo gerado para salvar",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch("/api/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_date: selectedDate,
          manual_summary: existingManualSummary,
          generated_summary: generatedSummary,
          tasks_completed: tasks.filter((task) => selectedTasks.includes(task.id)),
        }),
      })

      if (!response.ok) throw new Error("Failed to save summary")

      toast({
        title: "Sucesso",
        description: "Resumo salvo com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o resumo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async () => {
    if (!generatedSummary) return

    try {
      await navigator.clipboard.writeText(generatedSummary)
      toast({
        title: "Sucesso",
        description: "Resumo copiado para a área de transferência",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o resumo",
        variant: "destructive",
      })
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const isValidDate = selectedDate && !isNaN(Date.parse(selectedDate + "T00:00:00"))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerar Resumo com IA</h1>
          <p className="text-gray-600">
            Use inteligência artificial para criar resumos profissionais das suas atividades
          </p>
        </div>

        {/* Aviso sobre API OpenAI */}
        {showApiWarning && (
          <Alert className="border-orange-200 bg-orange-50 mb-6">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <span>
                  Resumo gerado em modo básico. Configure sua chave da API OpenAI para resumos mais detalhados.
                </span>
                <Link href="/admin">
                  <Button size="sm" variant="outline" className="ml-2">
                    <Settings className="h-3 w-3 mr-1" />
                    Configurar
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Seletor de Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Selecionar Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Data:{" "}
                  {isValidDate
                    ? format(new Date(selectedDate + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : selectedDate}
                </p>
              </CardContent>
            </Card>

            {/* Resumo Manual Existente */}
            {existingManualSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Resumo Manual Salvo
                    </div>
                    <Link href="/resumo-manual">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">{existingManualSummary}</div>
                  <p className="text-xs text-gray-500 mt-2">Este resumo manual será incluído na geração com IA</p>
                </CardContent>
              </Card>
            )}

            {/* Tarefas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Selecionar Tarefas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                              {task.title}
                            </span>
                            {task.completed && <Badge className="bg-green-500">Concluída</Badge>}
                            {task.tag && task.tag !== "completed" && <Badge variant="outline">{task.tag}</Badge>}
                          </div>
                          {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma tarefa encontrada para esta data</p>
                    <Link href="/tarefas">
                      <Button size="sm" className="mt-2">
                        Criar Tarefas
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botão Gerar */}
            <div className="space-y-4">
              <Button
                onClick={generateSummary}
                disabled={generating || (selectedTasks.length === 0 && !existingManualSummary.trim())}
                className="w-full"
                size="lg"
              >
                {generating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
                {generating ? "Gerando Resumo..." : "Gerar Resumo com IA"}
              </Button>

              {!existingManualSummary && (
                <Alert className="border-blue-200 bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>💡 Dica:</strong> Adicione um resumo manual primeiro para obter resultados mais
                        detalhados.
                      </span>
                      <Link href="/resumo-manual">
                        <Button size="sm" variant="outline" className="ml-2">
                          Adicionar
                        </Button>
                      </Link>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Resultado */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Resumo Gerado
                  </div>
                  {generatedSummary && (
                    <div className="flex space-x-2">
                      <Button onClick={copyToClipboard} size="sm" variant="outline">
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button onClick={saveSummary} size="sm" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedSummary ? (
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap min-h-96">{generatedSummary}</div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>O resumo aparecerá aqui após a geração</p>
                    <p className="text-sm mt-2">Selecione tarefas e clique em "Gerar Resumo"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
