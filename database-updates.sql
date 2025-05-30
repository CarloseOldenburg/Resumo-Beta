-- Atualizar tabela de tarefas com novas colunas
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS client_tags TEXT[],
ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_hours INTEGER DEFAULT 0;

-- Criar tabela para tags de cliente
CREATE TABLE IF NOT EXISTS client_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tags de cliente padrão
INSERT INTO client_tags (name, color, description) 
VALUES 
  ('Mania de Churrasco', '#EF4444', 'Cliente Mania de Churrasco'),
  ('Chiquinho', '#10B981', 'Cliente Chiquinho'),
  ('Saipos', '#8B5CF6', 'Cliente Saipos'),
  ('Sysmo', '#F59E0B', 'Cliente Sysmo')
ON CONFLICT (name) DO NOTHING;

-- Atualizar tarefas existentes
UPDATE tasks 
SET 
  start_date = task_date::date,
  status = COALESCE(status, 'in_progress')
WHERE start_date IS NULL;

-- Atualizar status padrão para 'in_progress' em tarefas sem status
UPDATE tasks 
SET status = 'in_progress' 
WHERE status IS NULL OR status = 'pending';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_client_tags ON tasks USING GIN(client_tags);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_tags_name ON client_tags(name);
