import { neon } from "@neondatabase/serverless"

// Função para verificar se uma string é uma URL válida de banco
function isValidDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false
  return url.startsWith("postgres://") || url.startsWith("postgresql://")
}

// Função para verificar se é uma URL do Neon
function isNeonUrl(url: string | undefined): boolean {
  if (!url) return false
  return url.includes("neon.tech") || url.includes("neondb")
}

// Priorizar variáveis específicas do Neon
const possibleVars = [
  "NEON_NEON_NEON_NEON_DATABASE_URL_NEON",
  "NEON_DATABASE_URL_NEON",
  "DATABASE_URL_NEON",
  "NEON_NEON_DATABASE_URL",
  "NEON_DATABASE_URL",
  "NEON_POSTGRES_URL",
  // Genéricas como fallback
  "DATABASE_URL",
  "POSTGRES_URL",
]

console.log("🔍 Verificando variáveis de ambiente...")

// Encontrar a primeira URL válida do Neon
let databaseUrl: string | null = null
let usedVarName: string | null = null

for (const varName of possibleVars) {
  const url = process.env[varName]
  console.log(`Verificando ${varName}:`, url ? `${url.substring(0, 50)}...` : "undefined")

  if (isValidDatabaseUrl(url)) {
    // Priorizar URLs do Neon
    if (isNeonUrl(url)) {
      databaseUrl = url as string
      usedVarName = varName
      console.log(`✅ Usando URL do Neon: ${varName}`)
      break
    }
    // Guardar como fallback se não for do Neon
    else if (!databaseUrl) {
      databaseUrl = url as string
      usedVarName = varName
      console.log(`⚠️ URL não é do Neon, guardando como fallback: ${varName}`)
    }
  }
}

// Se não encontrou, mostrar erro detalhado
if (!databaseUrl) {
  console.error("❌ Nenhuma URL válida de banco encontrada")

  const allEnvVars = Object.keys(process.env).filter(
    (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES"),
  )

  console.error("Variáveis disponíveis:", allEnvVars)
  throw new Error(`Nenhuma URL válida de banco de dados encontrada. Variáveis verificadas: ${possibleVars.join(", ")}`)
}

// Avisar se não está usando Neon
if (!isNeonUrl(databaseUrl)) {
  console.warn(`⚠️ ATENÇÃO: Usando ${usedVarName} que não parece ser do Neon. Isso pode causar problemas!`)
  console.warn("Configure DATABASE_URL_NEON com a URL completa do Neon")
}

// Criar cliente Neon
let sql: any

try {
  console.log(`🔗 Criando conexão Neon com ${usedVarName}...`)
  sql = neon(databaseUrl)
  console.log("✅ Cliente Neon criado com sucesso")
} catch (error) {
  console.error("❌ Erro ao criar cliente Neon:", error)
  throw new Error(`Erro ao criar cliente Neon: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
}

export { sql }
