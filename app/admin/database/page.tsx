"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"

interface TableStatus {
  success: boolean
  existingTables: string[]
  missingTables: string[]
  error?: string
}

export default function DatabaseManagementPage() {
  const [status, setStatus] = useState<TableStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const checkTables = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/check-tables")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Erro ao verificar tabelas:", error)
      setStatus({
        success: false,
        existingTables: [],
        missingTables: [],
        error: "Erro ao conectar com a API",
      })
    } finally {
      setLoading(false)
    }
  }

  const createTables = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/admin/check-tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (data.success) {
        // Verificar novamente após criar
        await checkTables()
      } else {
        console.error("Erro ao criar tabelas:", data.error)
      }
    } catch (error) {
      console.error("Erro ao criar tabelas:", error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gerenciamento do Banco de Dados</h1>
        <p className="text-muted-foreground">Verifique e configure as tabelas do banco de dados</p>
      </div>

      <div className="space-y-6">
        {/* Verificar Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status das Tabelas
            </CardTitle>
            <CardDescription>Verificar quais tabelas existem no banco de dados</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkTables} disabled={loading} className="mb-4">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Verificar Tabelas
                </>
              )}
            </Button>

            {status && (
              <div className="space-y-4">
                {status.success ? (
                  <>
                    {/* Tabelas Existentes */}
                    {status.existingTables.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Tabelas Existentes ({status.existingTables.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {status.existingTables.map((table) => (
                            <Badge key={table} variant="default" className="bg-green-100 text-green-800">
                              {table}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tabelas Faltando */}
                    {status.missingTables.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Tabelas Faltando ({status.missingTables.length})
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {status.missingTables.map((table) => (
                            <Badge key={table} variant="destructive">
                              {table}
                            </Badge>
                          ))}
                        </div>

                        <Button onClick={createTables} disabled={creating} variant="default">
                          {creating ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Criando Tabelas...
                            </>
                          ) : (
                            <>
                              <Database className="mr-2 h-4 w-4" />
                              Criar Tabelas Faltando
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Tudo OK */}
                    {status.missingTables.length === 0 && status.existingTables.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Todas as tabelas estão criadas! O banco está pronto para uso.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Erro: {status.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Clique em "Verificar Tabelas" para ver o status atual</li>
              <li>Se houver tabelas faltando, clique em "Criar Tabelas Faltando"</li>
              <li>
                Após criar todas as tabelas, teste o sistema em <code>/tarefas</code>
              </li>
              <li>Se ainda houver problemas, verifique os logs no console</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
