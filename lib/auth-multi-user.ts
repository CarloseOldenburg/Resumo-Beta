"use client"

import { useState, useEffect } from "react"

// Tipos
export interface User {
  id: string
  email: string
  username: string
  name: string
  role: string
  is_active: boolean
  last_login?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}

// Usuários padrão do sistema (senhas serão hasheadas)
const DEFAULT_USERS = [
  {
    username: "admin",
    email: "admin@qamanager.com",
    password: "admin123",
    name: "Administrador",
    role: "admin",
  },
  {
    username: "user1",
    email: "user1@qamanager.com",
    password: "user123",
    name: "Usuário 1",
    role: "user",
  },
  {
    username: "user2",
    email: "user2@qamanager.com",
    password: "user123",
    name: "Usuário 2",
    role: "user",
  },
]

// Função para hash de senha (simulada no cliente para demo)
function hashPassword(password: string): string {
  // Em produção, isso seria feito no servidor
  return btoa(password + "salt_qa_manager")
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Função para login
export async function login(username: string, password: string): Promise<AuthState> {
  try {
    // Verificar credenciais via API
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

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
    localStorage.setItem("authToken", data.token || "valid")
    localStorage.setItem("authTimestamp", Date.now().toString())

    return {
      isAuthenticated: true,
      user: data.user,
      loading: false,
      error: null,
    }
  } catch (error: any) {
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

// Função para obter usuários disponíveis (para tela de login)
export function getAvailableUsers() {
  return DEFAULT_USERS.map((user) => ({
    username: user.username,
    name: user.name,
    role: user.role,
  }))
}
