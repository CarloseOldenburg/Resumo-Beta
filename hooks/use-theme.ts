"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Verificar preferência salva
    const savedTheme = localStorage.getItem("qa-manager-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Verificar preferência do sistema
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      setTheme(systemTheme)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    if (typeof window === "undefined") return
    
    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }

  const toggleTheme = () => {
    if (!mounted) return
    
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("qa-manager-theme", newTheme)
  }

  const setThemeMode = (newTheme: Theme) => {
    if (!mounted) return
    
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("qa-manager-theme", newTheme)
  }

  return {
    theme,
    toggleTheme,
    setThemeMode,
    mounted,
  }
}
