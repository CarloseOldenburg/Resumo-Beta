import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Verificar credenciais com as variáveis de ambiente
    const validEmail = process.env.ADMIN_EMAIL || "carlos.oldenburg@videosoft.com.br"
    const validPassword = process.env.ADMIN_PASSWORD || "Hyef5784zqls@"

    if (email === validEmail && password === validPassword) {
      // Gerar um token simples (em produção, use JWT)
      const token = Buffer.from(`${email}:${Date.now()}`).toString("base64")

      return NextResponse.json({
        success: true,
        token,
        user: {
          email,
          name: "Analista QA",
          role: "admin",
        },
      })
    }

    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
