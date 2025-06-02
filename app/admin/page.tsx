"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import AdminPanel from "@/components/admin/admin-panel"
import { getCurrentUser } from "@/lib/auth"
import { Shield, Settings } from "lucide-react"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Aplicar tema escuro imediatamente
    document.documentElement.classList.add("dark")

    const checkAuth = () => {
      try {
        const currentUser = getCurrentUser()

        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)
        setLoading(false)
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/login")
      }
    }

    // Small delay to prevent flash
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="text-center relative z-10 fade-in">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-t-2 border-purple-500 animate-ping mx-auto"></div>
              <Shield className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Carregando Painel Administrativo</h2>
            <p className="text-gray-400">Verificando permissões de acesso...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/3 rounded-full blur-3xl"></div>
      </div>

      <Header />
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="fade-in">
          {/* Header da página admin */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Gerencie configurações do sistema, monitore integrações e controle usuários com ferramentas avançadas
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
          </div>

          <AdminPanel />
        </div>
      </main>
    </div>
  )
}
