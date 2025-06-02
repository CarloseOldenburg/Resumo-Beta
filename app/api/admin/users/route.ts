import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

// Verificar se é super admin
function isSuperAdmin(email: string): boolean {
  return email === "carlos.oldenburg@videosoft.com.br"
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (simplificado para demo)
    const authHeader = request.headers.get("authorization")

    console.log("🔍 Buscando usuários...")

    const users = await sql`
      SELECT id, email, name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `

    console.log("✅ Usuários encontrados:", users.length)

    return NextResponse.json(users)
  } catch (error) {
    console.error("❌ Erro ao buscar usuários:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = "user" } = await request.json()

    console.log("👤 Criando usuário:", { email, name, role })

    // Verificar se usuário já existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Usuário já existe" }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const newUser = await sql`
      INSERT INTO users (email, password, name, role, created_at)
      VALUES (${email}, ${hashedPassword}, ${name}, ${role}, NOW())
      RETURNING id, email, name, role, created_at
    `

    console.log("✅ Usuário criado:", newUser[0])

    return NextResponse.json(newUser[0])
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    console.log("🔄 Atualizando papel do usuário:", { userId, role })

    const updatedUser = await sql`
      UPDATE users 
      SET role = ${role}
      WHERE id = ${userId}
      RETURNING id, email, name, role, created_at
    `

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    console.log("✅ Papel atualizado:", updatedUser[0])

    return NextResponse.json(updatedUser[0])
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    console.log("🗑️ Deletando usuário:", userId)

    // Verificar se não é o super admin
    const user = await sql`
      SELECT email FROM users WHERE id = ${userId}
    `

    if (user.length > 0 && user[0].email === "carlos.oldenburg@videosoft.com.br") {
      return NextResponse.json({ error: "Não é possível deletar o super admin" }, { status: 400 })
    }

    // Deletar tarefas do usuário primeiro
    await sql`DELETE FROM tasks WHERE user_id = ${userId}`

    // Deletar resumos do usuário
    await sql`DELETE FROM daily_summaries WHERE user_id = ${userId}`

    // Deletar usuário
    await sql`DELETE FROM users WHERE id = ${userId}`

    console.log("✅ Usuário deletado com sucesso")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erro ao deletar usuário:", error)
    return NextResponse.json({ error: "Erro ao deletar usuário" }, { status: 500 })
  }
}
