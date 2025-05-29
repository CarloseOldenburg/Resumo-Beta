"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = getSupabaseClient()

      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth error:", error)
          router.push("/login?error=auth_failed")
          return
        }

        if (data.session) {
          router.push("/")
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Callback error:", error)
        router.push("/login?error=callback_failed")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Finalizando login...</p>
      </div>
    </div>
  )
}
