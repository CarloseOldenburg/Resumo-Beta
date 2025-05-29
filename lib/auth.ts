"use client"

import { useState, useEffect } from "react"

// Tipos
export interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Função para login
export async function login(email: string, password: string): Promise<AuthState> {
  try {
    // Verificar credenciais via API
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        isAuthenticated: false,
        loading: false,
        error: data.error || "Falha na autenticação",
      }
    }

    // Salvar estado de autenticação com timestamp mais longo
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("authEmail", email)
    localStorage.setItem("authTimestamp", Date.now().toString())
    localStorage.setItem("authToken", data.token || "valid")

    return {
      isAuthenticated: true,
      loading: false,
      error: null,
    }
  } catch (error: any) {
    return {
      isAuthenticated: false,
      loading: false,
      error: error.message || "Erro ao fazer login",
    }
  }
}

// Função para logout
export function logout(): void {
  localStorage.removeItem("isAuthenticated")
  localStorage.removeItem("authEmail")
  localStorage.removeItem("authTimestamp")
  localStorage.removeItem("authToken")
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

  // Verificar se a sessão ainda é válida (30 dias)
  const now = Date.now()
  const timestamp = Number.parseInt(authTimestamp)
  const thirtyDays = 30 * 24 * 60 * 60 * 1000

  if (now - timestamp > thirtyDays) {
    logout()
    return false
  }

  return true
}

// Hook para verificar autenticação
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = isUserAuthenticated()

        setAuthState({
          isAuthenticated: authenticated,
          loading: false,
          error: null,
        })

        // Atualizar timestamp para manter a sessão ativa
        if (authenticated) {
          localStorage.setItem("authTimestamp", Date.now().toString())
        }
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
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
export function getCurrentUser() {
  if (typeof window === "undefined") return null

  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
  const email = localStorage.getItem("authEmail")

  if (!isAuthenticated || !email) return null

  return {
    email,
    name: "Analista QA",
    role: "admin",
  }
}
