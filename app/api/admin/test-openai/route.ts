import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Buscar configurações da OpenAI
    const { data: apiKeySetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "openai_api_key")
      .single()

    const { data: modelSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "openai_model")
      .single()

    if (!apiKeySetting?.value || !apiKeySetting.value.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "❌ Chave da API OpenAI não configurada. Configure uma chave válida primeiro.",
        },
        { status: 400 },
      )
    }

    const apiKey = apiKeySetting.value.trim()
    const model = modelSetting?.value || "gpt-4o"

    // Validar formato da chave
    if (!apiKey.startsWith("sk-")) {
      return NextResponse.json(
        {
          success: false,
          error: "❌ Formato da chave inválido. A chave deve começar com 'sk-'",
        },
        { status: 400 },
      )
    }

    try {
      // Testar conexão com uma pergunta simples
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: "Responda apenas 'Olá! Integração funcionando perfeitamente.'",
            },
          ],
          max_tokens: 50,
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 401) {
          return NextResponse.json(
            {
              success: false,
              error: "❌ Chave da API inválida. Verifique se a chave está correta e ativa.",
            },
            { status: 400 },
          )
        }

        if (response.status === 429) {
          return NextResponse.json(
            {
              success: false,
              error: "❌ Cota da API excedida. Verifique seu plano e saldo na OpenAI.",
            },
            { status: 400 },
          )
        }

        if (response.status === 404) {
          return NextResponse.json(
            {
              success: false,
              error: `❌ Modelo '${model}' não encontrado. Verifique se você tem acesso a este modelo.`,
            },
            { status: 400 },
          )
        }

        return NextResponse.json(
          {
            success: false,
            error: `❌ Erro da API OpenAI: ${errorData.error?.message || "Erro desconhecido"}`,
          },
          { status: 400 },
        )
      }

      const data = await response.json()
      const testResponse = data.choices[0]?.message?.content || "Resposta recebida"

      return NextResponse.json({
        success: true,
        message: "✅ Integração OpenAI funcionando perfeitamente!",
        testResponse: testResponse,
        model: model,
      })
    } catch (fetchError: any) {
      console.error("OpenAI API fetch error:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "❌ Erro de conexão com a OpenAI. Verifique sua conexão com a internet.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error testing OpenAI:", error)
    return NextResponse.json(
      {
        success: false,
        error: "❌ Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
