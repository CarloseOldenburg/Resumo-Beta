import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Deletar todos os resumos diários do usuário
    const { error } = await supabase.from("daily_summaries").delete().eq("user_id", defaultUser.id)

    if (error) {
      console.error("Error clearing history:", error)
      return NextResponse.json({ error: "Failed to clear history" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Histórico de dailies apagado com sucesso!" })
  } catch (error) {
    console.error("Error in DELETE /api/admin/clear-history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
