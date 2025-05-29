"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Save, Loader2, Calendar, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function ManualSummaryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return format(today, "yyyy-MM-dd")
  })
  const [manualSummary, setManualSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingSummary, setExistingSummary] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchExistingSummary()
    }
  }, [authLoading, isAuthenticated, selectedDate])

  const fetchExistingSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/daily-summary?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setExistingSummary(data)
        setManualSummary(data.manual_summary || "")
      } else if (response.status === 404) {
        setExistingSummary(null)
        setManualSummary("")
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveManualSummary = async () => {
    if (!manualSummary.trim()) {
      toast({
        title: "Aviso",
        description: "Digite um resumo antes de salvar",
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
          manual_summary: manualSummary,
        }),
      })

      if (!response.ok) throw new Error("Failed to save summary")

      const data = await response.json()
      setExistingSummary(data)

      toast({
        title: "Sucesso",
        description: "Resumo manual salvo com sucesso!",
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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isValidDate = selectedDate && !isNaN(Date.parse(selectedDate + "T00:00:00"))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resumo Manual</h1>
          <p className="text-gray-600">Escreva e salve seus resumos manuais durante o dia</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Seletor de Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Selecionar Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Data:{" "}
                  {isValidDate
                    ? format(new Date(selectedDate + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : selectedDate}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status do Resumo */}
          {existingSummary && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Resumo encontrado!</strong> Você já tem um resumo salvo para esta data.
                    {existingSummary.generated_summary && " (Também possui resumo gerado por IA)"}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Editor de Resumo Manual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Escrever Resumo Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Escreva aqui suas atividades do dia, observações importantes, impedimentos, próximos passos, etc.

Exemplo:
- Realizei testes na funcionalidade X
- Encontrei bug crítico no módulo Y
- Participei da reunião de alinhamento
- Próximo: revisar documentação Z"
                  value={manualSummary}
                  onChange={(e) => setManualSummary(e.target.value)}
                  rows={12}
                  className="min-h-[300px]"
                />
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{manualSummary.length} caracteres</span>
                  <span>Salve durante o dia e gere o resumo final depois</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={saveManualSummary} disabled={saving || !manualSummary.trim()} size="lg">
                  {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                  Salvar Resumo Manual
                </Button>

                {existingSummary && (
                  <Button variant="outline" onClick={() => setManualSummary("")} disabled={saving}>
                    Limpar
                  </Button>
                )}
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>💡 Dica:</strong> Use esta área para anotar suas atividades durante o dia. No final do
                  expediente, vá para <strong>"Gerar Resumo"</strong> para criar um resumo profissional combinando este
                  texto com suas tarefas concluídas.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
