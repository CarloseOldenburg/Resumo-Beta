"use client"

import { useState, useEffect, useRef } from "react"
import type { Task, ClientTag, TaskFilters } from "@/lib/types"
import TaskItem from "./task-item"
import MarkdownToolbar from "../ui/markdown-toolbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Calendar, Filter, X, Users, Eye, EyeOff, Search, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAutoBackup } from "@/hooks/use-auto-backup"

interface TaskListProps {
  selectedDate?: string
}

// Função auxiliar para formatar data com segurança
const formatDateSafely = (dateString: string | undefined, formatStr = "dd 'de' MMMM") => {
  if (!dateString) return "Data não definida"

  try {
    let date: Date

    if (dateString.includes("T")) {
      date = parseISO(dateString)
    } else {
      date = new Date(dateString + "T00:00:00")
    }

    if (!isValid(date)) {
      return dateString
    }

    return format(date, formatStr, { locale: ptBR })
  } catch (error) {
    console.error("Erro ao formatar data:", dateString, error)
    return dateString
  }
}

export default function TaskList({ selectedDate }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clientTags, setClientTags] = useState<ClientTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>({
    showClosed: true,
  })

  // Formulário de nova tarefa
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskStartDate, setNewTaskStartDate] = useState(() => {
    if (selectedDate) {
      try {
        const testDate = new Date(selectedDate + "T00:00:00")
        if (isValid(testDate)) {
          return selectedDate
        }
      } catch (error) {
        console.error("Data selecionada inválida:", selectedDate)
      }
    }
    return format(new Date(), "yyyy-MM-dd")
  })
  const [newTaskEndDate, setNewTaskEndDate] = useState("")
  const [newTaskClientTags, setNewTaskClientTags] = useState<string[]>([])
  const [isAddingTask, setIsAddingTask] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { autoBackup } = useAutoBackup()

  useEffect(() => {
    fetchClientTags()
    fetchTasks()
  }, [selectedDate])

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

  const fetchTasks = async () => {
    try {
      setLoading(true)
      console.log("Fetching tasks with selectedDate:", selectedDate)

      const params = new URLSearchParams()

      if (selectedDate) {
        try {
          const testDate = new Date(selectedDate + "T00:00:00")
          if (isValid(testDate)) {
            params.append("date", selectedDate)
          }
        } catch (error) {
          console.error("Data selecionada inválida para fetch:", selectedDate)
        }
      } else {
        // Se não há data selecionada, buscar todas as tarefas
        params.append("includeOpen", "true")
      }

      const url = `/api/tasks?${params.toString()}`
      console.log("Fetching from URL:", url)

      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Fetch error:", response.status, errorText)
        throw new Error(`Failed to fetch tasks: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched tasks:", data)

      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível carregar as tarefas",
        variant: "destructive",
        duration: 6000,
      })
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const refreshTasks = async () => {
    setRefreshing(true)
    await fetchTasks()
    setRefreshing(false)
    toast({
      title: "✅ Atualizado",
      description: "Lista de tarefas atualizada",
      duration: 3000,
    })
  }

  const searchTasks = async () => {
    try {
      setSearching(true)

      const params = new URLSearchParams()

      // Aplicar filtros apenas se preenchidos
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      if (filters.status && filters.status.length > 0) {
        params.append("status", filters.status.join(","))
      }

      if (filters.clientTags && filters.clientTags.length > 0) {
        params.append("clientTags", filters.clientTags.join(","))
      }

      // Sempre incluir tarefas abertas se não for busca específica por data
      if (!selectedDate) {
        params.append("includeOpen", "true")
      }

      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to search tasks")
      const data = await response.json()
      setTasks(Array.isArray(data) ? data : [])

      toast({
        title: "🔍 Busca Realizada",
        description: `Encontradas ${data.length} tarefas`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível realizar a busca",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setSearching(false)
    }
  }

  const clearFilters = () => {
    setFilters({ showClosed: true })
    fetchTasks() // Recarregar tarefas sem filtros
  }

  const insertMarkdownText = (text: string) => {
    if (!descriptionRef.current) return

    const textarea = descriptionRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = newTaskDescription

    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
    setNewTaskDescription(newValue)

    setTimeout(() => {
      textarea.focus()
      const newCursorPosition = start + text.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "❌ Erro",
        description: "O título da tarefa é obrigatório",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    try {
      const taskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        start_date: newTaskStartDate,
        end_date: newTaskEndDate || undefined,
        task_date: newTaskStartDate,
        client_tags: newTaskClientTags,
        status: "in_progress",
      }

      console.log("Creating task:", taskData)

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
      console.log("Task created:", newTask)

      setTasks([newTask, ...tasks])

      autoBackup("task_created", newTask)

      // Reset form
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskStartDate(
        selectedDate && isValid(new Date(selectedDate + "T00:00:00")) ? selectedDate : format(new Date(), "yyyy-MM-dd"),
      )
      setNewTaskEndDate("")
      setNewTaskClientTags([])
      setIsAddingTask(false)

      toast({
        title: "✅ Sucesso",
        description: "Tarefa criada com sucesso",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("Erro ao criar tarefa:", error)
      toast({
        title: "❌ Erro",
        description: error.message || "Não foi possível criar a tarefa",
        variant: "destructive",
        duration: 6000,
      })
    }
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    try {
      if (data.status === "completed" || data.status === "canceled") {
        data.completed = true
        data.end_date = data.end_date || new Date().toISOString().split("T")[0]
      } else if (data.status && data.status !== "completed" && data.status !== "canceled") {
        data.completed = false
        data.end_date = undefined
      }

      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update task")
      }

      const updatedTask = await response.json()
      setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)))

      autoBackup("task_updated", { id, data: updatedTask })

      if (data.status === "completed" || data.status === "canceled") {
        toast({
          title: "✅ Tarefa Fechada",
          description: `Tarefa movida para a seção "Fechadas". ${!filters.showClosed ? 'Ative "Mostrar tarefas fechadas" para visualizá-la.' : ""}`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível atualizar a tarefa",
        variant: "destructive",
        duration: 6000,
      })
      throw error
    }
  }

  const deleteTask = async (id: string) => {
    try {
      console.log("Deleting task:", id)

      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Delete error:", errorData)
        throw new Error(errorData.error || "Failed to delete task")
      }

      const result = await response.json()
      console.log("Delete result:", result)

      setTasks(tasks.filter((task) => task.id !== id))

      autoBackup("task_deleted", { id })

      toast({
        title: "✅ Sucesso",
        description: "Tarefa excluída com sucesso",
        duration: 5000,
      })
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível excluir a tarefa",
        variant: "destructive",
        duration: 6000,
      })
      throw error
    }
  }

  const calculateTaskDuration = (task: Task) => {
    if (!task.start_date) return null

    try {
      const startDate = new Date(task.start_date)
      if (!isValid(startDate)) return null

      const endDate = task.end_date ? new Date(task.end_date) : new Date()
      if (!isValid(endDate)) return null

      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays
    } catch (error) {
      console.error("Erro ao calcular duração da tarefa:", error)
      return null
    }
  }

  const openTasks = tasks.filter((task) => !task.completed)
  const closedTasks = tasks.filter((task) => task.completed)

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
      {/* Header com Filtros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            {selectedDate ? <>Tarefas de {formatDateSafely(selectedDate)}</> : "Todas as Tarefas"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button onClick={refreshTasks} disabled={refreshing} variant="outline" size="sm">
              {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Atualizar
            </Button>
            <Button
              onClick={() => setFilters({ ...filters, showClosed: !filters.showClosed })}
              variant={filters.showClosed ? "default" : "outline"}
              size="sm"
            >
              {filters.showClosed ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              {filters.showClosed ? "Ocultar Fechadas" : "Mostrar Fechadas"}
            </Button>
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
            <Button onClick={() => setIsAddingTask(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Tarefa
            </Button>
          </div>
        </CardHeader>

        {/* Filtros Avançados */}
        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium">Data Início (opcional)</label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fim (opcional)</label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status?.[0] || "all"}
                  onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? [] : [value] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <Select
                  value={filters.clientTags?.[0] || "all"}
                  onValueChange={(value) => setFilters({ ...filters, clientTags: value === "all" ? [] : [value] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clientTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.name}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button onClick={searchTasks} disabled={searching}>
                  {searching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                  Pesquisar
                </Button>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Limpar Filtros
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                💡 Dica: Status e Cliente são obrigatórios para pesquisa. Datas são opcionais.
              </p>
            </div>
          </CardContent>
        )}

        {/* Formulário de Nova Tarefa */}
        {isAddingTask && (
          <CardContent className="border-t">
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Título da tarefa"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createTask()}
                />
                <Input type="date" value={newTaskStartDate} onChange={(e) => setNewTaskStartDate(e.target.value)} />
                <Input
                  type="date"
                  placeholder="Data fim (opcional)"
                  value={newTaskEndDate}
                  onChange={(e) => setNewTaskEndDate(e.target.value)}
                />
              </div>

              <Select
                value={newTaskClientTags[0] || "none"}
                onValueChange={(value) => setNewTaskClientTags(value === "none" ? [] : [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente (opcional)" />
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

              <div className="space-y-0">
                <MarkdownToolbar
                  textareaRef={descriptionRef}
                  value={newTaskDescription}
                  onChange={setNewTaskDescription}
                />
                <Textarea
                  ref={descriptionRef}
                  placeholder="Descrição (opcional) - Use os botões acima para inserir markdown rapidamente"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={4}
                  className="rounded-t-none border-t-0"
                />
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
                    setNewTaskStartDate(
                      selectedDate && isValid(new Date(selectedDate + "T00:00:00"))
                        ? selectedDate
                        : format(new Date(), "yyyy-MM-dd"),
                    )
                    setNewTaskEndDate("")
                    setNewTaskClientTags([])
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Debug:</strong> Total: {tasks.length} | Abertas: {openTasks.length} | Fechadas:{" "}
              {closedTasks.length}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tarefas Abertas */}
      {openTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Tarefas Abertas ({openTasks.length})
            </h3>
            <Badge variant="secondary">{openTasks.length} em andamento</Badge>
          </div>
          {openTasks.map((task) => (
            <div key={task.id} className="relative">
              <TaskItem task={task} onUpdate={updateTask} onDelete={deleteTask} />
              {calculateTaskDuration(task) && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    {calculateTaskDuration(task)} dias
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Separador */}
      {openTasks.length > 0 && closedTasks.length > 0 && filters.showClosed && <Separator className="my-6" />}

      {/* Tarefas Fechadas */}
      {closedTasks.length > 0 && filters.showClosed && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
              Tarefas Fechadas ({closedTasks.length})
            </h3>
            <Badge variant="outline">{closedTasks.length} concluídas</Badge>
          </div>
          {closedTasks.map((task) => (
            <div key={task.id} className="relative opacity-75">
              <TaskItem task={task} onUpdate={updateTask} onDelete={deleteTask} />
              {calculateTaskDuration(task) && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs">
                    {calculateTaskDuration(task)} dias
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estado Vazio */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma tarefa encontrada</p>
          <p className="text-sm">Clique em "Nova Tarefa" para começar</p>
        </div>
      )}
    </div>
  )
}
