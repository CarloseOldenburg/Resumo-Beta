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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
        </div>
      </div>
    )
  }

  if (isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Redirecionando...</h2>
        </div>
      </div>
    )
  }

  return <LoginForm />
}
