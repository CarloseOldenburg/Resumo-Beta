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
  ArrowLeft,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DailySummary } from "@/lib/types"
import Link from "next/link"

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Header Público */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-md shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Dashboard de Gestão
            </div>
            <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">
              Somente Leitura
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Última atualização: {format(lastUpdate, "HH:mm:ss")}</span>
            <Button
              onClick={fetchDashboardData}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Atualizar
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 fade-in-up">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Acompanhamento de Produtividade
          </h1>
          <p className="text-gray-400">Visão executiva das atividades e performance da equipe de QA</p>
        </div>

        {loading && stats.totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-400">Carregando métricas...</p>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 fade-in-up animation-delay-100">
              <Card className="border-l-4 border-l-blue-500 bg-gray-800/50 border-gray-700 shadow-lg hover:shadow-blue-900/20 transition-all duration-300 hover:translate-y-[-2px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total de Tarefas</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.totalTasks}</p>
                      <p className="text-xs text-gray-500 mt-1">Todas as atividades</p>
                    </div>
                    <div className="p-3 bg-blue-900/30 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-gray-800/50 border-gray-700 shadow-lg hover:shadow-green-900/20 transition-all duration-300 hover:translate-y-[-2px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Concluídas</p>
                      <p className="text-3xl font-bold text-green-400 mt-1">{stats.completedTasks}</p>
                      <p className="text-xs text-gray-500 mt-1">Finalizadas com sucesso</p>
                    </div>
                    <div className="p-3 bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 bg-gray-800/50 border-gray-700 shadow-lg hover:shadow-purple-900/20 transition-all duration-300 hover:translate-y-[-2px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Taxa de Conclusão</p>
                      <p className="text-3xl font-bold text-purple-400 mt-1">{completionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">Eficiência geral</p>
                    </div>
                    <div className="p-3 bg-purple-900/30 rounded-lg">
                      <Target className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 bg-gray-800/50 border-gray-700 shadow-lg hover:shadow-orange-900/20 transition-all duration-300 hover:translate-y-[-2px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Score Produtividade</p>
                      <p className="text-3xl font-bold text-orange-400 mt-1">{productivityScore}</p>
                      <p className="text-xs text-gray-500 mt-1">Índice calculado</p>
                    </div>
                    <div className="p-3 bg-orange-900/30 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição por Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 fade-in-up animation-delay-200">
              <Card className="bg-gray-800/50 border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-100">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all">
                      <div className="flex items-center">
                        <div className="h-4 w-4 bg-blue-500 rounded-full mr-3" />
                        <span className="font-medium text-gray-200">Em Andamento</span>
                      </div>
                      <Badge className="bg-blue-900/70 text-blue-300 border-blue-700">{stats.inProgressTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-200">Pendentes</span>
                      </div>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {stats.pendingTasks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg hover:bg-green-900/30 transition-all">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                        <span className="font-medium text-gray-200">Concluídas</span>
                      </div>
                      <Badge className="bg-green-900/70 text-green-300 border-green-700">{stats.completedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg hover:bg-yellow-900/30 transition-all">
                      <div className="flex items-center">
                        <Pause className="h-4 w-4 text-yellow-500 mr-3" />
                        <span className="font-medium text-gray-200">Pausadas</span>
                      </div>
                      <Badge className="bg-yellow-900/70 text-yellow-300 border-yellow-700">{stats.pausedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-900/20 rounded-lg hover:bg-orange-900/30 transition-all">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mr-3" />
                        <span className="font-medium text-gray-200">Bloqueadas</span>
                      </div>
                      <Badge className="bg-orange-900/70 text-orange-300 border-orange-700">{stats.blockedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg hover:bg-red-900/30 transition-all">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-3" />
                        <span className="font-medium text-gray-200">Canceladas</span>
                      </div>
                      <Badge className="bg-red-900/70 text-red-300 border-red-700">{stats.canceledTasks}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-100">
                    <FileText className="h-5 w-5 mr-2 text-purple-400" />
                    Resumos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentSummaries.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentSummaries.map((summary) => (
                        <div
                          key={summary.id}
                          className="flex items-center justify-between p-3 border border-gray-700 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all"
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-200">
                              {format(parseISO(summary.summary_date), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="text-xs text-gray-500">{format(parseISO(summary.created_at), "HH:mm")}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {summary.generated_summary ? (
                              <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-700">
                                IA
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-600 text-gray-300">
                                Manual
                              </Badge>
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
            <Card className="bg-gray-800/50 border-gray-700 shadow-lg mb-8 fade-in-up animation-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-100">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
                  Indicadores de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-lg border border-blue-800/50 hover:border-blue-700/50 transition-all hover:shadow-lg hover:shadow-blue-900/20">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalSummaries}</div>
                    <div className="text-sm font-medium text-blue-300">Resumos Gerados</div>
                    <div className="text-xs text-blue-500/70 mt-1">Total acumulado</div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-green-900/30 to-green-800/10 rounded-lg border border-green-800/50 hover:border-green-700/50 transition-all hover:shadow-lg hover:shadow-green-900/20">
                    <div className="text-3xl font-bold text-green-400 mb-2">{completionRate}%</div>
                    <div className="text-sm font-medium text-green-300">Taxa de Sucesso</div>
                    <div className="text-xs text-green-500/70 mt-1">Tarefas finalizadas</div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-lg border border-purple-800/50 hover:border-purple-700/50 transition-all hover:shadow-lg hover:shadow-purple-900/20">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{productivityScore}</div>
                    <div className="text-sm font-medium text-purple-300">Índice Produtividade</div>
                    <div className="text-xs text-purple-500/70 mt-1">Score calculado</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rodapé com informações */}
            <div className="mt-8 text-center text-sm text-gray-500 fade-in-up animation-delay-400">
              <p>Dashboard atualizado automaticamente a cada 5 minutos</p>
              <p className="mt-1">Dados em tempo real do sistema QA Task Manager</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
