"use client"

import { useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface BackupData {
  timestamp: string
  action: string
  data: any
  user_id: string
}

export function useAutoBackup() {
  const { toast } = useToast()

  // Salvar backup no localStorage
  const saveLocalBackup = useCallback((backupData: BackupData) => {
    if (typeof window === "undefined") return
    
    try {
      const existingBackups = JSON.parse(localStorage.getItem("qa-manager-backups") || "[]")
      existingBackups.push(backupData)

      // Manter apenas os últimos 50 backups
      if (existingBackups.length > 50) {
        existingBackups.splice(0, existingBackups.length - 50)
      }

      localStorage.setItem("qa-manager-backups", JSON.stringify(existingBackups))
      localStorage.setItem("qa-manager-last-sync", new Date().toISOString())
    } catch (error) {
      console.error("Error saving local backup:", error)
    }
  }, [])

  // Função para fazer backup automático
  const autoBackup = useCallback(
    async (action: string, data: any) => {
      if (typeof window === "undefined") return
      
      try {
        const response = await fetch("/api/backup/auto-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, data }),
        })

        if (response.ok) {
          const result = await response.json()
          saveLocalBackup(result.backup)
        }
      } catch (error) {
        console.error("Auto backup failed:", error)
      }
    },
    [saveLocalBackup],
  )

  // Exportar backup completo
  const exportFullBackup = useCallback(async () => {
    try {
      const response = await fetch("/api/backup/export")
      if (!response.ok) throw new Error("Failed to export backup")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qa-manager-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Sucesso",
        description: "Backup completo exportado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar o backup",
        variant: "destructive",
      })
    }
  }, [toast])

  // Importar backup
  const importBackup = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const backupData = JSON.parse(text)

        const response = await fetch("/api/backup/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backupData),
        })

        if (!response.ok) throw new Error("Failed to import backup")

        const result = await response.json()
        toast({
          title: "Sucesso",
          description: result.message,
        })

        // Recarregar a página para mostrar os dados importados
        setTimeout(() => window.location.reload(), 2000)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível importar o backup. Verifique o formato do arquivo.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  return {
    autoBackup,
    exportFullBackup,
    importBackup,
    saveLocalBackup,
  }
}
