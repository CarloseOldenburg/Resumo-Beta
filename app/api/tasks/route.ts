import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Buscar tarefas usando o usuário padrão
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", defaultUser.id)
      .order("created_at", { ascending: false })

    if (date) {
      query = query.eq("task_date", date)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error("Error fetching tasks:", error)
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }

    return NextResponse.json(tasks || [])
  } catch (error) {
    console.error("Error in GET /api/tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Criar tarefa usando o usuário padrão
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        user_id: defaultUser.id,
        title: body.title,
        description: body.description,
        task_date: body.task_date || new Date().toISOString().split("T")[0],
        tag: body.tag,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating task:", error)
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error in POST /api/tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
