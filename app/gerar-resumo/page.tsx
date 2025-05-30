"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
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
  Brain,
  Zap,
  Target,
  Clock,
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

      const completedTaskIds = data.filter((task: Task) => task.completed).map((task: Task) => task.id)
      setSelectedTasks(completedTaskIds)
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível carregar as tarefas",
        variant: "destructive",
        duration: 6000,
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
        title: "⚠️ Aviso",
        description: "Já existe uma geração em andamento. Aguarde...",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    if (selectedTasks.length === 0 && !existingManualSummary.trim()) {
      toast({
        title: "⚠️ Aviso",
        description: "Selecione pelo menos uma tarefa ou adicione um resumo manual primeiro",
        variant: "destructive",
        duration: 6000,
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

      if (data.generated_summary && data.generated_summary.includes("OpenAI indisponível")) {
        setShowApiWarning(true)
        toast({
          title: "✅ Resumo Gerado",
          description: "Resumo criado com sucesso (modo básico - OpenAI indisponível)",
          duration: 6000,
        })
      } else {
        toast({
          title: "🎉 Sucesso",
          description: "Resumo da daily gerado com sucesso!",
          duration: 6000,
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível gerar o resumo da daily",
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setGenerating(false)
    }
  }

  const saveSummary = async () => {
    if (!generatedSummary) {
      toast({
        title: "⚠️ Aviso",
        description: "Não há resumo gerado para salvar",
        variant: "destructive",
        duration: 5000,
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
        title: "✅ Sucesso",
        description: "Resumo salvo com sucesso!",
        duration: 6000,
      })
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível salvar o resumo",
        variant: "destructive",
        duration: 8000,
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
        title: "✅ Sucesso",
        description: "Resumo copiado para a área de transferência",
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível copiar o resumo",
        variant: "destructive",
        duration: 6000,
      })
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-gray-700 mx-auto"></div>
          </div>
          <p className="text-gray-400 font-medium">Carregando gerador de resumos...</p>
        </div>
      </div>
    )
  }

  const completedTasks = tasks.filter((task) => task.completed)
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
                <Brain className="h-10 w-10 mr-4 text-purple-400" />
                Gerar Resumo com IA
              </h1>
              <p className="text-gray-400 text-lg">
                Use inteligência artificial para criar resumos profissionais das suas atividades
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-700 rounded-lg">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">IA Ativa</span>
              </div>
            </div>
          </div>
        </div>

        {/* API Warning */}
        {showApiWarning && (
          <Alert className="border-orange-700 bg-orange-900/20 mb-6 fade-in">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300">
              <div className="flex items-center justify-between">
                <span>
                  Resumo gerado em modo básico. Configure sua chave da API OpenAI para resumos mais detalhados.
                </span>
                <Link href="/admin">
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 border-orange-600 text-orange-300 hover:bg-orange-900/50"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configurar
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Date Selector */}
            <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Calendar className="h-5 w-5 mr-3 text-blue-400" />
                  Selecionar Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">Data selecionada:</span>
                    <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">
                      {isValidDate
                        ? format(new Date(selectedDate + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : selectedDate}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Summary */}
            {existingManualSummary && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-green-400" />
                      Resumo Manual Salvo
                    </div>
                    <Link href="/resumo-manual">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm leading-relaxed">
                    {existingManualSummary}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Este resumo manual será incluído na geração com IA</p>
                </CardContent>
              </Card>
            )}

            {/* Tasks Selection */}
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Target className="h-5 w-5 mr-3 text-green-400" />
                  Selecionar Tarefas ({selectedTasks.length} selecionadas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start space-x-3 p-4 border border-gray-700 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-medium ${task.completed ? "line-through text-gray-400" : "text-white"}`}
                            >
                              {task.title}
                            </span>
                            {task.completed && (
                              <Badge className="bg-green-900/50 text-green-300 border-green-700">Concluída</Badge>
                            )}
                            {task.tag && task.tag !== "completed" && (
                              <Badge variant="outline" className="border-gray-600 text-gray-300">
                                {task.tag}
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</p>
                    <p className="text-sm mb-4">Nenhuma tarefa foi encontrada para esta data</p>
                    <Link href="/tarefas">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Target className="h-4 w-4 mr-2" />
                        Criar Tarefas
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="space-y-4">
              <Button
                onClick={generateSummary}
                disabled={generating || (selectedTasks.length === 0 && !existingManualSummary.trim())}
                className="w-full button-hover bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg border-0"
                size="lg"
              >
                {generating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
                {generating ? "Gerando Resumo..." : "Gerar Resumo com IA"}
              </Button>

              {!existingManualSummary && (
                <Alert className="border-blue-700 bg-blue-900/20">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300">
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>💡 Dica:</strong> Adicione um resumo manual primeiro para obter resultados mais
                        detalhados.
                      </span>
                      <Link href="/resumo-manual">
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 border-blue-600 text-blue-300 hover:bg-blue-900/50"
                        >
                          Adicionar
                        </Button>
                      </Link>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Right Column - Result */}
          <div>
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-3 text-purple-400" />
                    Resumo Gerado
                  </div>
                  {generatedSummary && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={copyToClipboard}
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        onClick={saveSummary}
                        size="sm"
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedSummary ? (
                  <div className="p-6 bg-gray-700/30 border border-gray-600 rounded-lg text-gray-100 whitespace-pre-wrap min-h-96 leading-relaxed">
                    {generatedSummary}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-400 mb-2">Aguardando geração</h3>
                    <p className="text-gray-500 mb-1">O resumo aparecerá aqui após a geração</p>
                    <p className="text-sm text-gray-600">Selecione tarefas e clique em "Gerar Resumo"</p>
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
