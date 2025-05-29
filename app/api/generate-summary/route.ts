import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Buscar o usuário padrão
    const { data: defaultUser } = await supabase.from("users").select("id").eq("email", "admin@qamanager.com").single()

    if (!defaultUser) {
      return NextResponse.json({ error: "Default user not found" }, { status: 404 })
    }

    // Buscar a chave da API OpenAI
    const { data: apiKeySetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "openai_api_key")
      .single()

    // Buscar o modelo da OpenAI
    const { data: modelSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "openai_model")
      .single()

    // Preparar os dados para o prompt
    const completedTasks = body.completed_tasks || []
    const manualSummary = body.manual_summary || ""
    const summaryDate = body.summary_date

    let generatedSummary = ""
    let usedFallback = false

    // Verificar se a API OpenAI está configurada e tentar usar
    if (apiKeySetting?.value && apiKeySetting.value.trim() && apiKeySetting.value.startsWith("sk-")) {
      const apiKey = apiKeySetting.value.trim()
      const model = modelSetting?.value || "gpt-4o"

      // Formatar as tarefas concluídas
      const tasksText = completedTasks.length
        ? completedTasks
            .map((task: any) => `- ${task.title}${task.description ? `: ${task.description}` : ""}`)
            .join("\n")
        : "Nenhuma tarefa concluída registrada."

      // Criar o prompt para o OpenAI
      const prompt = `
Você é um assistente que ajuda um analista de QA Testes Beta a criar resumos para reuniões diárias (daily). O resumo deve ser claro, objetivo e no formato: 
- O que fiz ontem
- O que farei hoje
- Impedimentos (se houver).

Dados fornecidos:
- Data: ${summaryDate}
- Tarefas concluídas: 
${tasksText}

- Resumo manual: 
${manualSummary || "Nenhum resumo manual fornecido."}

Por favor, gere um resumo profissional e conciso para a reunião daily, mantendo o formato solicitado.
`

      try {
        console.log("Tentando conectar com OpenAI...")

        // Chamar a API do OpenAI
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          generatedSummary = openaiData.choices[0].message.content
          console.log("Resumo gerado com sucesso pela OpenAI")
        } else {
          const errorData = await openaiResponse.json()
          console.warn("OpenAI API failed:", errorData)
          generatedSummary = generateFallbackSummary(completedTasks, manualSummary, summaryDate)
          usedFallback = true
        }
      } catch (error) {
        console.warn("OpenAI API error:", error)
        generatedSummary = generateFallbackSummary(completedTasks, manualSummary, summaryDate)
        usedFallback = true
      }
    } else {
      // Se não há chave da API válida, usar fallback
      console.warn("No valid OpenAI API key configured, using fallback summary")
      generatedSummary = generateFallbackSummary(completedTasks, manualSummary, summaryDate)
      usedFallback = true
    }

    // Salvar o resumo gerado no banco de dados
    const { data: existingSummary } = await supabase
      .from("daily_summaries")
      .select("id")
      .eq("user_id", defaultUser.id)
      .eq("summary_date", summaryDate)
      .single()

    let result
    if (existingSummary) {
      // Atualizar resumo existente
      const { data, error } = await supabase
        .from("daily_summaries")
        .update({
          manual_summary: manualSummary,
          generated_summary: generatedSummary,
          tasks_completed: completedTasks,
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
          summary_date: summaryDate,
          manual_summary: manualSummary,
          generated_summary: generatedSummary,
          tasks_completed: completedTasks,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating summary:", error)
        return NextResponse.json({ error: "Failed to create summary" }, { status: 500 })
      }

      result = data
    }

    // Adicionar informação se foi usado fallback
    result.usedFallback = usedFallback

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in POST /api/generate-summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Função para gerar resumo de fallback quando a OpenAI não está disponível
function generateFallbackSummary(completedTasks: any[], manualSummary: string, summaryDate: string): string {
  const date = new Date(summaryDate).toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let summary = `📋 RESUMO DAILY - ${date}\n\n`

  // O que fiz ontem/hoje
  summary += "🔸 O QUE FIZ:\n"
  if (completedTasks.length > 0) {
    completedTasks.forEach((task: any) => {
      summary += `• ${task.title}\n`
      if (task.description && !task.description.includes("- [")) {
        summary += `  ${task.description}\n`
      }
    })
  } else {
    summary += "• Nenhuma tarefa específica registrada no sistema\n"
  }

  if (manualSummary) {
    summary += `• ${manualSummary}\n`
  }

  summary += "\n🔸 O QUE FAREI HOJE:\n"
  summary += "• Continuar com as atividades de QA e testes\n"
  summary += "• Revisar e atualizar documentação de testes\n"
  summary += "• Acompanhar correções de bugs identificados\n"

  summary += "\n🔸 IMPEDIMENTOS:\n"

  // Verificar se há tarefas bloqueadas
  const blockedTasks = completedTasks.filter((task: any) => task.tag === "blocked")
  if (blockedTasks.length > 0) {
    blockedTasks.forEach((task: any) => {
      summary += `• ${task.title} - Bloqueado\n`
    })
  } else {
    summary += "• Nenhum impedimento no momento\n"
  }

  summary += "\n---\n"
  summary += "⚠️ Resumo gerado automaticamente (OpenAI indisponível)\n"
  summary += "💡 Configure sua chave da API OpenAI no painel administrativo para resumos mais detalhados"

  return summary
}
