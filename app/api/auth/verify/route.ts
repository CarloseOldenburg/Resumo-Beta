import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Esta rota simplesmente retorna válido, pois a verificação real
    // é feita no cliente comparando com as credenciais armazenadas
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json({ valid: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
