import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== Testando conexão com Neon ===")

    // Verificar se a variável NEON_DATABASE_URL_NEON está configurada
    const neonUrl = process.env.DATABASE_URL_NEON
    console.log("DATABASE_URL_NEON:", neonUrl ? `${neonUrl.substring(0, 50)}...` : "undefined")

    if (!neonUrl) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL_NEON não configurada",
      })
    }

    // Testar conexão
    const { sql } = await import("@/lib/neon")

    // Query simples para testar
    const result = await sql`SELECT 1 as test, current_database() as db_name, version() as version`

    console.log("✅ Conexão funcionando!")
    console.log("Database:", result[0].db_name)

    return NextResponse.json({
      success: true,
      message: "Conexão com Neon funcionando!",
      database: result[0].db_name,
      test: result[0].test,
      version: result[0].version.substring(0, 100),
    })
  } catch (error: any) {
    console.error("❌ Erro na conexão:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao conectar com Neon",
        message: error.message,
        details: error.stack?.substring(0, 500),
      },
      { status: 500 },
    )
  }
}
