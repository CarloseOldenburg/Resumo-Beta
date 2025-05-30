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
  Loader2,
  Users,
  Database,
} from "lucide-react"
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
  averageTaskDuration: number
  recentSummaries: any[]
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
    averageTaskDuration: 0,
    recentSummaries: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData()
    }
  }, [authLoading, isAuthenticated])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      setWarning(null)

      console.log("Dashboard: Fetching data...")
      const response = await fetch("/api/dashboard")

      console.log("Dashboard: Response status:", response.status)

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Dashboard: Response data:", data)

      // Verificar se há erro na resposta
      if (data.error) {
        setError(data.error)
        if (data.details) {
          console.error("Dashboard error details:", data.details)
        }
      }

      // Verificar se há mensagem de aviso
      if (data.message) {
        setWarning(data.message)
      }

      // Garantir que todos os campos existam
      const safeStats = {
        totalTasks: data.stats?.totalTasks || 0,
        completedTasks: data.stats?.completedTasks || 0,
        pendingTasks: data.stats?.pendingTasks || 0,
        canceledTasks: data.stats?.canceledTasks || 0,
        pausedTasks: data.stats?.pausedTasks || 0,
        blockedTasks: data.stats?.blockedTasks || 0,
        inProgressTasks: data.stats?.inProgressTasks || 0,
        totalSummaries: data.stats?.totalSummaries || 0,
        averageTaskDuration: data.stats?.averageTaskDuration || 0,
        recentSummaries: data.stats?.recentSummaries || [],
      }

      setStats(safeStats)
      console.log("Dashboard: Stats set:", safeStats)
    } catch (error: any) {
      console.error("Dashboard: Erro ao carregar dashboard:", error)
      setError(error.message || "Erro desconhecido ao carregar dashboard")
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Você precisa fazer login para acessar o dashboard.</p>
          <Link href="/login">
            <Button>Fazer Login</Button>
          </Link>
        </div>
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

        {/* Warning State */}
        {warning && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">Configuração Necessária</p>
                <p className="text-yellow-700 text-sm">{warning}</p>
              </div>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="mt-2">
                Configurar Banco de Dados
              </Button>
            </Link>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-red-800 font-medium">Erro ao carregar dados</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button onClick={fetchDashboardData} variant="outline" size="sm">
                Tentar Novamente
              </Button>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Verificar Configurações
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white shadow-sm">
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

              <Card className="bg-white shadow-sm">
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

              <Card className="bg-white shadow-sm">
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

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Duração Média</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.averageTaskDuration} dias</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento por Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="bg-white shadow-sm">
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
                        <div className="h-4 w-4 bg-blue-500 rounded-full mr-2" />
                        <span className="text-sm">Em Andamento</span>
                      </div>
                      <Badge className="bg-blue-500">{stats.inProgressTasks}</Badge>
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
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Pendentes</span>
                      </div>
                      <Badge variant="outline">{stats.pendingTasks}</Badge>
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

              <Card className="bg-white shadow-sm">
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
                      {stats.recentSummaries.slice(0, 5).map((summary, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Resumo {index + 1}</div>
                            <div className="text-xs text-gray-500">Recente</div>
                          </div>
                          <Badge variant="secondary">Gerado</Badge>
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
            <Card className="bg-white shadow-sm">
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
                  <Link href="/gerador-tarefas">
                    <Button className="w-full" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Gerador de Tarefas
                    </Button>
                  </Link>
                  <Link href="/gerar-resumo">
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Resumo
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
