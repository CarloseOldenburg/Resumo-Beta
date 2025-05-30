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

    // Contar tarefas antes de deletar
    const { count: taskCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", defaultUser.id)

    // Deletar todas as tarefas do usuário
    const { error } = await supabase.from("tasks").delete().eq("user_id", defaultUser.id)

    if (error) {
      console.error("Error clearing tasks:", error)
      return NextResponse.json({ error: "Failed to clear tasks" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${taskCount || 0} tarefas foram apagadas com sucesso`,
      deletedCount: taskCount || 0,
    })
  } catch (error) {
    console.error("Error in DELETE /api/admin/clear-tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
