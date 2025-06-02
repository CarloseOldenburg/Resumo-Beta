import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import type { CreateTaskData } from "@/lib/types"

// Função para obter usuário atual (simplificada)
async function getCurrentUser() {
  try {
    const supabase = createServerClient()

    // Por enquanto, vamos usar sempre o usuário admin como fallback
    // Isso garante que o sistema funcione enquanto implementamos a autenticação completa
    const { data: adminUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", "carlos.oldenburg@videosoft.com.br")
      .single()

    if (adminUser) {
      console.log("✅ Usuário encontrado:", adminUser.email)
      return adminUser
    }

    // Se não encontrar, criar o usuário
    console.log("🔄 Criando usuário padrão...")
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        email: "carlos.oldenburg@videosoft.com.br",
        username: "admin",
        name: "Carlos Oldenburg",
        role: "admin",
      })
      .select()
      .single()

    if (createError) {
      console.error("❌ Erro ao criar usuário:", createError)
      throw createError
    }

    console.log("✅ Usuário criado:", newUser.email)
    return newUser
  } catch (error) {
    console.error("❌ Erro ao obter usuário:", error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    console.log("🔍 Iniciando busca de tarefas...")

    // Obter usuário atual
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      console.error("❌ Nenhum usuário encontrado")
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    console.log(`📋 Buscando tarefas para: ${currentUser.email} (ID: ${currentUser.id})`)

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })

    // Aplicar filtros
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const clientTags = searchParams.get("clientTags")
    const includeOpen = searchParams.get("includeOpen")

    if (date) {
      query = query.eq("start_date", date)
      console.log("🗓️ Filtro por data:", date)
    }

    if (startDate) {
      query = query.gte("start_date", startDate)
      console.log("📅 Data início:", startDate)
    }
    if (endDate) {
      query = query.lte("start_date", endDate)
      console.log("📅 Data fim:", endDate)
    }

    if (status) {
      const statusArray = status.split(",")
      query = query.in("status", statusArray)
      console.log("🏷️ Status:", statusArray)
    }

    if (clientTags) {
      const tagsArray = clientTags.split(",")
      query = query.overlaps("client_tags", tagsArray)
      console.log("🏷️ Tags:", tagsArray)
    }

    if (includeOpen === "true" && !date && !startDate && !endDate) {
      console.log("🔓 Buscando apenas tarefas abertas...")
      const { data: openTasks, error: openError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })

      if (openError) {
        console.error("❌ Erro ao buscar tarefas abertas:", openError)
        return NextResponse.json({ error: "Failed to fetch open tasks" }, { status: 500 })
      }

      console.log(`✅ Encontradas ${openTasks?.length || 0} tarefas abertas`)
      return NextResponse.json(openTasks || [])
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error("❌ Erro ao buscar tarefas:", error)
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }

    console.log(`✅ Encontradas ${tasks?.length || 0} tarefas para ${currentUser.email}`)
    return NextResponse.json(tasks || [])
  } catch (error) {
    console.error("💥 Erro geral na API de tarefas:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    console.log("➕ Criando nova tarefa...")

    // Obter usuário atual
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      console.error("❌ Usuário não encontrado para criar tarefa")
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    console.log(`📝 Criando tarefa para: ${currentUser.email}`)

    const taskData: CreateTaskData = {
      user_id: currentUser.id,
      title: body.title,
      description: body.description,
      task_date: body.task_date || body.start_date || new Date().toISOString().split("T")[0],
      start_date: body.start_date || body.task_date || new Date().toISOString().split("T")[0],
      end_date: body.end_date,
      status: body.status || "in_progress",
      completed: body.status === "completed" || body.status === "canceled" || false,
      client_tags: body.client_tags || [],
    }

    console.log("📋 Dados da tarefa:", taskData)

    const { data: task, error } = await supabase.from("tasks").insert(taskData).select().single()

    if (error) {
      console.error("❌ Erro ao criar tarefa:", error)
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
    }

    console.log(`✅ Tarefa criada: ${task.id} - ${task.title}`)
    return NextResponse.json(task)
  } catch (error) {
    console.error("💥 Erro ao criar tarefa:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
