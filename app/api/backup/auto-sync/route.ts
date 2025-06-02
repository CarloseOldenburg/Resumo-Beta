import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { action, data } = await request.json()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Gerar backup incremental baseado na ação
    let backupData = {
      timestamp: new Date().toISOString(),
      action,
      data,
      user_id: defaultUser.id,
    }

    // Salvar no localStorage do cliente (será feito no frontend)
    // Aqui podemos também salvar em um serviço externo se necessário

    return NextResponse.json({
      success: true,
      backup: backupData,
      message: "Sync realizado com sucesso",
    })
  } catch (error) {
    console.error("Error in auto-sync:", error)
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 })
  }
}
