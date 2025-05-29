"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  AlertTriangle,
  FileText,
  TrendingUp,
  Loader2,
  RefreshCw,
  Target,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DailySummary } from "@/lib/types"

interface DashboardStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  canceledTasks: number
  pausedTasks: number
  blockedTasks: number
  inProgressTasks: number
  totalSummaries: number
  recentSummaries: DailySummary[]
}

export default function ManagementDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    canceledTasks: 0,
    pausedTasks: 0,
    blockedTasks: 0,
    inProgressTasks: 0,
    totalSummaries: 0,
    recentSummaries: [],
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchDashboardData()
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const dashboardResponse = await fetch("/api/dashboard")

      if (!dashboardResponse.ok) {
        throw new Error(`API responded with status: ${dashboardResponse.status}`)
      }

      const dashboardData = await dashboardResponse.json()

      if (dashboardData.stats) {
        setStats(dashboardData.stats)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
  const productivityScore = Math.min(100, Math.round(stats.completedTasks * 10 + completionRate * 0.5))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Público */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold text-blue-600">Dashboard de Gestão</div>
            <Badge variant="secondary">Somente Leitura</Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Última atualização: {format(lastUpdate, "HH:mm:ss")}</span>
            <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acompanhamento de Produtividade</h1>
          <p className="text-gray-600">Visão executiva das atividades e performance da equipe de QA</p>
        </div>

        {loading && stats.totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Carregando métricas...</p>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                      <p className="text-xs text-gray-500 mt-1">Todas as atividades</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Concluídas</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
                      <p className="text-xs text-gray-500 mt-1">Finalizadas com sucesso</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                      <p className="text-3xl font-bold text-purple-600">{completionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">Eficiência geral</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Score Produtividade</p>
                      <p className="text-3xl font-bold text-orange-600">{productivityScore}</p>
                      <p className="text-xs text-gray-500 mt-1">Índice calculado</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição por Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-4 w-4 bg-blue-500 rounded-full mr-3" />
                        <span className="font-medium">Em Andamento</span>
                      </div>
                      <Badge className="bg-blue-500">{stats.inProgressTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-3" />
                        <span className="font-medium">Pendentes</span>
                      </div>
                      <Badge variant="outline">{stats.pendingTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        <span className="font-medium">Concluídas</span>
                      </div>
                      <Badge className="bg-green-500">{stats.completedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <Pause className="h-4 w-4 text-yellow-500 mr-3" />
                        <span className="font-medium">Pausadas</span>
                      </div>
                      <Badge className="bg-yellow-500">{stats.pausedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mr-3" />
                        <span className="font-medium">Bloqueadas</span>
                      </div>
                      <Badge className="bg-orange-500">{stats.blockedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-3" />
                        <span className="font-medium">Canceladas</span>
                      </div>
                      <Badge className="bg-red-500">{stats.canceledTasks}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Resumos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentSummaries.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentSummaries.map((summary) => (
                        <div key={summary.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">
                              {format(parseISO(summary.summary_date), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-gray-500">{format(parseISO(summary.created_at), "HH:mm")}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {summary.generated_summary ? (
                              <Badge variant="secondary">IA</Badge>
                            ) : (
                              <Badge variant="outline">Manual</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum resumo encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Indicadores de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Indicadores de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalSummaries}</div>
                    <div className="text-sm font-medium text-blue-800">Resumos Gerados</div>
                    <div className="text-xs text-blue-600 mt-1">Total acumulado</div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">{completionRate}%</div>
                    <div className="text-sm font-medium text-green-800">Taxa de Sucesso</div>
                    <div className="text-xs text-green-600 mt-1">Tarefas finalizadas</div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{productivityScore}</div>
                    <div className="text-sm font-medium text-purple-800">Índice Produtividade</div>
                    <div className="text-xs text-purple-600 mt-1">Score calculado</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rodapé com informações */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Dashboard atualizado automaticamente a cada 5 minutos</p>
              <p className="mt-1">Dados em tempo real do sistema QA Task Manager</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
