"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
import TaskList from "@/components/tasks/task-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { format } from "date-fns"

export default function TasksPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return format(today, "yyyy-MM-dd")
  })

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const isToday = selectedDate === today

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Tarefas</h1>
          <p className="text-gray-600">Organize e acompanhe suas atividades diárias</p>
        </div>

        {/* Date Selector */}
        <Card className="mb-6">
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
              {!isToday && (
                <Button onClick={() => setSelectedDate(today)} variant="outline" size="sm">
                  Ir para Hoje
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <TaskList selectedDate={selectedDate} />
      </main>
    </div>
  )
}
