"use client"

import { useState } from "react"
import type { Task, ClientTag } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Save, X, Tag, Calendar, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import MarkdownChecklist from "../ui/markdown-checklist"

interface TaskItemProps {
  task: Task
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || "")
  const [editStartDate, setEditStartDate] = useState(task.start_date || "")
  const [editEndDate, setEditEndDate] = useState(task.end_date || "")
  const [editClientTags, setEditClientTags] = useState<string[]>(task.client_tags || [])
  const [editTag, setEditTag] = useState(task.tag || "none")
  const [clientTags, setClientTags] = useState<ClientTag[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingTag, setUpdatingTag] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchClientTags()
  }, [])

  const fetchClientTags = async () => {
    try {
      const response = await fetch("/api/client-tags")
      if (response.ok) {
        const data = await response.json()
        setClientTags(data)
      }
    } catch (error) {
      console.error("Error fetching client tags:", error)
    }
  }

  const handleToggleComplete = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Alternando status de conclusão da tarefa:", task.id)

      const updateData = {
        completed: !task.completed,
        status: !task.completed ? "completed" : "in_progress",
        end_date: !task.completed ? new Date().toISOString().split("T")[0] : undefined,
      }

      console.log("📝 Dados de atualização:", updateData)

      await onUpdate(task.id, updateData)

      toast({
        title: !task.completed ? "✅ Tarefa Concluída" : "🔄 Tarefa Reaberta",
        description: !task.completed ? "Tarefa marcada como concluída" : "Tarefa marcada como em andamento",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("❌ Erro ao alternar conclusão:", error)
      setError(error.message || "Erro ao atualizar tarefa")

      toast({
        title: "❌ Erro ao Atualizar",
        description: error.message || "Não foi possível atualizar a tarefa",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTagChange = async (newTag: string) => {
    try {
      setUpdatingTag(true)
      setError(null)

      console.log("🏷️ Alterando tag da tarefa:", task.id, "para:", newTag)

      // Auto-marcar como concluído se status for completed ou canceled
      const shouldComplete = newTag === "completed" || newTag === "canceled"

      const updateData = {
        tag: newTag === "none" ? undefined : newTag,
        status: newTag === "none" ? "in_progress" : newTag,
        completed: shouldComplete,
        end_date: shouldComplete ? new Date().toISOString().split("T")[0] : undefined,
      }

      await onUpdate(task.id, updateData)

      toast({
        title: "✅ Status Atualizado",
        description: "Status da tarefa alterado com sucesso",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("❌ Erro ao alterar tag:", error)
      setError(error.message || "Erro ao atualizar status")

      toast({
        title: "❌ Erro no Status",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setUpdatingTag(false)
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "❌ Campo Obrigatório",
        description: "O título da tarefa é obrigatório",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const shouldComplete = editTag === "completed" || editTag === "canceled"

      const updateData = {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        client_tags: editClientTags,
        tag: editTag === "none" ? undefined : editTag,
        status: editTag === "none" ? "in_progress" : editTag,
        completed: shouldComplete,
      }

      await onUpdate(task.id, updateData)
      setIsEditing(false)

      toast({
        title: "✅ Tarefa Salva",
        description: "Alterações salvas com sucesso",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("❌ Erro ao salvar:", error)
      setError(error.message || "Erro ao salvar tarefa")

      toast({
        title: "❌ Erro ao Salvar",
        description: error.message || "Não foi possível salvar a tarefa",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description || "")
    setEditStartDate(task.start_date || "")
    setEditEndDate(task.end_date || "")
    setEditClientTags(task.client_tags || [])
    setEditTag(task.tag || "none")
    setIsEditing(false)
    setError(null)
  }

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      try {
        setLoading(true)
        setError(null)

        console.log("🗑️ Deletando tarefa:", task.id)

        await onDelete(task.id)

        toast({
          title: "✅ Tarefa Excluída",
          description: "Tarefa removida com sucesso",
          duration: 5000,
        })
      } catch (error: any) {
        console.error("❌ Erro ao deletar:", error)
        setError(error.message || "Erro ao excluir tarefa")

        toast({
          title: "❌ Erro ao Excluir",
          description: error.message || "Não foi possível excluir a tarefa",
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleChecklistChange = async (newDescription: string) => {
    try {
      await onUpdate(task.id, {
        description: newDescription,
      })
    } catch (error: any) {
      console.error("❌ Erro ao atualizar checklist:", error)
      toast({
        title: "❌ Erro na Checklist",
        description: error.message || "Não foi possível atualizar a checklist",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const getTagBadge = () => {
    switch (task.status || task.tag) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">✅ Concluído</Badge>
      case "canceled":
        return <Badge className="bg-red-500 hover:bg-red-600">🚫 Cancelado</Badge>
      case "paused":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏸️ Pausado</Badge>
      case "blocked":
        return <Badge className="bg-orange-500 hover:bg-orange-600">⚠️ Bloqueado</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">🔄 Em Andamento</Badge>
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-600">🔄 Em Andamento</Badge>
    }
  }

  const getClientTagBadges = () => {
    if (!task.client_tags || task.client_tags.length === 0) return null

    return task.client_tags.map((tagName) => {
      const clientTag = clientTags.find((ct) => ct.name === tagName)
      return (
        <Badge
          key={tagName}
          style={{
            backgroundColor: clientTag?.color || "#6B7280",
            color: "white",
          }}
          className="text-xs"
        >
          {tagName}
        </Badge>
      )
    })
  }

  // Calcular duração baseada em created_at e updated_at (quando concluída)
  const calculateDuration = () => {
    if (!task.created_at) return null

    try {
      const createdDate = new Date(task.created_at)
      const endDate = task.completed && task.updated_at ? new Date(task.updated_at) : new Date()

      if (!createdDate || !endDate) return null

      const diffTime = Math.abs(endDate.getTime() - createdDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays
    } catch (error) {
      console.error("Erro ao calcular duração:", error)
      return null
    }
  }

  return (
    <Card className={`transition-all ${task.completed ? "opacity-75" : ""} ${error ? "border-red-500" : ""}`}>
      <CardContent className="p-4">
        {error && (
          <div className="mb-3 p-2 bg-red-900/20 border border-red-700 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="ml-auto h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Layout principal reorganizado */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
          {/* Checkbox */}
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            disabled={loading}
            className="mt-1"
          />

          {/* Conteúdo principal */}
          <div className="min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título da tarefa"
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Data Início</label>
                    <Input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      disabled={loading}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Data Fim</label>
                    <Input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      disabled={loading}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <Select value={editTag} onValueChange={setEditTag}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="none">Sem status</SelectItem>
                    <SelectItem value="in_progress">🔄 Em Andamento</SelectItem>
                    <SelectItem value="completed">✅ Concluído</SelectItem>
                    <SelectItem value="paused">⏸️ Pausado</SelectItem>
                    <SelectItem value="blocked">⚠️ Bloqueado</SelectItem>
                    <SelectItem value="canceled">🚫 Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={editClientTags[0] || "none"}
                  onValueChange={(value) => setEditClientTags(value === "none" ? [] : [value])}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="none">Nenhum cliente</SelectItem>
                    {clientTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.name}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                          <span>{tag.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição (opcional) - Suporta checklist em markdown"
                  disabled={loading}
                  rows={4}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />

                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} disabled={loading}>
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                    {task.title}
                  </h3>
                  {getTagBadge()}
                  {getClientTagBadges()}
                  {calculateDuration() && (
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      <Calendar className="h-3 w-3 mr-1" />
                      {calculateDuration()} dias
                    </Badge>
                  )}
                </div>

                {(task.start_date || task.end_date) && (
                  <div className="flex items-center gap-4 mb-2 text-xs text-gray-400">
                    {task.start_date && <span>Início: {new Date(task.start_date).toLocaleDateString("pt-BR")}</span>}
                    {task.end_date && <span>Fim: {new Date(task.end_date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <Select
                    value={task.status || task.tag || "in_progress"}
                    onValueChange={handleTagChange}
                    disabled={updatingTag || loading}
                  >
                    <SelectTrigger className="w-48 h-8 text-xs bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Alterar status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="in_progress">🔄 Em Andamento</SelectItem>
                      <SelectItem value="completed">✅ Concluído</SelectItem>
                      <SelectItem value="paused">⏸️ Pausado</SelectItem>
                      <SelectItem value="blocked">⚠️ Bloqueado</SelectItem>
                      <SelectItem value="canceled">🚫 Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingTag && <div className="text-xs text-gray-500">Atualizando...</div>}
                </div>

                {task.description && (
                  <div className={`mt-2 ${task.completed ? "text-gray-500" : "text-gray-300"}`}>
                    <MarkdownChecklist content={task.description} onChange={handleChecklistChange} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de ação */}
          {!isEditing && (
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={loading}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
