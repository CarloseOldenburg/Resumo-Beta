import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    console.log("🔄 Atualizando tarefa:", params.id, body)

    // Buscar o usuário padrão
    const { data: defaultUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", "admin@qamanager.com")
      .single()

    if (userError || !defaultUser) {
      console.log("⚠️ Usuário padrão não encontrado, usando fallback")
      // Fallback: buscar qualquer usuário admin
      const { data: adminUser } = await supabase.from("users").select("id").eq("role", "admin").limit(1).single()

      if (!adminUser) {
        return NextResponse.json({ error: "No admin user found" }, { status: 404 })
      }
    }

    const userId =
      defaultUser?.id || (await supabase.from("users").select("id").eq("role", "admin").limit(1).single()).data?.id

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Primeiro, verificar se a tarefa existe
    const { data: existingTask, error: checkError } = await supabase
      .from("tasks")
      .select("id, user_id")
      .eq("id", params.id)
      .single()

    if (checkError || !existingTask) {
      console.error("❌ Tarefa não encontrada:", checkError)
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Atualizar tarefa
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    console.log("📝 Dados para atualização:", updateData)

    const { data: task, error } = await supabase.from("tasks").update(updateData).eq("id", params.id).select().single()

    if (error) {
      console.error("❌ Erro ao atualizar tarefa:", error)
      return NextResponse.json({ error: "Failed to update task: " + error.message }, { status: 500 })
    }

    if (!task) {
      console.error("❌ Nenhuma tarefa retornada após atualização")
      return NextResponse.json({ error: "No task returned after update" }, { status: 500 })
    }

    console.log("✅ Tarefa atualizada com sucesso:", task)
    return NextResponse.json(task)
  } catch (error) {
    console.error("💥 Erro interno na atualização:", error)
    return NextResponse.json({ error: "Internal server error: " + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    console.log("🗑️ Deletando tarefa:", params.id)

    // Buscar o usuário padrão
    const { data: defaultUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", "admin@qamanager.com")
      .single()

    if (userError || !defaultUser) {
      console.log("⚠️ Usuário padrão não encontrado, usando fallback")
      // Fallback: buscar qualquer usuário admin
      const { data: adminUser } = await supabase.from("users").select("id").eq("role", "admin").limit(1).single()

      if (!adminUser) {
        return NextResponse.json({ error: "No admin user found" }, { status: 404 })
      }
    }

    // Primeiro, verificar se a tarefa existe
    const { data: existingTask, error: checkError } = await supabase
      .from("tasks")
      .select("id, user_id")
      .eq("id", params.id)
      .single()

    if (checkError || !existingTask) {
      console.error("❌ Tarefa não encontrada para deletar:", checkError)
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Deletar tarefa
    const { error } = await supabase.from("tasks").delete().eq("id", params.id)

    if (error) {
      console.error("❌ Erro ao deletar tarefa:", error)
      return NextResponse.json({ error: "Failed to delete task: " + error.message }, { status: 500 })
    }

    console.log("✅ Tarefa deletada com sucesso")
    return NextResponse.json({ success: true, message: "Task deleted successfully" })
  } catch (error) {
    console.error("💥 Erro interno na deleção:", error)
    return NextResponse.json({ error: "Internal server error: " + (error as Error).message }, { status: 500 })
  }
}
