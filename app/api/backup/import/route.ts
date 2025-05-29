import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const backupData = await request.json()

    // Validar estrutura do backup
    if (!backupData.version || !backupData.data) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 })
    }

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    let importedCount = 0

    // Importar tarefas
    if (backupData.data.tasks && Array.isArray(backupData.data.tasks)) {
      for (const task of backupData.data.tasks) {
        const { error } = await supabase
          .from("tasks")
          .upsert(
            {
              id: task.id,
              user_id: defaultUser.id,
              title: task.title,
              description: task.description,
              status: task.status,
              completed: task.completed,
              task_date: task.task_date,
              tag: task.tag,
              created_at: task.created_at,
              updated_at: task.updated_at,
            },
            { onConflict: "id" },
          )
          .select()

        if (!error) importedCount++
      }
    }

    // Importar resumos
    if (backupData.data.summaries && Array.isArray(backupData.data.summaries)) {
      for (const summary of backupData.data.summaries) {
        const { error } = await supabase
          .from("daily_summaries")
          .upsert(
            {
              id: summary.id,
              user_id: defaultUser.id,
              summary_date: summary.summary_date,
              manual_summary: summary.manual_summary,
              generated_summary: summary.generated_summary,
              tasks_completed: summary.tasks_completed,
              created_at: summary.created_at,
              updated_at: summary.updated_at,
            },
            { onConflict: "id" },
          )
          .select()

        if (!error) importedCount++
      }
    }

    // Importar configurações (apenas algumas chaves permitidas)
    if (backupData.data.settings && Array.isArray(backupData.data.settings)) {
      const allowedKeys = ["app_name", "app_description", "openai_model"]
      for (const setting of backupData.data.settings) {
        if (allowedKeys.includes(setting.key)) {
          await supabase
            .from("system_settings")
            .upsert(
              {
                key: setting.key,
                value: setting.value,
                description: setting.description,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "key" },
            )
            .select()
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backup importado com sucesso! ${importedCount} itens processados.`,
      imported: importedCount,
    })
  } catch (error) {
    console.error("Error importing backup:", error)
    return NextResponse.json({ error: "Failed to import backup" }, { status: 500 })
  }
}
