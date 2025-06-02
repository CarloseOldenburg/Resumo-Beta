import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const envVars = Object.keys(process.env).filter(
      (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES") || key.includes("GROQ"),
    )

    const envStatus = envVars.reduce(
      (acc, key) => {
        const value = process.env[key]
        acc[key] = {
          exists: !!value,
          preview: value ? `${value.substring(0, 15)}...` : "undefined",
        }
        return acc
      },
      {} as Record<string, { exists: boolean; preview: string }>,
    )

    // Testar conexão com banco
    let dbStatus = { connected: false, database: null, error: null, tables: [] }

    try {
      const dbTest = await sql`
        SELECT current_database() as db_name, 
               version() as version
      `

      // Verificar tabelas
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `

      dbStatus = {
        connected: true,
        database: dbTest[0]?.db_name,
        error: null,
        tables: tables.map((t) => t.table_name),
      }
    } catch (dbError) {
      dbStatus = {
        connected: false,
        database: null,
        error: dbError instanceof Error ? dbError.message : "Erro desconhecido",
        tables: [],
      }
    }

    // Testar Groq
    let groqStatus = { connected: false, models: [], error: null }

    try {
      const groqApiKey = process.env.GROQ_API_KEY

      if (!groqApiKey) {
        groqStatus.error = "GROQ_API_KEY não encontrada"
      } else {
        const response = await fetch("https://api.groq.com/openai/v1/models", {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          groqStatus = {
            connected: true,
            models: data.data?.slice(0, 5).map((m: any) => m.id) || [],
            error: null,
          }
        } else {
          groqStatus = {
            connected: false,
            models: [],
            error: `Erro ${response.status}: ${response.statusText}`,
          }
        }
      }
    } catch (groqError) {
      groqStatus = {
        connected: false,
        models: [],
        error: groqError instanceof Error ? groqError.message : "Erro desconhecido",
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        variables: envStatus,
      },
      database: dbStatus,
      groq: groqStatus,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro no diagnóstico",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
