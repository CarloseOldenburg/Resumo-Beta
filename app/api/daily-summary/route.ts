import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Buscar resumo diário
    const { data: summary, error } = await supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", defaultUser.id)
      .eq("summary_date", date)
      .single()

    if (error && error.code === "PGRST116") {
      // Resumo não encontrado
      return NextResponse.json({ error: "Summary not found" }, { status: 404 })
    }

    if (error) {
      console.error("Error fetching summary:", error)
      return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 })
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error in GET /api/daily-summary:", error)
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

    // Verificar se já existe um resumo para esta data
    const { data: existingSummary } = await supabase
      .from("daily_summaries")
      .select("id")
      .eq("user_id", defaultUser.id)
      .eq("summary_date", body.summary_date)
      .single()

    let result
    if (existingSummary) {
      // Atualizar resumo existente
      const { data, error } = await supabase
        .from("daily_summaries")
        .update({
          manual_summary: body.manual_summary,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSummary.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating summary:", error)
        return NextResponse.json({ error: "Failed to update summary" }, { status: 500 })
      }

      result = data
    } else {
      // Criar novo resumo
      const { data, error } = await supabase
        .from("daily_summaries")
        .insert({
          user_id: defaultUser.id,
          summary_date: body.summary_date,
          manual_summary: body.manual_summary,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating summary:", error)
        return NextResponse.json({ error: "Failed to create summary" }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in POST /api/daily-summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
