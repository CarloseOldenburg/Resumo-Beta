import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Credenciais do sistema
const SYSTEM_CREDENTIALS = [
  {
    identifier: "carlos.oldenburg@videosoft.com.br",
    password: "Hyef5784zqls@",
    username: "admin",
    name: "Carlos Oldenburg",
  },
  {
    identifier: "admin",
    password: "Hyef5784zqls@",
    username: "admin",
    name: "Carlos Oldenburg",
  },
  {
    identifier: "usuario1@qamanager.com",
    password: "user123",
    username: "usuario1",
    name: "Usuário 1",
  },
  {
    identifier: "usuario1",
    password: "user123",
    username: "usuario1",
    name: "Usuário 1",
  },
  {
    identifier: "usuario2@qamanager.com",
    password: "user123",
    username: "usuario2",
    name: "Usuário 2",
  },
  {
    identifier: "usuario2",
    password: "user123",
    username: "usuario2",
    name: "Usuário 2",
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username } = body

    // Aceitar tanto email quanto username
    const identifier = email || username

    console.log("🔐 Tentativa de login:", { identifier, hasPassword: !!password })

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/usuário e senha são obrigatórios" }, { status: 400 })
    }

    // Verificar credenciais
    const credential = SYSTEM_CREDENTIALS.find((cred) => cred.identifier === identifier && cred.password === password)

    console.log("🔍 Credencial encontrada:", !!credential)

    if (!credential) {
      console.log("❌ Credenciais inválidas para:", identifier)
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 })
    }

    // Buscar usuário no banco
    const supabase = createServerClient()

    console.log("🔍 Buscando usuário no banco por email:", credential.identifier)

    // Buscar por email primeiro
    let { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", credential.identifier)
      .single()

    console.log("👤 Usuário encontrado no banco:", !!dbUser, userError?.message)

    if (!dbUser) {
      // Tentar criar o usuário se não existir
      console.log("🔧 Criando usuário no banco...")

      const userData = {
        email: credential.identifier.includes("@") ? credential.identifier : `${credential.username}@qamanager.com`,
        name: credential.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: newUser, error: createError } = await supabase.from("users").insert(userData).select().single()

      if (createError) {
        console.error("❌ Erro ao criar usuário:", createError)
        return NextResponse.json({ error: "Erro ao criar usuário no sistema" }, { status: 500 })
      }

      console.log("✅ Usuário criado com sucesso:", newUser.email)
      dbUser = newUser
    }

    // Atualizar último login se a coluna existir
    try {
      await supabase
        .from("users")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbUser.id)
    } catch (updateError) {
      console.log("⚠️ Não foi possível atualizar último login:", updateError)
    }

    console.log("✅ Login realizado com sucesso:", dbUser.email)

    // Gerar token
    const token = Buffer.from(`${dbUser.email}:${Date.now()}`).toString("base64")

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: dbUser.id,
        username: credential.username,
        email: dbUser.email,
        name: dbUser.name,
        role: credential.username === "admin" ? "admin" : "user",
      },
    })
  } catch (error) {
    console.error("💥 Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
