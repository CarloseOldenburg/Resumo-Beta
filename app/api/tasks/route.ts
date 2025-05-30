import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import type { CreateTaskData } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", defaultUser.id)
      .order("created_at", { ascending: false })

    // Filtros opcionais
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const clientTags = searchParams.get("clientTags")
    const includeOpen = searchParams.get("includeOpen")

    // Filtro por data específica
    if (date) {
      query = query.eq("start_date", date)
    }

    // Filtro por intervalo de datas
    if (startDate) {
      query = query.gte("start_date", startDate)
    }
    if (endDate) {
      query = query.lte("start_date", endDate)
    }

    // Filtro por status
    if (status) {
      const statusArray = status.split(",")
      query = query.in("status", statusArray)
    }

    // Filtro por tags de cliente
    if (clientTags) {
      const tagsArray = clientTags.split(",")
      query = query.overlaps("client_tags", tagsArray)
    }

    // Se includeOpen for true, buscar também tarefas sem data de fim
    if (includeOpen === "true" && !date && !startDate && !endDate) {
      // Buscar tarefas abertas (sem data de fim ou não completadas)
      const { data: openTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", defaultUser.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })

      if (openTasks) {
        return NextResponse.json(openTasks)
      }
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

    const taskData: CreateTaskData = {
      user_id: defaultUser.id,
      title: body.title,
      description: body.description,
      task_date: body.task_date || body.start_date || new Date().toISOString().split("T")[0],
      start_date: body.start_date || body.task_date || new Date().toISOString().split("T")[0],
      end_date: body.end_date,
      status: body.status || "in_progress",
      completed: body.status === "completed" || body.status === "canceled" || false,
      client_tags: body.client_tags || [],
    }

    const { data: task, error } = await supabase.from("tasks").insert(taskData).select().single()

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
