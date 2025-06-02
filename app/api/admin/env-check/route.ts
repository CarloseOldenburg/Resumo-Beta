import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Filtrar apenas variáveis relacionadas ao banco e IA
    const relevantVars = Object.keys(process.env).filter(
      (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES") || key.includes("GROQ"),
    )

    // Criar objeto com informações sobre cada variável
    const envInfo = relevantVars.reduce(
      (acc, key) => {
        const value = process.env[key]
        acc[key] = {
          exists: !!value,
          length: value ? value.length : 0,
          isUrl: value ? value.startsWith("postgres://") || value.startsWith("postgresql://") : false,
          preview: value ? (value.length > 30 ? value.substring(0, 30) + "..." : value) : "undefined",
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      count: relevantVars.length,
      validUrls: Object.entries(envInfo)
        .filter(([_, info]) => (info as any).isUrl)
        .map(([key]) => key),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao verificar variáveis de ambiente",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
