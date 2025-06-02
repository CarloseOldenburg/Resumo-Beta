"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Aplicar tema salvo ou preferência do sistema
    const savedTheme = localStorage.getItem("qa-manager-theme")
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const theme = savedTheme || systemTheme

    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [])

  // Evitar hidratação mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
