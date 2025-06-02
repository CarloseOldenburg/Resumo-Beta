import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("Dashboard API: Starting request")

    const supabase = createServerClient()

    // Verificar se o Supabase está configurado
    if (!supabase) {
      console.error("Dashboard API: Supabase client not available")
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Buscar o usuário padrão
    console.log("Dashboard API: Fetching default user")
    const { data: defaultUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", "admin@qamanager.com")
      .single()

    if (userError) {
      console.error("Dashboard API: Error fetching default user:", userError)
      // Se não encontrar o usuário, retornar dados vazios em vez de erro
      return NextResponse.json({
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          canceledTasks: 0,
          pausedTasks: 0,
          blockedTasks: 0,
          inProgressTasks: 0,
          totalSummaries: 0,
          averageTaskDuration: 0,
          recentSummaries: [],
        },
        message: "Default user not found. Please set up the database first.",
      })
    }

    if (!defaultUser) {
      console.log("Dashboard API: Default user not found")
      return NextResponse.json({
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          canceledTasks: 0,
          pausedTasks: 0,
          blockedTasks: 0,
          inProgressTasks: 0,
          totalSummaries: 0,
          averageTaskDuration: 0,
          recentSummaries: [],
        },
        message: "Default user not found. Please set up the database first.",
      })
    }

    console.log("Dashboard API: Default user found:", defaultUser.id)

    // Buscar todas as tarefas
    console.log("Dashboard API: Fetching tasks")
    const { data: tasks, error: tasksError } = await supabase.from("tasks").select("*").eq("user_id", defaultUser.id)

    if (tasksError) {
      console.error("Dashboard API: Error fetching tasks:", tasksError)
      // Continuar sem tarefas em vez de falhar
    }

    console.log("Dashboard API: Tasks found:", tasks?.length || 0)

    // Buscar resumos
    console.log("Dashboard API: Fetching summaries")
    const { data: summaries, error: summariesError } = await supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", defaultUser.id)
      .order("summary_date", { ascending: false })

    if (summariesError) {
      console.error("Dashboard API: Error fetching summaries:", summariesError)
      // Não é crítico, continuar sem resumos
    }

    console.log("Dashboard API: Summaries found:", summaries?.length || 0)

    // Garantir que tasks é um array
    const safeTasksArray = Array.isArray(tasks) ? tasks : []

    // Calcular estatísticas
    const totalTasks = safeTasksArray.length
    const completedTasks = safeTasksArray.filter((t) => t.completed === true).length
    const pendingTasks = safeTasksArray.filter((t) => !t.completed && (!t.status || t.status === "pending")).length
    const canceledTasks = safeTasksArray.filter((t) => t.status === "canceled").length
    const pausedTasks = safeTasksArray.filter((t) => t.status === "paused").length
    const blockedTasks = safeTasksArray.filter((t) => t.status === "blocked").length
    const inProgressTasks = safeTasksArray.filter((t) => t.status === "in_progress").length

    // Calcular duração média das tarefas concluídas usando created_at e updated_at
    let totalDurationDays = 0
    let tasksWithDuration = 0

    safeTasksArray.forEach((task) => {
      if (task.completed && task.created_at && task.updated_at) {
        try {
          const createdDate = new Date(task.created_at)
          const updatedDate = new Date(task.updated_at)

          // Verificar se as datas são válidas
          if (!isNaN(createdDate.getTime()) && !isNaN(updatedDate.getTime())) {
            const duration = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
            if (duration >= 0 && duration < 365) {
              // Máximo de 1 ano para evitar valores absurdos
              totalDurationDays += duration
              tasksWithDuration++
            }
          }
        } catch (dateError) {
          console.warn("Dashboard API: Invalid date in task:", task.id, dateError)
        }
      }
    })

    const averageTaskDuration =
      tasksWithDuration > 0 ? Math.round((totalDurationDays / tasksWithDuration) * 10) / 10 : 0

    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      canceledTasks,
      pausedTasks,
      blockedTasks,
      inProgressTasks,
      totalSummaries: Array.isArray(summaries) ? summaries.length : 0,
      averageTaskDuration,
      recentSummaries: Array.isArray(summaries) ? summaries.slice(0, 5) : [],
    }

    console.log("Dashboard API: Stats calculated:", stats)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Dashboard API: Unexpected error:", error)

    // Retornar dados vazios em caso de erro para não quebrar o frontend
    return NextResponse.json(
      {
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          canceledTasks: 0,
          pausedTasks: 0,
          blockedTasks: 0,
          inProgressTasks: 0,
          totalSummaries: 0,
          averageTaskDuration: 0,
          recentSummaries: [],
        },
        error: "Failed to load dashboard data. Please check database connection.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    ) // Retornar 200 para não quebrar o frontend
  }
}
