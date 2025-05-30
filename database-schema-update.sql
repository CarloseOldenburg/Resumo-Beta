-- Limpar e otimizar banco de dados
-- Execute este script para garantir que tudo esteja funcionando corretamente

-- 1. Verificar e criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  task_date DATE,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'in_progress',
  completed BOOLEAN DEFAULT FALSE,
  client_tags TEXT[],
  tag VARCHAR(255), -- Manter para compatibilidade
  estimated_hours INTEGER DEFAULT 0,
  actual_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  content TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_pending INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_client_tags ON tasks USING GIN(client_tags);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_id ON daily_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(summary_date);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_client_tags_name ON client_tags(name);

-- 3. Inserir usuário admin padrão se não existir
INSERT INTO users (email, name, role) 
VALUES ('admin@qamanager.com', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 4. Inserir configurações padrão do sistema
INSERT INTO system_settings (key, value, description) VALUES
  ('app_name', 'Resumo Beta', 'Nome da aplicação'),
  ('app_description', 'Gerencie suas tarefas e gere resumos para daily meetings', 'Descrição da aplicação'),
  ('openai_model', 'gpt-4o', 'Modelo padrão da OpenAI'),
  ('primary_color', '#3B82F6', 'Cor primária do tema'),
  ('accent_color', '#10B981', 'Cor de destaque do tema'),
  ('logo_url', '', 'URL do logo da aplicação'),
  ('favicon_url', '', 'URL do favicon'),
  ('backup_enabled', 'true', 'Backup automático habilitado')
ON CONFLICT (key) DO NOTHING;

-- 5. Inserir tags de cliente padrão
INSERT INTO client_tags (name, color, description) VALUES
  ('Mania de Churrasco', '#EF4444', 'Cliente Mania de Churrasco'),
  ('Chiquinho', '#10B981', 'Cliente Chiquinho'),
  ('Saipos', '#8B5CF6', 'Cliente Saipos'),
  ('Sysmo', '#F59E0B', 'Cliente Sysmo'),
  ('Interno', '#6B7280', 'Projetos internos'),
  ('Freelance', '#EC4899', 'Projetos freelance')
ON CONFLICT (name) DO NOTHING;

-- 6. Limpar dados inconsistentes
-- Atualizar tarefas sem status
UPDATE tasks 
SET status = 'in_progress' 
WHERE status IS NULL OR status = '';

-- Atualizar tarefas sem data de início
UPDATE tasks 
SET start_date = task_date
WHERE start_date IS NULL AND task_date IS NOT NULL;

-- Atualizar tarefas sem task_date
UPDATE tasks 
SET task_date = start_date
WHERE task_date IS NULL AND start_date IS NOT NULL;

-- Sincronizar campo completed com status
UPDATE tasks 
SET completed = (status IN ('completed', 'canceled'));

-- 7. Verificar integridade dos dados
-- Esta query mostra estatísticas do banco
SELECT 
  'users' as table_name, 
  COUNT(*) as total_records 
FROM users
UNION ALL
SELECT 
  'tasks' as table_name, 
  COUNT(*) as total_records 
FROM tasks
UNION ALL
SELECT 
  'daily_summaries' as table_name, 
  COUNT(*) as total_records 
FROM daily_summaries
UNION ALL
SELECT 
  'system_settings' as table_name, 
  COUNT(*) as total_records 
FROM system_settings
UNION ALL
SELECT 
  'client_tags' as table_name, 
  COUNT(*) as total_records 
FROM client_tags;

-- 8. Mostrar estatísticas das tarefas
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM tasks 
GROUP BY status
ORDER BY count DESC;
