"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCurrentUser, logout } from "@/lib/auth"
import { Settings, Shield, LogOut, CheckCircle, Sparkles, BarChart3, Edit } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const user = getCurrentUser()
  const pathname = usePathname()
  const [appTitle, setAppTitle] = useState("Resumo Beta")

  useEffect(() => {
    fetchAppTitle()
  }, [])

  const fetchAppTitle = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch("/api/admin/settings", {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Settings API returned ${response.status}`)
        return
      }

      const text = await response.text()

      if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
        console.warn("Response is not JSON:", text.substring(0, 100))
        return
      }

      const settings = JSON.parse(text)

      if (Array.isArray(settings)) {
        const titleSetting = settings.find((s: any) => s.key === "app_name")
        if (titleSetting?.value) {
          setAppTitle(titleSetting.value)
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("Settings request timed out")
      } else {
        console.error("Error fetching app title:", error)
      }
      // Manter título padrão "Resumo Beta" em caso de erro
    }
  }

  const handleLogout = () => {
    logout()
  }

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <header className="border-b bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {appTitle}
          </Link>
          <nav className="hidden md:flex space-x-4">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/tarefas"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/tarefas")
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Tarefas</span>
            </Link>
            <Link
              href="/gerador-tarefas"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/gerador-tarefas")
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
              }`}
            >
              <Edit className="h-4 w-4" />
              <span>Gerador de Tarefas</span>
            </Link>
            <Link
              href="/gerar-resumo"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/gerar-resumo")
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Gerar Resumo</span>
            </Link>
            <Link
              href="/admin"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/admin")
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={user?.name || ""} />
                <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "R"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem className="flex-col items-start">
              <div className="font-medium">{user?.name || "Analista QA"}</div>
              <div className="text-xs text-gray-500">{user?.email || "qa@empresa.com"}</div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
