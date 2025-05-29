import { type NextRequest, NextResponse } from "next/server"

// Dados mockados para desenvolvimento
const mockUsers = [
  {
    id: "default-user-id",
    email: "admin@qamanager.com",
    name: "Analista QA",
    role: "admin",
    created_at: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(mockUsers)
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    // Simular atualização
    const userIndex = mockUsers.findIndex((u) => u.id === userId)
    if (userIndex !== -1) {
      mockUsers[userIndex].role = role
    }

    return NextResponse.json(mockUsers[userIndex] || { success: true })
  } catch (error) {
    console.error("Error in PATCH /api/admin/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
