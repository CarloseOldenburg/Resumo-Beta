"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Database,
  Zap,
  Key,
  Server,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  Wifi,
  HardDrive,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemHealth {
  score: number
  status: "excellent" | "good" | "warning" | "critical"
  message: string
}

interface DiagnosticResult {
  database?: {
    status: string
    message: string
    details?: any
  }
  groq?: {
    status: string
    message: string
    details?: any
  }
  openai?: {
    status: string
    message: string
    details?: any
  }
  tables?: {
    status: string
    message: string
    details?: any
  }
  environment?: Record<string, any>
  system_health?: SystemHealth
}

export default function SystemMonitor() {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const { toast } = useToast()

  const runDiagnostic = async (showToast = true) => {
    try {
      setIsRunning(true)

      const response = await fetch("/api/admin/full-diagnostic")

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnosticResult(data)
      setLastUpdate(new Date())

      if (showToast) {
        const health = data.system_health
        if (health) {
          toast({
            title:
              health.status === "excellent"
                ? "✅ Sistema Saudável"
                : health.status === "good"
                  ? "🟡 Sistema OK"
                  : health.status === "warning"
                    ? "⚠️ Atenção Necessária"
                    : "🚨 Problemas Críticos",
            description: `Score: ${health.score}/100 - ${health.message}`,
            duration: 6000,
          })
        }
      }
    } catch (error) {
      console.error("Erro no diagnóstico:", error)
      toast({
        title: "❌ Erro no Diagnóstico",
        description: `Falha ao executar diagnóstico: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    // Executar diagnóstico inicial
    runDiagnostic(false)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (autoRefresh) {
      interval = setInterval(() => {
        runDiagnostic(false)
      }, 30000) // Atualizar a cada 30 segundos
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      case "error":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 dark:text-green-400"
      case "good":
        return "text-blue-600 dark:text-blue-400"
      case "warning":
        return "text-yellow-600 dark:text-yellow-400"
      case "critical":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Monitor do Sistema
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Monitoramento em tempo real da saúde do sistema</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={() => setAutoRefresh(!autoRefresh)} variant={autoRefresh ? "default" : "outline"} size="sm">
            <Wifi className="h-4 w-4 mr-1" />
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </Button>

          <Button onClick={() => runDiagnostic(true)} disabled={isRunning} size="sm">
            {isRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Score geral do sistema */}
      {diagnosticResult?.system_health && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Saúde Geral do Sistema
              </span>
              <Badge
                variant={
                  diagnosticResult.system_health.status === "excellent"
                    ? "default"
                    : diagnosticResult.system_health.status === "good"
                      ? "secondary"
                      : "destructive"
                }
                className="text-sm"
              >
                {diagnosticResult.system_health.score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={diagnosticResult.system_health.score} className="h-3" />
              <p className={`text-lg font-medium ${getHealthColor(diagnosticResult.system_health.status)}`}>
                {diagnosticResult.system_health.message}
              </p>
              {lastUpdate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
                  {autoRefresh && " • Atualizando automaticamente"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de componentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banco de Dados */}
        {diagnosticResult?.database && (
          <Card className={getStatusColor(diagnosticResult.database.status)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Banco de Dados
                </span>
                {getStatusIcon(diagnosticResult.database.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium mb-2">{diagnosticResult.database.message}</p>
              {diagnosticResult.database.details && (
                <div className="text-xs space-y-1">
                  {diagnosticResult.database.details.database && (
                    <p>
                      <strong>Database:</strong> {diagnosticResult.database.details.database}
                    </p>
                  )}
                  {diagnosticResult.database.details.connection && (
                    <p>
                      <strong>Conexão:</strong> {diagnosticResult.database.details.connection}
                    </p>
                  )}
                  {diagnosticResult.database.details.error && (
                    <div className="mt-2 p-2 bg-white/50 dark:bg-black/50 rounded text-red-600 dark:text-red-400">
                      <p>
                        <strong>Erro:</strong> {diagnosticResult.database.details.error}
                      </p>
                      {diagnosticResult.database.details.suggestion && (
                        <p>
                          <strong>Solução:</strong> {diagnosticResult.database.details.suggestion}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabelas */}
        {diagnosticResult?.tables && (
          <Card className={getStatusColor(diagnosticResult.tables.status)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Tabelas do Banco
                </span>
                {getStatusIcon(diagnosticResult.tables.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium mb-2">{diagnosticResult.tables.message}</p>
              {diagnosticResult.tables.details?.summary && (
                <div className="text-xs space-y-1">
                  <p>
                    <strong>Registros totais:</strong> {diagnosticResult.tables.details.summary.total_records}
                  </p>
                  <p>
                    <strong>Tabelas acessíveis:</strong> {diagnosticResult.tables.details.summary.accessible_tables}/
                    {diagnosticResult.tables.details.summary.total_tables}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Groq AI */}
        {diagnosticResult?.groq && (
          <Card className={getStatusColor(diagnosticResult.groq.status)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Groq AI (Principal)
                </span>
                {getStatusIcon(diagnosticResult.groq.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium mb-2">{diagnosticResult.groq.message}</p>
              {diagnosticResult.groq.details && (
                <div className="text-xs space-y-1">
                  {diagnosticResult.groq.details.model && (
                    <p>
                      <strong>Modelo:</strong> {diagnosticResult.groq.details.model}
                    </p>
                  )}
                  {diagnosticResult.groq.details.response && (
                    <p>
                      <strong>Teste:</strong> "{diagnosticResult.groq.details.response}"
                    </p>
                  )}
                  {diagnosticResult.groq.details.error && (
                    <div className="mt-2 p-2 bg-white/50 dark:bg-black/50 rounded text-red-600 dark:text-red-400">
                      <p>
                        <strong>Erro:</strong> {diagnosticResult.groq.details.error}
                      </p>
                      {diagnosticResult.groq.details.suggestion && (
                        <p>
                          <strong>Solução:</strong> {diagnosticResult.groq.details.suggestion}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* OpenAI */}
        {diagnosticResult?.openai && (
          <Card className={getStatusColor(diagnosticResult.openai.status)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  OpenAI (Backup)
                </span>
                {getStatusIcon(diagnosticResult.openai.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium mb-2">{diagnosticResult.openai.message}</p>
              {diagnosticResult.openai.details && (
                <div className="text-xs space-y-1">
                  {diagnosticResult.openai.details.model && (
                    <p>
                      <strong>Modelo:</strong> {diagnosticResult.openai.details.model}
                    </p>
                  )}
                  {diagnosticResult.openai.details.response && (
                    <p>
                      <strong>Teste:</strong> "{diagnosticResult.openai.details.response}"
                    </p>
                  )}
                  {diagnosticResult.openai.details.info && (
                    <p className="text-blue-600 dark:text-blue-400">{diagnosticResult.openai.details.info}</p>
                  )}
                  {diagnosticResult.openai.details.error && (
                    <div className="mt-2 p-2 bg-white/50 dark:bg-black/50 rounded text-red-600 dark:text-red-400">
                      <p>
                        <strong>Erro:</strong> {diagnosticResult.openai.details.error}
                      </p>
                      {diagnosticResult.openai.details.suggestion && (
                        <p>
                          <strong>Solução:</strong> {diagnosticResult.openai.details.suggestion}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informações do ambiente */}
      {diagnosticResult?.environment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Server className="h-5 w-5 mr-2" />
              Informações do Ambiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-400">Runtime</p>
                <p>{diagnosticResult.environment.runtime || "Node.js"}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-400">Ambiente</p>
                <p className="capitalize">{diagnosticResult.environment.deployment}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-400">Região</p>
                <p>{diagnosticResult.environment.region}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-400">Node.js</p>
                <p>{diagnosticResult.environment.node_version}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isRunning && !diagnosticResult && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Executando diagnóstico completo...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
