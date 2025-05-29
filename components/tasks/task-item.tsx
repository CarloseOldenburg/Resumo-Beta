"use client"

import { useState } from "react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Save, X, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  const [editTag, setEditTag] = useState(task.tag || "none")
  const [loading, setLoading] = useState(false)
  const [updatingTag, setUpdatingTag] = useState(false)
  const { toast } = useToast()

  const handleToggleComplete = async () => {
    try {
      setLoading(true)
      await onUpdate(task.id, {
        completed: !task.completed,
        status: !task.completed ? "completed" : "pending",
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
      await onUpdate(task.id, {
        tag: newTag === "none" ? undefined : newTag,
      })

      toast({
        title: "Sucesso",
        description: "Tag atualizada com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tag",
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
      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        tag: editTag === "none" ? undefined : editTag,
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
    switch (task.tag) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">✅ Concluído</Badge>
      case "canceled":
        return <Badge className="bg-red-500 hover:bg-red-600">🚫 Cancelado</Badge>
      case "paused":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏸️ Pausado</Badge>
      case "blocked":
        return <Badge className="bg-orange-500 hover:bg-orange-600">⚠️ Impedimento</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">🔄 Em Andamento</Badge>
      default:
        return null
    }
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

                <Select value={editTag} onValueChange={setEditTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem status</SelectItem>
                    <SelectItem value="in_progress">🔄 Em Andamento</SelectItem>
                    <SelectItem value="completed">✅ Concluído</SelectItem>
                    <SelectItem value="paused">⏸️ Pausado</SelectItem>
                    <SelectItem value="blocked">⚠️ Impedimento</SelectItem>
                    <SelectItem value="canceled">🚫 Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição (opcional) - Suporta checklist em markdown: - [ ] Item pendente, - [x] Item concluído"
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
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>{task.title}</h3>
                  {getTagBadge()}
                </div>

                {/* Seletor de Tag Rápido */}
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <Select value={task.tag || "none"} onValueChange={handleTagChange} disabled={updatingTag || loading}>
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue placeholder="Alterar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem status</SelectItem>
                      <SelectItem value="in_progress">🔄 Em Andamento</SelectItem>
                      <SelectItem value="completed">✅ Concluído</SelectItem>
                      <SelectItem value="paused">⏸️ Pausado</SelectItem>
                      <SelectItem value="blocked">⚠️ Impedimento</SelectItem>
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
