import { type NextRequest, NextResponse } from "next/server"
import type { ClientTag } from "@/lib/types"

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      text,
      date: taskDate,
      clientTags: knownClientTags,
    }: { text: string; date: string; clientTags: ClientTag[] } = body

    if (!text || !taskDate) {
      return NextResponse.json({ error: "Texto e data são obrigatórios" }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY não configurada." }, { status: 500 })
    }

    const clientNames = knownClientTags.map((tag) => tag.name).join(", ")

    const prompt = `Analise o seguinte texto e extraia uma lista de tarefas. Para cada tarefa, forneça um título e, opcionalmente, uma descrição.
Se uma tarefa mencionar um cliente que está na lista de clientes conhecidos, inclua o nome desse cliente.

Texto do usuário: "${text}"
Clientes conhecidos: ${clientNames || "Nenhum cliente conhecido fornecido."}
A data para todas as tarefas é ${taskDate}.
O status padrão para todas as tarefas deve ser 'Em Andamento'.

Retorne APENAS um JSON válido no formato:
{
  "tasks": [
    {
      "title": "Título da tarefa",
      "description": "Descrição opcional",
      "clientName": "Nome do cliente se identificado"
    }
  ]
}

Não inclua texto adicional, apenas o JSON.`

    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      })

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json()
        throw new Error(`Groq API error: ${errorData.error?.message || "Unknown error"}`)
      }

      const groqData = await groqResponse.json()
      const content = groqData.choices[0].message.content

      // Parse the JSON response
      let parsedResult
      try {
        parsedResult = JSON.parse(content)
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Não foi possível extrair JSON válido da resposta")
        }
      }

      const processedTasks = parsedResult.tasks.map((task: any) => {
        const identifiedClientTags: string[] = []
        if (task.clientName) {
          const foundClient = knownClientTags.find((ct) => ct.name.toLowerCase() === task.clientName?.toLowerCase())
          if (foundClient) {
            identifiedClientTags.push(foundClient.name)
          }
        }
        return {
          title: task.title,
          description: task.description,
          start_date: taskDate,
          task_date: taskDate,
          status: "in_progress",
          completed: false,
          client_tags: identifiedClientTags,
        }
      })

      return NextResponse.json({ tasks: processedTasks })
    } catch (error) {
      console.error("Error with Groq API:", error)
      return NextResponse.json({ error: "Falha ao gerar tarefas com IA." }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating tasks with AI:", error)
    let errorMessage = "Falha ao gerar tarefas com IA."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
