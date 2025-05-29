export interface User {
  id?: string
  email: string
  name?: string
  image?: string
  provider?: string
  provider_id?: string
  role?: string
  created_at?: string
  updated_at?: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  status: "pending" | "completed" | "canceled" | "paused" | "blocked" | "in_progress"
  completed: boolean
  task_date: string
  created_at: string
  updated_at: string
  tag?: string
}

export interface DailySummary {
  id: string
  user_id: string
  summary_date: string
  manual_summary?: string
  generated_summary?: string
  tasks_completed: Task[]
  created_at: string
  updated_at: string
}

export interface CreateTaskData {
  title: string
  description?: string
  task_date?: string
  status?: string
  tag?: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: "pending" | "completed" | "canceled" | "paused" | "blocked" | "in_progress"
  completed?: boolean
  tag?: string
}

export interface SystemSettings {
  id: string
  key: string
  value: string
  description: string
  created_at?: string
  updated_at?: string
}

export interface AppConfig {
  title: string
  description: string
}
