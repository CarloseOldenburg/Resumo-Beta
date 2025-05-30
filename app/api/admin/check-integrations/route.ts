import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar variáveis de ambiente relacionadas ao banco
    const dbVars = Object.keys(process.env).filter(
      (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES"),
    )

    const envDetails = dbVars.reduce(
      (acc, key) => {
        const value = process.env[key]
        acc[key] = {
          exists: !!value,
          isValidUrl: value ? value.startsWith("postgres://") || value.startsWith("postgresql://") : false,
          preview: value ? `${value.substring(0, 30)}...` : "undefined",
          length: value ? value.length : 0,
        }
        return acc
      },
      {} as Record<string, any>,
    )

    // Tentar conectar com Neon
    let neonStatus = {
      status: "error",
      message: "",
      details: null as any,
    }

    try {
      // Importar dinamicamente para capturar erros
      const { neon } = await import("@neondatabase/serverless")

      // Encontrar uma URL válida
      let databaseUrl = null
      for (const key of dbVars) {
        const url = process.env[key]
        if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
          databaseUrl = url
          break
        }
      }

      if (!databaseUrl) {
        neonStatus = {
          status: "error",
          message: "❌ Nenhuma URL válida de banco encontrada",
          details: { availableVars: envDetails },
        }
      } else {
        const sql = neon(databaseUrl)
        const result = await sql`SELECT current_database() as db_name, version() as version`

        neonStatus = {
          status: "success",
          message: `✅ Conectado ao banco: ${result[0]?.db_name}`,
          details: {
            database: result[0]?.db_name,
            version: result[0]?.version?.substring(0, 50) + "...",
            usedVar: dbVars.find((key) => process.env[key] === databaseUrl),
          },
        }
      }
    } catch (error) {
      neonStatus = {
        status: "error",
        message: `❌ Erro ao conectar com Neon: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        details: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
          stack: error instanceof Error ? error.stack?.substring(0, 200) : undefined,
        },
      }
    }

    // Verificar Groq
    let groqStatus = {
      status: "error",
      message: "",
      details: null as any,
    }

    try {
      const groqApiKey = process.env.GROQ_API_KEY

      if (!groqApiKey) {
        groqStatus = {
          status: "error",
          message: "❌ GROQ_API_KEY não encontrada",
          details: { error: "Variável GROQ_API_KEY não configurada" },
        }
      } else {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/models", {
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const text = await response.text()
            let data
            try {
              data = JSON.parse(text)
              groqStatus = {
                status: "success",
                message: `✅ Groq conectado - ${data.data?.length || 0} modelos disponíveis`,
                details: {
                  models: data.data?.slice(0, 3).map((m: any) => m.id) || [],
                  total: data.data?.length || 0,
                },
              }
            } catch (jsonError) {
              groqStatus = {
                status: "error",
                message: "❌ Erro ao processar resposta do Groq",
                details: {
                  responseText: text.substring(0, 100) + "...",
                  parseError: jsonError instanceof Error ? jsonError.message : "Erro desconhecido",
                },
              }
            }
          } else {
            const text = await response.text()
            groqStatus = {
              status: "error",
              message: `❌ Erro na API Groq: ${response.status}`,
              details: {
                status: response.status,
                statusText: response.statusText,
                responseText: text.substring(0, 100) + "...",
              },
            }
          }
        } catch (fetchError) {
          groqStatus = {
            status: "error",
            message: `❌ Erro ao fazer requisição para Groq: ${fetchError instanceof Error ? fetchError.message : "Erro desconhecido"}`,
            details: {
              error: fetchError instanceof Error ? fetchError.message : "Erro desconhecido",
            },
          }
        }
      }
    } catch (error) {
      groqStatus = {
        status: "error",
        message: `❌ Erro ao conectar com Groq: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        details: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
      }
    }

    return NextResponse.json({
      neon: neonStatus,
      groq: groqStatus,
      environment: envDetails,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro geral no diagnóstico",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
