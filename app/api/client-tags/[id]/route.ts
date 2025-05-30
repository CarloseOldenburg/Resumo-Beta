import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// PUT (Update) a client tag
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params
    const body = await request.json()
    const { name, color, description } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("client_tags")
      .update({ name, color, description, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating client tag:", error)
      if (error.code === "23505") {
        // Unique violation
        return NextResponse.json({ error: "Client tag with this name already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to update client tag" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Client tag not found" }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/client-tags/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE a client tag
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id } = params

    const { data, error } = await supabase.from("client_tags").delete().eq("id", id).select().single()

    if (error) {
      console.error("Error deleting client tag:", error)
      return NextResponse.json({ error: "Failed to delete client tag" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Client tag not found or already deleted" }, { status: 404 })
    }
    return NextResponse.json({ message: "Client tag deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/client-tags/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
