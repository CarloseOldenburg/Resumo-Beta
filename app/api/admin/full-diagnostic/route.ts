import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const results: any = {
    database: { status: "error", message: "Não testado" },
    tables: { status: "error", message: "Não testado" },
    groq: { status: "error", message: "Não testado" },
    openai: { status: "warning", message: "Não configurado" },
    environment: {},
  }

  try {
    // 1. Testar conexão com Neon Database usando a lib correta
    try {
      const { sql } = await import("@/lib/neon")
      const dbTest = await sql`SELECT NOW() as current_time, version() as version, current_database() as db_name`

      results.database = {
        status: "success",
        message: "✅ Conexão com Neon estabelecida com sucesso",
        details: {
          database: dbTest[0]?.db_name,
          timestamp: dbTest[0]?.current_time,
          version: dbTest[0]?.version?.substring(0, 50) + "...",
          connection: "Neon Serverless",
        },
      }
    } catch (error) {
      results.database = {
        status: "error",
        message: "❌ Falha na conexão com Neon Database",
        details: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
          suggestion: "Verifique se a variável NEON_DATABASE_URL_NEON está configurada corretamente",
          env_check: {
            DATABASE_URL_NEON: !!process.env.DATABASE_URL_NEON,
            NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
            NEON_NEON_DATABASE_URL_NEON: !!process.env.NEON_NEON_DATABASE_URL_NEON,
          },
        },
      }
    }

    // 2. Testar tabelas do banco
    try {
      const supabase = createServerClient()

      // Verificar tabelas principais
      const tables = ["users", "tasks", "daily_summaries", "system_settings", "client_tags"]
      const tableResults = []

      for (const table of tables) {
        try {
          const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

          if (error) {
            tableResults.push({
              table,
              count: 0,
              status: "error",
              error: error.message,
            })
          } else {
            tableResults.push({
              table,
              count: count || 0,
              status: "ok",
              health: count === 0 ? "empty" : count > 1000 ? "large" : "normal",
            })
          }
        } catch (error) {
          tableResults.push({
            table,
            count: 0,
            status: "error",
            error: error instanceof Error ? error.message : "Erro desconhecido",
          })
        }
      }

      const successfulTables = tableResults.filter((t) => t.status === "ok").length
      const totalRecords = tableResults.reduce((sum, t) => sum + (t.count || 0), 0)

      results.tables = {
        status: successfulTables === tables.length ? "success" : "warning",
        message: `📋 ${successfulTables}/${tables.length} tabelas acessíveis`,
        details: {
          tables: tableResults,
          summary: {
            total_tables: tables.length,
            accessible_tables: successfulTables,
            total_records: totalRecords,
          },
        },
      }
    } catch (error) {
      results.tables = {
        status: "error",
        message: "❌ Erro ao verificar tabelas",
        details: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
          suggestion: "Verifique se o Supabase está configurado corretamente",
        },
      }
    }

    // 3. Testar Groq AI
    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "Responda apenas: Sistema funcionando" }],
          max_tokens: 10,
        }),
      })

      if (groqResponse.ok) {
        const groqData = await groqResponse.json()
        results.groq = {
          status: "success",
          message: "✅ Groq AI funcionando perfeitamente",
          details: {
            model: "llama-3.1-8b-instant",
            response: groqData.choices?.[0]?.message?.content || "Resposta recebida",
            latency: "< 2s",
            provider: "Groq (Principal)",
          },
        }
      } else {
        const errorText = await groqResponse.text()
        results.groq = {
          status: "error",
          message: "❌ Erro na API do Groq",
          details: {
            status: groqResponse.status,
            error: errorText.substring(0, 200),
            suggestion: "Verifique se a chave GROQ_API_KEY está correta",
          },
        }
      }
    } catch (error) {
      results.groq = {
        status: "error",
        message: "❌ Falha na conexão com Groq",
        details: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
          suggestion: "Verifique sua conexão com a internet e a chave da API",
        },
      }
    }

    // 4. Testar OpenAI (se configurado)
    try {
      if (process.env.OPENAI_API_KEY) {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Responda apenas: Backup ativo" }],
            max_tokens: 10,
          }),
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          results.openai = {
            status: "success",
            message: "✅ OpenAI configurado e funcionando (backup)",
            details: {
              model: "gpt-3.5-turbo",
              response: openaiData.choices?.[0]?.message?.content || "Resposta recebida",
              role: "Backup do Groq",
              provider: "OpenAI",
            },
          }
        } else {
          const errorText = await openaiResponse.text()
          results.openai = {
            status: "error",
            message: "❌ OpenAI configurado mas com erro",
            details: {
              status: openaiResponse.status,
              error: errorText.substring(0, 200),
              suggestion: "Verifique se a chave OPENAI_API_KEY está correta",
            },
          }
        }
      } else {
        results.openai = {
          status: "warning",
          message: "⚠️ OpenAI não configurado (opcional)",
          details: {
            info: "OpenAI serve como backup para o Groq",
            suggestion: "Configure a chave OPENAI_API_KEY se desejar redundância",
          },
        }
      }
    } catch (error) {
      results.openai = {
        status: "error",
        message: "❌ Erro ao testar OpenAI",
        details: {
          error: error instanceof Error ? error.message : "Erro desconhecido",
          suggestion: "Verifique a configuração da chave OpenAI",
        },
      }
    }

    // 5. Informações do ambiente (sem exigir VERCEL_REGION)
    results.environment = {
      node_version: process.version,
      runtime: process.env.VERCEL ? "Vercel Edge Runtime" : "Node.js Local",
      region: process.env.VERCEL_REGION || "local/unknown",
      deployment: process.env.VERCEL_ENV || "development",
      database_configured: !!process.env.DATABASE_URL_NEON,
      groq_configured: !!process.env.GROQ_API_KEY,
      openai_configured: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString(),
      platform: process.env.VERCEL ? "Vercel" : "Local",
    }

    // Calcular score geral do sistema
    const scores = {
      database: results.database.status === "success" ? 25 : 0,
      tables: results.tables.status === "success" ? 25 : results.tables.status === "warning" ? 15 : 0,
      groq: results.groq.status === "success" ? 30 : 0,
      openai: results.openai.status === "success" ? 20 : results.openai.status === "warning" ? 10 : 0,
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)

    results.system_health = {
      score: totalScore,
      status: totalScore >= 80 ? "excellent" : totalScore >= 60 ? "good" : totalScore >= 40 ? "warning" : "critical",
      message:
        totalScore >= 80
          ? "🟢 Sistema funcionando perfeitamente"
          : totalScore >= 60
            ? "🟡 Sistema funcionando com pequenos problemas"
            : totalScore >= 40
              ? "🟠 Sistema com problemas que precisam atenção"
              : "🔴 Sistema com problemas críticos",
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error in full diagnostic:", error)
    return NextResponse.json(
      {
        error: "Erro geral no diagnóstico do sistema",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        suggestion: "Verifique os logs do servidor para mais detalhes",
        results,
      },
      { status: 500 },
    )
  }
}
