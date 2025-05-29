import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Buscar configurações (sem verificação de autenticação para desenvolvimento)
    const { data: settings, error } = await supabase.from("system_settings").select("*").order("key")

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json(settings || [])
  } catch (error) {
    console.error("Error in GET /api/admin/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 })
    }

    // Primeiro, verificar se a configuração já existe
    const { data: existingSetting, error: fetchError } = await supabase
      .from("system_settings")
      .select("*")
      .eq("key", key)
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking existing setting:", fetchError)
      return NextResponse.json({ error: "Failed to check existing setting" }, { status: 500 })
    }

    let result

    if (existingSetting) {
      // Atualizar configuração existente
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
      // Criar nova configuração
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

// Função auxiliar para obter descrições padrão
function getDefaultDescription(key: string): string {
  const descriptions: Record<string, string> = {
    app_name: "Nome da aplicação que aparece no header",
    app_description: "Descrição da aplicação",
    openai_api_key: "Chave da API OpenAI para geração de resumos",
    openai_model: "Modelo da OpenAI a ser utilizado",
  }

  return descriptions[key] || "Configuração do sistema"
}
