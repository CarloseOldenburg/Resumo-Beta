"use client"

import { useState, useEffect } from "react"

// Tipos
export interface User {
  id: string
  email: string
  username: string
  name: string
  role: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}

// Função para login (aceita email ou username)
export async function login(identifier: string, password: string): Promise<AuthState> {
  try {
    console.log("🔐 Iniciando login para:", identifier)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: identifier, password }),
    })

    const data = await response.json()

    console.log("📡 Resposta da API:", { success: data.success, error: data.error })

    if (!response.ok) {
      return {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: data.error || "Falha na autenticação",
      }
    }

    // Salvar estado de autenticação
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("currentUser", JSON.stringify(data.user))
    localStorage.setItem("authToken", data.token)
    localStorage.setItem("authTimestamp", Date.now().toString())

    console.log("✅ Login salvo no localStorage:", data.user.email)

    return {
      isAuthenticated: true,
      user: data.user,
      loading: false,
      error: null,
    }
  } catch (error: any) {
    console.error("💥 Erro no login:", error)
    return {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: error.message || "Erro ao fazer login",
    }
  }
}

// Função para logout
export function logout(): void {
  localStorage.removeItem("isAuthenticated")
  localStorage.removeItem("currentUser")
  localStorage.removeItem("authToken")
  localStorage.removeItem("authTimestamp")
  window.location.href = "/login"
}

// Verificar se está autenticado
export function isUserAuthenticated(): boolean {
  if (typeof window === "undefined") return false

  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
  const authToken = localStorage.getItem("authToken")
  const authTimestamp = localStorage.getItem("authTimestamp")

  if (!isAuthenticated || !authToken || !authTimestamp) {
    return false
  }

  // Verificar se a sessão ainda é válida (7 dias)
  const now = Date.now()
  const timestamp = Number.parseInt(authTimestamp)
  const sevenDays = 7 * 24 * 60 * 60 * 1000

  if (now - timestamp > sevenDays) {
    logout()
    return false
  }

  return true
}

// Hook para verificar autenticação
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const checkAuth = () => {
      try {
        const authenticated = isUserAuthenticated()
        const userStr = localStorage.getItem("currentUser")
        const user = userStr ? JSON.parse(userStr) : null

        setAuthState({
          isAuthenticated: authenticated,
          user: authenticated ? user : null,
          loading: false,
          error: null,
        })

        // Atualizar timestamp para manter a sessão ativa
        if (authenticated) {
          localStorage.setItem("authTimestamp", Date.now().toString())
        }
      } catch (error) {
        console.error("❌ Erro ao verificar autenticação:", error)
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: "Erro ao verificar autenticação",
        })
      }
    }

    checkAuth()
  }, [])

  return authState
}

// Função para obter o usuário atual
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
  const userStr = localStorage.getItem("currentUser")

  if (!isAuthenticated || !userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// Função para obter token de autenticação
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}
