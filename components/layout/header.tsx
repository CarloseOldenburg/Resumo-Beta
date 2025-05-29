"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCurrentUser, logout } from "@/lib/auth"
import { Settings, Shield, LogOut, CheckCircle, FileText, Sparkles, BarChart3, Edit } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const user = getCurrentUser()
  const pathname = usePathname()
  const [appTitle, setAppTitle] = useState("QA Task Manager")

  useEffect(() => {
    fetchAppTitle()
  }, [])

  const fetchAppTitle = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const settings = await response.json()
        const titleSetting = settings.find((s: any) => s.key === "app_name")
        if (titleSetting?.value) {
          setAppTitle(titleSetting.value)
        }
      }
    } catch (error) {
      console.error("Error fetching app title:", error)
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
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold text-blue-600">
            {appTitle}
          </Link>
          <nav className="hidden md:flex space-x-4">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/tarefas"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/tarefas")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Tarefas</span>
            </Link>
            <Link
              href="/resumo-manual"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/resumo-manual")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              <Edit className="h-4 w-4" />
              <span>Resumo Manual</span>
            </Link>
            <Link
              href="/resumos"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/resumos")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Resumos</span>
            </Link>
            <Link
              href="/gerar-resumo"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/gerar-resumo")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Gerar Resumo</span>
            </Link>
            <Link
              href="/admin"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive("/admin") ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
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
                <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "Q"}</AvatarFallback>
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
