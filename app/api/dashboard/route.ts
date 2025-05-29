import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Buscar todas as tarefas
    const { data: tasks, error: tasksError } = await supabase.from("tasks").select("*").eq("user_id", defaultUser.id)

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError)
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }

    // Buscar resumos
    const { data: summaries, error: summariesError } = await supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", defaultUser.id)
      .order("summary_date", { ascending: false })

    if (summariesError) {
      console.error("Error fetching summaries:", summariesError)
      return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 })
    }

    // Calcular estatísticas
    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter((t) => t.completed).length || 0
    const pendingTasks = tasks?.filter((t) => !t.completed && (!t.status || t.status === "pending")).length || 0
    const canceledTasks = tasks?.filter((t) => t.status === "canceled").length || 0
    const pausedTasks = tasks?.filter((t) => t.status === "paused").length || 0
    const blockedTasks = tasks?.filter((t) => t.status === "blocked").length || 0
    const inProgressTasks = tasks?.filter((t) => t.status === "in_progress").length || 0

    return NextResponse.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        canceledTasks,
        pausedTasks,
        blockedTasks,
        inProgressTasks,
        totalSummaries: summaries?.length || 0,
        recentSummaries: summaries?.slice(0, 5) || [],
      },
    })
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
