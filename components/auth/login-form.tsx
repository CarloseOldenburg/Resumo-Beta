"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/auth"
import { Loader2, LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "❌ Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    try {
      setLoading(true)
      const result = await login(email, password)

      if (result.isAuthenticated) {
        toast({
          title: "✅ Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
          duration: 6000,
        })
        // Usar redirecionamento direto em vez de router.push para evitar problemas de estado
        window.location.href = "/dashboard"
      } else {
        toast({
          title: "❌ Falha no login",
          description: result.error || "Credenciais inválidas",
          variant: "destructive",
          duration: 6000,
        })
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro no login",
        description: error.message || "Ocorreu um erro ao fazer login",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Resumo Beta</CardTitle>
          <CardDescription>Gerencie suas tarefas e gere resumos para daily meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
