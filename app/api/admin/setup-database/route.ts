import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando configuração do banco resumobeta...")

    // Usar a variável NEON_DATABASE_URL_NEON específica
    const databaseUrl = process.env.DATABASE_URL_NEON || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

    console.log("🔍 Variáveis disponíveis:", {
      DATABASE_URL_NEON: !!process.env.DATABASE_URL_NEON,
      NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
    })

    if (!databaseUrl) {
      console.error("❌ DATABASE_URL_NEON não encontrada")
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL_NEON não encontrada. Verifique se a variável está configurada no Vercel.",
          availableVars: Object.keys(process.env).filter(
            (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES"),
          ),
        },
        { status: 500 },
      )
    }

    console.log("✅ Database URL encontrada para resumobeta:", databaseUrl.substring(0, 20) + "...")

    // Criar conexão com o banco resumobeta
    const sql = neon(databaseUrl)

    // Testar conexão primeiro
    console.log("🔍 Testando conexão com resumobeta...")
    const testResult = await sql`SELECT 1 as test, current_database() as db_name`
    console.log("✅ Conexão com banco resumobeta OK:", testResult)

    // 1. Criar extensões necessárias
    console.log("🔧 Criando extensões...")
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

    // 2. Criar tabelas
    console.log("📋 Criando tabelas no banco resumobeta...")

    // Tabela de usuários
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Tabela de configurações do sistema
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Tabela de tags de cliente
    await sql`
      CREATE TABLE IF NOT EXISTS client_tags (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Tabela de tarefas
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'in_progress',
        completed BOOLEAN DEFAULT FALSE,
        task_date DATE DEFAULT CURRENT_DATE,
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        tag VARCHAR(255),
        client_tags TEXT[],
        estimated_hours INTEGER DEFAULT 0,
        actual_hours INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Tabela de resumos diários
    await sql`
      CREATE TABLE IF NOT EXISTS daily_summaries (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID,
        summary_date DATE NOT NULL,
        manual_summary TEXT,
        generated_summary TEXT,
        tasks_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    console.log("✅ Tabelas criadas com sucesso no resumobeta")

    // 3. Criar índices para otimização
    console.log("🚀 Criando índices...")
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_id ON daily_summaries(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(summary_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`
    await sql`CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key)`
    await sql`CREATE INDEX IF NOT EXISTS idx_client_tags_name ON client_tags(name)`

    console.log("✅ Índices criados com sucesso")

    // 4. Inserir dados iniciais
    console.log("📝 Inserindo configurações padrão...")
    const systemSettings = [
      { key: "app_name", value: "Resumo Beta", description: "Nome da aplicação" },
      {
        key: "app_description",
        value: "Gerencie suas tarefas e gere resumos para daily meetings",
        description: "Descrição da aplicação",
      },
      { key: "app_theme", value: "light", description: "Tema padrão da aplicação" },
      { key: "primary_color", value: "#3B82F6", description: "Cor primária da aplicação" },
      { key: "accent_color", value: "#10B981", description: "Cor de destaque da aplicação" },
      { key: "openai_model", value: "gpt-4o", description: "Modelo OpenAI padrão" },
      { key: "auto_backup_enabled", value: "true", description: "Backup automático habilitado" },
      { key: "max_tasks_per_day", value: "50", description: "Máximo de tarefas por dia" },
    ]

    for (const setting of systemSettings) {
      await sql`
        INSERT INTO system_settings (key, value, description)
        VALUES (${setting.key}, ${setting.value}, ${setting.description})
        ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = NOW()
      `
    }

    console.log("✅ Configurações inseridas com sucesso")

    // Inserir tags de cliente padrão
    console.log("🏷️ Inserindo tags de cliente...")
    const clientTags = [
      { name: "Mania de Churrasco", color: "#EF4444", description: "Cliente Mania de Churrasco" },
      { name: "Chiquinho", color: "#10B981", description: "Cliente Chiquinho" },
      { name: "Saipos", color: "#8B5CF6", description: "Cliente Saipos" },
      { name: "Sysmo", color: "#F59E0B", description: "Cliente Sysmo" },
      { name: "Interno", color: "#6B7280", description: "Projetos internos" },
      { name: "Geral", color: "#3B82F6", description: "Tarefas gerais" },
    ]

    for (const tag of clientTags) {
      await sql`
        INSERT INTO client_tags (name, color, description)
        VALUES (${tag.name}, ${tag.color}, ${tag.description})
        ON CONFLICT (name) DO UPDATE SET
        color = EXCLUDED.color,
        description = EXCLUDED.description,
        updated_at = NOW()
      `
    }

    console.log("✅ Tags de cliente inseridas com sucesso")

    // 5. Criar usuário admin padrão
    console.log("👤 Criando usuário admin...")
    const adminEmail = process.env.ADMIN_EMAIL || "admin@resumobeta.com"
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

    // Usar hash simples por enquanto
    const passwordHash = Buffer.from(adminPassword).toString("base64")

    await sql`
      INSERT INTO users (email, name, password_hash, role)
      VALUES (${adminEmail}, 'Administrador', ${passwordHash}, 'admin')
      ON CONFLICT (email) DO UPDATE SET
      password_hash = ${passwordHash},
      role = 'admin',
      updated_at = NOW()
    `

    console.log("✅ Usuário admin criado com sucesso")

    // 6. Verificar a configuração
    console.log("📊 Verificando estatísticas do banco resumobeta...")
    const tableCount = await sql`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'`
    const userCount = await sql`SELECT COUNT(*) FROM users`
    const settingsCount = await sql`SELECT COUNT(*) FROM system_settings`
    const tagsCount = await sql`SELECT COUNT(*) FROM client_tags`

    console.log("✅ Configuração do banco resumobeta concluída com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Banco de dados resumobeta configurado com sucesso!",
      database: "resumobeta",
      stats: {
        tables: Number.parseInt(tableCount[0].count),
        users: Number.parseInt(userCount[0].count),
        settings: Number.parseInt(settingsCount[0].count),
        tags: Number.parseInt(tagsCount[0].count),
      },
      admin: {
        email: adminEmail,
        password: adminPassword,
      },
      databaseUrl: databaseUrl.substring(0, 20) + "...",
    })
  } catch (error) {
    console.error("❌ Erro ao configurar banco resumobeta:", error)

    // Retornar erro detalhado
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    return NextResponse.json(
      {
        success: false,
        error: `Erro ao configurar banco resumobeta: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined,
        availableVars: Object.keys(process.env).filter(
          (key) => key.includes("NEON") || key.includes("DATABASE") || key.includes("POSTGRES"),
        ),
      },
      { status: 500 },
    )
  }
}
