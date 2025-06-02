import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Buscar o usuário padrão
    const { data: defaultUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", "admin@qamanager.com")
      .single()

    if (userError) {
      console.error("Error fetching default user:", userError)
      // Return empty array instead of error
      return NextResponse.json([])
    }

    if (!defaultUser) {
      console.log("Default user not found, returning empty array")
      return NextResponse.json([])
    }

    // Buscar todos os resumos diários
    const { data: summaries, error } = await supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", defaultUser.id)
      .order("summary_date", { ascending: false })

    if (error) {
      console.error("Error fetching summaries:", error)
      // Return empty array instead of error
      return NextResponse.json([])
    }

    return NextResponse.json(summaries || [])
  } catch (error) {
    console.error("Error in GET /api/daily-summary/history:", error)
    // Return empty array instead of error
    return NextResponse.json([])
  }
}
