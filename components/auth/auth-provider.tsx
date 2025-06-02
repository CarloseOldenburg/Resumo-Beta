"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

// Usuário padrão para desenvolvimento
const defaultUser: User = {
  id: "default-user-id",
  email: "admin@qamanager.com",
  name: "Analista QA",
  role: "admin",
  provider: "default",
  provider_id: "default",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      // Simular carregamento
      await new Promise((resolve) => setTimeout(resolve, 500))
      setUser(defaultUser)
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(defaultUser) // Sempre definir usuário padrão
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
