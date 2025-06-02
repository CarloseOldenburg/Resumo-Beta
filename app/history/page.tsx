"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import Header from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Eye, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import type { DailySummary } from "@/lib/types"

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading) {
      fetchSummaries()
    }
  }, [authLoading])

  const fetchSummaries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/daily-summary/history")
      if (!response.ok) throw new Error("Failed to fetch summaries")
      const data = await response.json()
      setSummaries(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de resumos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportSummary = async (summary: DailySummary, format: "pdf" | "txt") => {
    if (!summary.generated_summary) {
      toast({
        title: "Aviso",
        description: "Este resumo não possui conteúdo gerado para exportar",
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
          date: summary.summary_date,
          format,
        }),
      })

      if (!response.ok) throw new Error("Failed to export summary")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `daily-summary-${summary.summary_date}.${format}`
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Dailies</h1>
          <p className="text-gray-600">Visualize e exporte seus resumos anteriores</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Resumos Anteriores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : summaries.length > 0 ? (
                  <div className="space-y-3">
                    {summaries.map((summary) => (
                      <div
                        key={summary.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSummary?.id === summary.id ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"
                        }`}
                        onClick={() => setSelectedSummary(summary)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {format(parseISO(summary.summary_date), "dd 'de' MMMM", { locale: ptBR })}
                          </div>
                          {summary.generated_summary ? (
                            <Badge variant="secondary">Gerado</Badge>
                          ) : (
                            <Badge variant="outline">Rascunho</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(parseISO(summary.created_at), "HH:mm - dd/MM/yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum resumo encontrado</p>
                    <p className="text-sm">Gere resumos diários para vê-los aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Visualização do Resumo
                  </div>
                  {selectedSummary && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => exportSummary(selectedSummary, "pdf")}
                        size="sm"
                        variant="outline"
                        disabled={!selectedSummary.generated_summary}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        onClick={() => exportSummary(selectedSummary, "txt")}
                        size="sm"
                        variant="outline"
                        disabled={!selectedSummary.generated_summary}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        TXT
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSummary ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Daily de{" "}
                        {format(parseISO(selectedSummary.summary_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </h3>
                    </div>

                    {selectedSummary.generated_summary ? (
                      <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {selectedSummary.generated_summary}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed rounded-lg text-center text-gray-500">
                        <p>Este resumo não possui conteúdo gerado</p>
                      </div>
                    )}

                    {selectedSummary.manual_summary && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Resumo Manual:</h4>
                        <div className="p-4 bg-gray-50 rounded-lg">{selectedSummary.manual_summary}</div>
                      </div>
                    )}

                    {selectedSummary.tasks_completed && selectedSummary.tasks_completed.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Tarefas Concluídas:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedSummary.tasks_completed.map((task: any) => (
                            <li key={task.id}>{task.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione um resumo para visualizar</p>
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
