"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
import TaskList from "@/components/tasks/task-list"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Plus, BarChart3, Clock, Target } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

export default function TasksPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return format(today, "yyyy-MM-dd")
  })

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-gray-700 mx-auto"></div>
          </div>
          <p className="text-gray-400 font-medium">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  const formatDateDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString + "T00:00:00")
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <CheckCircle className="h-10 w-10 mr-4 text-blue-400" />
                Gerenciamento de Tarefas
              </h1>
              <p className="text-gray-400 text-lg">Organize e acompanhe suas atividades diárias</p>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/gerador-tarefas">
                <Button
                  size="lg"
                  className="button-hover bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Gerar com IA
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="button-hover bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg border-0"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-hover bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Tarefas de Hoje</p>
                  <p className="text-2xl font-bold text-white">-</p>
                  <p className="text-gray-500 text-xs mt-1">Em andamento</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Concluídas</p>
                  <p className="text-2xl font-bold text-green-400">-</p>
                  <p className="text-gray-500 text-xs mt-1">Finalizadas</p>
                </div>
                <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Tempo Médio</p>
                  <p className="text-2xl font-bold text-purple-400">-</p>
                  <p className="text-gray-500 text-xs mt-1">dias por tarefa</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List with Unified Filters */}
        <div className="fade-in">
          <TaskList selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </main>
    </div>
  )
}
