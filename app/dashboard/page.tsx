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
  ExternalLink,
  Zap,
  Target,
  Calendar,
  Activity,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200 dark:border-blue-800 mx-auto"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Necessário</h2>
            <p className="text-gray-600 dark:text-gray-400">Você precisa fazer login para acessar o dashboard.</p>
          </div>
          <Link href="/login">
            <Button size="lg" className="button-hover">
              <Users className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Visão geral das suas atividades e produtividade
              </p>
            </div>

            {/* Botão Dashboard de Gestão */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard-gestao">
                <Button
                  size="lg"
                  className="button-hover bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                >
                  <Activity className="h-5 w-5 mr-2" />
                  Dashboard de Gestão
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Warning State */}
        {warning && (
          <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl shadow-sm fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <Database className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold">Configuração Necessária</h3>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">{warning}</p>
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Configurar Banco de Dados
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-red-800 dark:text-red-200 font-semibold">Erro ao carregar dados</h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                <div className="flex gap-3 mt-3">
                  <Button
                    onClick={fetchDashboardData}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Verificar Configurações
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Carregando Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400">Buscando suas estatísticas mais recentes...</p>
          </div>
        ) : (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="card-hover status-card bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total de Tarefas</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Todas as tarefas</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover status-card bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Concluídas</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Finalizadas</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover status-card bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Taxa de Conclusão</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{completionRate}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Eficiência</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover status-card bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Duração Média</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.averageTaskDuration}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">dias por tarefa</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento por Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="card-hover bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Em Andamento", value: stats.inProgressTasks, color: "bg-blue-500", icon: Activity },
                      { label: "Concluídas", value: stats.completedTasks, color: "bg-green-500", icon: CheckCircle },
                      { label: "Pendentes", value: stats.pendingTasks, color: "bg-gray-500", icon: Clock },
                      { label: "Pausadas", value: stats.pausedTasks, color: "bg-yellow-500", icon: Pause },
                      { label: "Bloqueadas", value: stats.blockedTasks, color: "bg-orange-500", icon: AlertTriangle },
                      { label: "Canceladas", value: stats.canceledTasks, color: "bg-red-500", icon: XCircle },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className={`h-3 w-3 ${item.color} rounded-full mr-3`} />
                          <item.icon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {item.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center text-lg">
                      <FileText className="h-5 w-5 mr-3 text-green-600 dark:text-green-400" />
                      Resumos Recentes
                    </div>
                    <Link href="/resumos">
                      <Button variant="outline" size="sm" className="button-hover">
                        <Calendar className="h-4 w-4 mr-2" />
                        Ver Todos
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentSummaries.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentSummaries.slice(0, 5).map((summary, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white">
                                Resumo {index + 1}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Gerado recentemente</div>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            Concluído
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum resumo encontrado
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Comece criando seu primeiro resumo diário</p>
                      <Link href="/gerar-resumo">
                        <Button className="button-hover">
                          <Zap className="h-4 w-4 mr-2" />
                          Gerar Primeiro Resumo
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <Card className="card-hover bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      href: "/tarefas",
                      label: "Gerenciar Tarefas",
                      icon: CheckCircle,
                      color: "from-blue-500 to-blue-600",
                    },
                    {
                      href: "/gerador-tarefas",
                      label: "Gerador de Tarefas",
                      icon: Users,
                      color: "from-green-500 to-green-600",
                    },
                    {
                      href: "/gerar-resumo",
                      label: "Gerar Resumo",
                      icon: FileText,
                      color: "from-purple-500 to-purple-600",
                    },
                    { href: "/admin", label: "Configurações", icon: BarChart3, color: "from-orange-500 to-orange-600" },
                  ].map((action, index) => (
                    <Link key={index} href={action.href}>
                      <Button
                        className={`w-full h-20 button-hover bg-gradient-to-r ${action.color} hover:shadow-lg text-white border-0 flex-col space-y-2`}
                        variant="outline"
                      >
                        <action.icon className="h-6 w-6" />
                        <span className="font-medium">{action.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
