"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isUserAuthenticated } from "@/lib/auth"
import LoginForm from "@/components/auth/login-form"

export default function LoginPage() {
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Aplicar tema escuro imediatamente
    document.documentElement.classList.add("dark")

    // Verificação simples sem usar o hook useAuth para evitar loops
    const checkAuth = () => {
      try {
        const authenticated = isUserAuthenticated()
        setIsAuth(authenticated)

        if (authenticated) {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setIsAuth(false)
      } finally {
        setLoading(false)
      }
    }

    // Delay para evitar problemas de hidratação
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-t-2 border-purple-500 animate-ping mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold text-white">Carregando...</h2>
          <p className="text-gray-400 mt-2">Verificando autenticação</p>
        </div>
      </div>
    )
  }

  if (isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-t-2 border-blue-500 animate-ping mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold text-white">Redirecionando...</h2>
          <p className="text-gray-400 mt-2">Entrando no dashboard</p>
        </div>
      </div>
    )
  }

  return <LoginForm />
}
