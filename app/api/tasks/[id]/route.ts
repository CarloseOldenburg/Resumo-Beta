import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Atualizar tarefa
    const { data: task, error } = await supabase
      .from("tasks")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", defaultUser.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating task:", error)
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error in PATCH /api/tasks/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Verificar se a tarefa existe e pertence ao usuário
    const { data: existingTask } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", defaultUser.id)
      .single()

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 })
    }

    // Deletar tarefa
    const { error } = await supabase.from("tasks").delete().eq("id", params.id).eq("user_id", defaultUser.id)

    if (error) {
      console.error("Error deleting task:", error)
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/tasks/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
