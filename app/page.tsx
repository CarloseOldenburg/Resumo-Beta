"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import Header from "@/components/layout/header"
import TaskList from "@/components/tasks/task-list"
import DailySummary from "@/components/daily/daily-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import type { SystemSettings } from "@/lib/types"

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return format(today, "yyyy-MM-dd")
  })
  const [appTitle, setAppTitle] = useState("QA Task Manager")
  const [appDescription, setAppDescription] = useState("Gerencie suas tarefas e gere resumos para suas dailies")
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [loading, isAuthenticated, router])

  const fetchAppSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const settings: SystemSettings[] = await response.json()

        const titleSetting = settings.find((s) => s.key === "app_name")
        const descriptionSetting = settings.find((s) => s.key === "app_description")

        if (titleSetting) setAppTitle(titleSetting.value)
        if (descriptionSetting) setAppDescription(descriptionSetting.value)
      }
    } catch (error) {
      console.error("Error fetching app settings:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{appTitle}</h1>
          <p className="text-gray-600">{appDescription}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <div>
            <TaskList selectedDate={selectedDate} />
          </div>

          {/* Daily Summary Section */}
          <div>
            <DailySummary selectedDate={selectedDate} />
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Estatísticas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">-</div>
                <div className="text-sm text-gray-600">Tarefas Hoje</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">-</div>
                <div className="text-sm text-gray-600">Concluídas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">-</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
