"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Eye, Search, Trash2, Copy } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import type { DailySummary } from "@/lib/types"

export default function SummariesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [filteredSummaries, setFilteredSummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSummaries()
    }
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    // Se há um parâmetro de data na URL, selecionar automaticamente
    const dateParam = searchParams.get("date")
    if (dateParam && summaries.length > 0) {
      const summary = summaries.find((s) => s.summary_date === dateParam)
      if (summary) {
        setSelectedSummary(summary)
      }
    }
  }, [searchParams, summaries])

  useEffect(() => {
    // Filtrar resumos baseado no termo de busca
    if (searchTerm.trim()) {
      const filtered = summaries.filter(
        (summary) =>
          summary.summary_date.includes(searchTerm) ||
          summary.manual_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          summary.generated_summary?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredSummaries(filtered)
    } else {
      setFilteredSummaries(summaries)
    }
  }, [searchTerm, summaries])

  const fetchSummaries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/daily-summary/history")

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        console.error(`HTTP error: ${response.status} ${response.statusText}`)
        setSummaries([])
        setFilteredSummaries([])
        return
      }

      // Try to parse the response as JSON
      try {
        const data = await response.json()
        setSummaries(Array.isArray(data) ? data : [])
        setFilteredSummaries(Array.isArray(data) ? data : [])
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        setSummaries([])
        setFilteredSummaries([])
        toast({
          title: "Erro",
          description: "Formato de resposta inválido do servidor",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error fetching summaries:", error)
      toast({
        title: "Erro",
        description: `Não foi possível carregar o histórico de resumos`,
        variant: "destructive",
      })
      // Definir arrays vazios em caso de erro
      setSummaries([])
      setFilteredSummaries([])
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
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

  const exportSummary = async (summary: DailySummary) => {
    if (!summary.generated_summary && !summary.manual_summary) {
      toast({
        title: "Aviso",
        description: "Este resumo não possui conteúdo para exportar",
        variant: "destructive",
      })
      return
    }

    try {
      const content = summary.generated_summary || summary.manual_summary || ""
      const response = await fetch("/api/export-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: content,
          date: summary.summary_date,
          format: "txt",
        }),
      })

      if (!response.ok) throw new Error("Failed to export summary")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `daily-summary-${summary.summary_date}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Sucesso",
        description: "Resumo exportado em TXT",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar o resumo",
        variant: "destructive",
      })
    }
  }

  const deleteSummary = async (summaryId: string) => {
    if (!confirm("Tem certeza que deseja excluir este resumo?")) {
      return
    }

    try {
      const response = await fetch(`/api/daily-summary/${summaryId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete summary")

      setSummaries(summaries.filter((s) => s.id !== summaryId))
      if (selectedSummary?.id === summaryId) {
        setSelectedSummary(null)
      }

      toast({
        title: "Sucesso",
        description: "Resumo excluído com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o resumo",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Resumos</h1>
          <p className="text-gray-600">Visualize, edite e gerencie seus resumos de dailies</p>
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
                {/* Busca */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por data ou conteúdo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredSummaries.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredSummaries.map((summary) => (
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
                            <Badge variant="outline">Manual</Badge>
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
                    {searchTerm && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setSearchTerm("")}>
                        Limpar Busca
                      </Button>
                    )}
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
                        onClick={() => {
                          const content = selectedSummary.generated_summary || selectedSummary.manual_summary || ""
                          copyToClipboard(content)
                        }}
                        size="sm"
                        variant="outline"
                        disabled={!selectedSummary.generated_summary && !selectedSummary.manual_summary}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        onClick={() => exportSummary(selectedSummary)}
                        size="sm"
                        variant="outline"
                        disabled={!selectedSummary.generated_summary && !selectedSummary.manual_summary}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        TXT
                      </Button>
                      <Button
                        onClick={() => deleteSummary(selectedSummary.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
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
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Resumo Gerado (IA):</h4>
                        <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                          {selectedSummary.generated_summary}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed rounded-lg text-center text-gray-500">
                        <p>Este resumo não possui conteúdo gerado por IA</p>
                      </div>
                    )}

                    {selectedSummary.manual_summary && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Resumo Manual:</h4>
                        <div className="p-4 bg-blue-50 rounded-lg">{selectedSummary.manual_summary}</div>
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
