"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCurrentUser, logout } from "@/lib/auth"
import { Settings, Shield, LogOut, CheckCircle, Sparkles, BarChart3, Edit, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const user = getCurrentUser()
  const pathname = usePathname()
  const [appTitle, setAppTitle] = useState("Resumo Beta")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      href: "/tarefas",
      label: "Tarefas",
      icon: CheckCircle,
    },
    {
      href: "/gerador-tarefas",
      label: "Gerador de Tarefas",
      icon: Edit,
    },
    {
      href: "/gerar-resumo",
      label: "Gerar Resumo",
      icon: Sparkles,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Shield,
    },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {appTitle}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* User Menu */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-blue-500/20 transition-all"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" alt={user?.name || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "R"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <div className="font-medium text-sm">{user?.name || "Analista QA"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email || "qa@empresa.com"}</div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t dark:border-gray-700">
            <nav className="flex flex-col space-y-2 mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}

              {/* Mobile User Section */}
              <div className="border-t dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center space-x-3 px-4 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={user?.name || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                      {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "R"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{user?.name || "Analista QA"}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email || "qa@empresa.com"}</div>
                  </div>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                >
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
