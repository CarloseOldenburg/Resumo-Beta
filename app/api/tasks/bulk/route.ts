import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import type { CreateTaskData } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { tasks, date: defaultDate }: { tasks: CreateTaskData[]; date?: string } = body

    console.log("Received bulk tasks request:", { tasksCount: tasks?.length, defaultDate })

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: "Nenhuma tarefa fornecida para salvar" }, { status: 400 })
    }

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      console.error("Default user not found")
      return NextResponse.json({ error: "Usuário padrão não encontrado" }, { status: 404 })
    }

    console.log("Default user found:", defaultUser.id)

    const tasksToInsert = tasks.map((task) => {
      const taskDate = task.task_date || task.start_date || defaultDate || new Date().toISOString().split("T")[0]

      return {
        user_id: defaultUser.id,
        title: task.title,
        description: task.description || null,
        task_date: taskDate,
        start_date: task.start_date || taskDate,
        end_date: task.end_date || null,
        status: task.status || "in_progress",
        completed: task.status === "completed" || task.status === "canceled" || false,
        client_tags: task.client_tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    console.log("Tasks to insert:", tasksToInsert)

    const { data: insertedTasks, error } = await supabase.from("tasks").insert(tasksToInsert).select()

    if (error) {
      console.error("Error bulk inserting tasks:", error)
      return NextResponse.json(
        {
          error: "Falha ao salvar tarefas em lote",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Tasks inserted successfully:", insertedTasks?.length)

    return NextResponse.json({
      success: true,
      tasks: insertedTasks,
      count: insertedTasks?.length || 0,
      message: `${insertedTasks?.length || 0} tarefas salvas com sucesso`,
    })
  } catch (error) {
    console.error("Error in POST /api/tasks/bulk:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
