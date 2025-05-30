import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Listar todas as variáveis relacionadas ao banco
    const envVars = Object.keys(process.env).filter(
      (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES"),
    )

    const envDetails = envVars.reduce(
      (acc, key) => {
        const value = process.env[key]
        acc[key] = value ? `${value.substring(0, 20)}...` : "undefined"
        return acc
      },
      {} as Record<string, string>,
    )

    return NextResponse.json({
      success: true,
      availableVars: envVars,
      details: envDetails,
      recommended: ["NEON_NEON_DATABASE_URL", "NEON_POSTGRES_URL", "DATABASE_URL", "POSTGRES_URL"],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
