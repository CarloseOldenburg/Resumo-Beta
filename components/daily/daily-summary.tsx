"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, Download, Sparkles, AlertTriangle, Settings } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { DailySummary as DailySummaryType, Task } from "@/lib/types"
import { useAutoBackup } from "@/hooks/use-auto-backup"

interface DailySummaryProps {
  selectedDate: string
}

export default function DailySummary({ selectedDate }: DailySummaryProps) {
  const [summary, setSummary] = useState<DailySummaryType | null>(null)
  const [manualSummary, setManualSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showApiWarning, setShowApiWarning] = useState(false)
  const { toast } = useToast()
  const { autoBackup } = useAutoBackup()

  useEffect(() => {
    fetchSummary()
  }, [selectedDate])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/daily-summary?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
        setManualSummary(data.manual_summary || "")
      } else if (response.status === 404) {
        setSummary(null)
        setManualSummary("")
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSummary = async () => {
    try {
      const response = await fetch("/api/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_date: selectedDate,
          manual_summary: manualSummary,
        }),
      })

      if (!response.ok) throw new Error("Failed to save summary")

      const data = await response.json()
      setSummary(data)

      // Fazer backup automático
      autoBackup("summary_saved", data)

      toast({
        title: "Sucesso",
        description: "Resumo manual salvo com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o resumo",
        variant: "destructive",
      })
    }
  }

  const generateAISummary = async () => {
    try {
      setGenerating(true)
      setShowApiWarning(false)

      // Buscar tarefas concluídas do dia
      const tasksResponse = await fetch(`/api/tasks?date=${selectedDate}`)
      if (!tasksResponse.ok) throw new Error("Failed to fetch tasks")

      const tasks: Task[] = await tasksResponse.json()
      const completedTasks = tasks.filter((task) => task.completed)

      if (completedTasks.length === 0 && !manualSummary.trim()) {
        toast({
          title: "Aviso",
          description: "Adicione tarefas concluídas ou um resumo manual para gerar o resumo da daily",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_date: selectedDate,
          manual_summary: manualSummary,
          completed_tasks: completedTasks,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate summary")

      const data = await response.json()
      setSummary(data)

      // Fazer backup automático
      autoBackup("summary_generated", data)

      // Verificar se foi usado fallback (resumo contém aviso sobre OpenAI)
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

  const exportSummary = async (format: "pdf" | "txt") => {
    if (!summary?.generated_summary) {
      toast({
        title: "Aviso",
        description: "Gere um resumo primeiro para exportar",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/export-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: summary.generated_summary,
          date: selectedDate,
          format,
        }),
      })

      if (!response.ok) throw new Error("Failed to export summary")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `daily-summary-${selectedDate}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Sucesso",
        description: `Resumo exportado em ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar o resumo",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Aviso sobre API OpenAI */}
      {showApiWarning && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>Resumo gerado em modo básico. Configure sua chave da API OpenAI para resumos mais detalhados.</span>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Resumo Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Escreva um resumo manual das suas atividades do dia..."
            value={manualSummary}
            onChange={(e) => setManualSummary(e.target.value)}
            rows={4}
          />
          <Button onClick={saveSummary} size="sm">
            Salvar Resumo Manual
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Resumo da Daily
            </div>
            {summary?.generated_summary && <Badge variant="secondary">Gerado</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary?.generated_summary ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">{summary.generated_summary}</div>
              <div className="flex space-x-2">
                <Button onClick={() => exportSummary("pdf")} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button onClick={() => exportSummary("txt")} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  TXT
                </Button>
                <Button onClick={generateAISummary} size="sm" disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Regenerar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">Nenhum resumo gerado ainda</p>
              <Button onClick={generateAISummary} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar Resumo da Daily
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
