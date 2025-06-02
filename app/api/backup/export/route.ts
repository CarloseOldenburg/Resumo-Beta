import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("*").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Buscar todas as tarefas
    const { data: tasks } = await supabase.from("tasks").select("*").eq("user_id", defaultUser.id).order("created_at")

    // Buscar todos os resumos
    const { data: summaries } = await supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", defaultUser.id)
      .order("summary_date")

    // Buscar configurações do sistema
    const { data: settings } = await supabase.from("system_settings").select("*").order("key")

    // Criar backup completo
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      user: {
        id: defaultUser.id,
        email: defaultUser.email,
        name: defaultUser.name,
        role: defaultUser.role,
      },
      data: {
        tasks: tasks || [],
        summaries: summaries || [],
        settings: settings || [],
      },
      stats: {
        totalTasks: tasks?.length || 0,
        totalSummaries: summaries?.length || 0,
        totalSettings: settings?.length || 0,
      },
    }

    return NextResponse.json(backupData, {
      headers: {
        "Content-Disposition": `attachment; filename="qa-manager-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 })
  }
}
