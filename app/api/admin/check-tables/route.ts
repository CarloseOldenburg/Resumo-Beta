import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    // Verificar se as tabelas existem
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('tasks', 'client_tags', 'task_client_tags', 'daily_summaries')
    `

    const existingTables = tablesResult.map((row) => row.table_name)

    return NextResponse.json({
      success: true,
      existingTables,
      missingTables: ["tasks", "client_tags", "task_client_tags", "daily_summaries"].filter(
        (table) => !existingTables.includes(table),
      ),
    })
  } catch (error: any) {
    console.error("Erro ao verificar tabelas:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // Criar tabelas se não existirem
    await sql`
      CREATE TABLE IF NOT EXISTS client_tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'in_progress',
        completed BOOLEAN DEFAULT FALSE,
        start_date DATE,
        end_date DATE,
        task_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS task_client_tags (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        client_tag_id INTEGER REFERENCES client_tags(id) ON DELETE CASCADE,
        UNIQUE(task_id, client_tag_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS daily_summaries (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: "Tabelas criadas com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao criar tabelas:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
