import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  // Default settings to return on any error
  const defaultSettings = [
    { key: "app_name", value: "Resumo Beta", description: "Nome da aplicação" },
    {
      key: "app_description",
      value: "Gerencie suas tarefas e gere resumos para daily meetings",
      description: "Descrição da aplicação",
    },
    { key: "openai_api_key", value: "", description: "Chave da API OpenAI" },
    { key: "openai_model", value: "gpt-4o", description: "Modelo da OpenAI" },
  ]

  try {
    const supabase = createServerClient()

    // Add a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 5000))

    const queryPromise = supabase.from("system_settings").select("*").order("key")

    const { data: settings, error } = (await Promise.race([queryPromise, timeoutPromise])) as any

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(defaultSettings)
    }

    if (!settings || settings.length === 0) {
      // Try to insert default settings
      try {
        await supabase.from("system_settings").insert(defaultSettings)
      } catch (insertError) {
        console.error("Error inserting default settings:", insertError)
      }
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error in settings API:", error)
    return NextResponse.json(defaultSettings)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 })
    }

    // First, check if the setting exists
    const { data: existingSetting } = await supabase.from("system_settings").select("*").eq("key", key).maybeSingle()

    let result

    if (existingSetting) {
      // Update existing setting
      const { data: updatedSetting, error: updateError } = await supabase
        .from("system_settings")
        .update({
          value,
          updated_at: new Date().toISOString(),
        })
        .eq("key", key)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating setting:", updateError)
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
      }

      result = updatedSetting
    } else {
      // Create new setting
      const { data: newSetting, error: insertError } = await supabase
        .from("system_settings")
        .insert({
          key,
          value,
          description: getDefaultDescription(key),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating setting:", insertError)
        return NextResponse.json({ error: "Failed to create setting" }, { status: 500 })
      }

      result = newSetting
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in PATCH /api/admin/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getDefaultDescription(key: string): string {
  const descriptions: Record<string, string> = {
    app_name: "Nome da aplicação que aparece no header",
    app_description: "Descrição da aplicação",
    openai_api_key: "Chave da API OpenAI para geração de resumos",
    openai_model: "Modelo da OpenAI a ser utilizado",
  }

  return descriptions[key] || "Configuração do sistema"
}
