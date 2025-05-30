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
import { Edit2, Trash2, Save, X, Tag, Calendar } from "lucide-react"
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
      await onUpdate(task.id, {
        completed: !task.completed,
        status: !task.completed ? "completed" : "in_progress",
        end_date: !task.completed ? new Date().toISOString().split("T")[0] : undefined,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTagChange = async (newTag: string) => {
    try {
      setUpdatingTag(true)

      // Auto-marcar como concluído se status for completed ou canceled
      const shouldComplete = newTag === "completed" || newTag === "canceled"

      await onUpdate(task.id, {
        tag: newTag === "none" ? undefined : newTag,
        status: newTag === "none" ? "in_progress" : newTag,
        completed: shouldComplete,
        end_date: shouldComplete ? new Date().toISOString().split("T")[0] : undefined,
      })

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      })
    } finally {
      setUpdatingTag(false)
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "Erro",
        description: "O título da tarefa é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const shouldComplete = editTag === "completed" || editTag === "canceled"

      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        client_tags: editClientTags,
        tag: editTag === "none" ? undefined : editTag,
        status: editTag === "none" ? "in_progress" : editTag,
        completed: shouldComplete,
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a tarefa",
        variant: "destructive",
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
  }

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      try {
        setLoading(true)
        await onDelete(task.id)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a tarefa",
          variant: "destructive",
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
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a checklist",
        variant: "destructive",
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

  const calculateDuration = () => {
    if (!task.start_date) return null

    const startDate = new Date(task.start_date)
    const endDate = task.end_date ? new Date(task.end_date) : new Date()
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  return (
    <Card className={`transition-all ${task.completed ? "opacity-75" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            disabled={loading}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título da tarefa"
                  disabled={loading}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Data Início</label>
                    <Input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Data Fim</label>
                    <Input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Select value={editTag} onValueChange={setEditTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>{task.title}</h3>
                  {getTagBadge()}
                  {getClientTagBadges()}
                  {calculateDuration() && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {calculateDuration()} dias
                    </Badge>
                  )}
                </div>

                {/* Datas */}
                {(task.start_date || task.end_date) && (
                  <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
                    {task.start_date && <span>Início: {new Date(task.start_date).toLocaleDateString("pt-BR")}</span>}
                    {task.end_date && <span>Fim: {new Date(task.end_date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                )}

                {/* Seletor de Status Rápido */}
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <Select
                    value={task.status || task.tag || "in_progress"}
                    onValueChange={handleTagChange}
                    disabled={updatingTag || loading}
                  >
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue placeholder="Alterar status" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <div className={`mt-2 ${task.completed ? "text-gray-500" : ""}`}>
                    <MarkdownChecklist content={task.description} onChange={handleChecklistChange} />
                  </div>
                )}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} disabled={loading}>
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
