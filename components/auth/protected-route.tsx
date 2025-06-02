"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isUserAuthenticated } from "@/lib/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificação simples sem usar o hook useAuth para evitar loops
    const checkAuth = () => {
      const authenticated = isUserAuthenticated()

      if (!authenticated) {
        router.push("/login")
        return
      }

      setIsAuth(true)
      setIsChecking(false)
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Verificando autenticação...</h2>
        </div>
      </div>
    )
  }

  return isAuth ? <>{children}</> : null
}
