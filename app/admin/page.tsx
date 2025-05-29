"use client"

import { useAuth } from "@/components/auth/auth-provider"
import Header from "@/components/layout/header"
import AdminPanel from "@/components/admin/admin-panel"

export default function AdminPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AdminPanel />
      </main>
    </div>
  )
}
