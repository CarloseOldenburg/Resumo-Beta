import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET all client tags
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("client_tags").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching client tags:", error)
      return NextResponse.json({ error: "Failed to fetch client tags" }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/client-tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST a new client tag
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { name, color, description } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("client_tags")
      .insert([{ name, color: color || "#3B82F6", description }])
      .select()
      .single()

    if (error) {
      console.error("Error creating client tag:", error)
      if (error.code === "23505") {
        // Unique violation
        return NextResponse.json({ error: "Client tag with this name already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create client tag" }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/client-tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
