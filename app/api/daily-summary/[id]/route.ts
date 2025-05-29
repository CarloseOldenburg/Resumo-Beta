import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Deletar resumo
    const { error } = await supabase.from("daily_summaries").delete().eq("id", params.id).eq("user_id", defaultUser.id)

    if (error) {
      console.error("Error deleting summary:", error)
      return NextResponse.json({ error: "Failed to delete summary" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/daily-summary/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
