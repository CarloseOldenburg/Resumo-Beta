"use client"

import { useState, useEffect, useRef } from "react"
import type { Task } from "@/lib/types"
import TaskItem from "./task-item"
import MarkdownToolbar from "../ui/markdown-toolbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Calendar } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAutoBackup } from "@/hooks/use-auto-backup"

interface TaskListProps {
  selectedDate: string
}

export default function TaskList({ selectedDate }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskTag, setNewTaskTag] = useState("none")
  const [isAddingTask, setIsAddingTask] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { autoBackup } = useAutoBackup()

  const isValidDate = selectedDate && !isNaN(Date.parse(selectedDate + "T00:00:00"))

  useEffect(() => {
    fetchTasks()
  }, [selectedDate])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks?date=${selectedDate}`)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const insertMarkdownText = (text: string) => {
    if (!descriptionRef.current) return

    const textarea = descriptionRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = newTaskDescription

    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
    setNewTaskDescription(newValue)

    // Focar no textarea e posicionar o cursor
    setTimeout(() => {
      textarea.focus()
      const newCursorPosition = start + text.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Erro",
        description: "O título da tarefa é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      const taskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        task_date: selectedDate,
        tag: newTaskTag === "none" ? undefined : newTaskTag,
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create task")
      }

      const newTask = await response.json()
      setTasks([...tasks, newTask])
      
      // Fazer backup automático
      autoBackup("task_created", newTask)
      
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskTag("none")
      setIsAddingTask(false)

      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a tarefa",
        variant: "destructive",
      })
    }
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update task")

      const updatedTask = await response.json()
      setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)))
      
      // Fazer backup automático
      autoBackup("task_updated", { id, data: updatedTask })
    } catch (error) {
      throw error
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete task")

      setTasks(tasks.filter((task) => task.id !== id))
      
      // Fazer backup automático
      autoBackup("task_deleted", { id })
      
      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso",
      })
    } catch (error) {
      throw error
    }
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const pendingTasks = tasks.filter((task) => !task.completed)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Tarefas de{" "}
            {isValidDate
              ? format(new Date(selectedDate + "T00:00:00"), "dd 'de' MMMM", { locale: ptBR })
              : selectedDate}
          </CardTitle>
          <Button onClick={() => setIsAddingTask(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova Tarefa
          </Button>
        </CardHeader>
        <CardContent>
          {isAddingTask && (
            <div className="space-y-3 mb-4 p-4 border rounded-lg bg-gray-50">
              <Input
                placeholder="Título da tarefa"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createTask()}
              />

              <Select value={newTaskTag} onValueChange={setNewTaskTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status (opcional)" />
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

              <div className="space-y-0">
                <MarkdownToolbar onInsert={insertMarkdownText} />
                <Textarea
                  ref={descriptionRef}
                  placeholder="Descrição (opcional) - Use os botões acima para inserir markdown rapidamente"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={4}
                  className="rounded-t-none border-t-0"
                />
                <div className="text-xs text-gray-500 mt-1 p-2 bg-blue-50 rounded-b-md">
                  <strong>💡 Dicas rápidas:</strong> Use os botões acima para inserir checkbox (☑️), negrito (**texto**),
                  links, etc.
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={createTask} size="sm">
                  Adicionar
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingTask(false)
                    setNewTaskTitle("")
                    setNewTaskDescription("")
                    setNewTaskTag("none")
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <TaskItem key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
            ))}

            {completedTasks.length > 0 && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Concluídas ({completedTasks.length})</h4>
                  {completedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                  ))}
                </div>
              </>
            )}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma tarefa para este dia</p>
                <p className="text-sm">Clique em "Nova Tarefa" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
