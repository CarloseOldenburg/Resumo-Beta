"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
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
  Calendar,
  Eye,
  Loader2,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
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

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
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

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData()
    }
  }, [authLoading, isAuthenticated])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Usar a nova API de dashboard para obter todas as estatísticas de uma vez
      const dashboardResponse = await fetch("/api/dashboard")

      if (!dashboardResponse.ok) {
        throw new Error(`API responded with status: ${dashboardResponse.status}`)
      }

      const dashboardData = await dashboardResponse.json()

      if (dashboardData.stats) {
        setStats(dashboardData.stats)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
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

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Visão geral das suas atividades e produtividade</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Concluídas</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                      <p className="text-3xl font-bold text-blue-600">{completionRate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resumos Gerados</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.totalSummaries}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento por Status */}
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Pendentes</span>
                      </div>
                      <Badge variant="outline">{stats.pendingTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">Concluídas</span>
                      </div>
                      <Badge className="bg-green-500">{stats.completedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-4 w-4 bg-blue-500 rounded-full mr-2" />
                        <span className="text-sm">Em Andamento</span>
                      </div>
                      <Badge className="bg-blue-500">{stats.inProgressTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Pause className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className="text-sm">Pausadas</span>
                      </div>
                      <Badge className="bg-yellow-500">{stats.pausedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-sm">Bloqueadas</span>
                      </div>
                      <Badge className="bg-orange-500">{stats.blockedTasks}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm">Canceladas</span>
                      </div>
                      <Badge className="bg-red-500">{stats.canceledTasks}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Resumos Recentes
                    </div>
                    <Link href="/resumos">
                      <Button variant="outline" size="sm">
                        Ver Todos
                      </Button>
                    </Link>
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
                              <Badge variant="secondary">Gerado</Badge>
                            ) : (
                              <Badge variant="outline">Manual</Badge>
                            )}
                            <Link href={`/resumos?date=${summary.summary_date}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum resumo encontrado</p>
                      <Link href="/gerar-resumo">
                        <Button size="sm" className="mt-2">
                          Gerar Primeiro Resumo
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link href="/tarefas">
                    <Button className="w-full" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Gerenciar Tarefas
                    </Button>
                  </Link>
                  <Link href="/gerar-resumo">
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Resumo
                    </Button>
                  </Link>
                  <Link href="/resumos">
                    <Button className="w-full" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Histórico
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button className="w-full" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Configurações
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
