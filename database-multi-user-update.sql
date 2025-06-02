-- Atualização para sistema multi-usuário
-- Execute este script para preparar o banco para múltiplos usuários

-- 1. Atualizar tabela de usuários com novos campos
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- 3. Inserir usuários padrão (senhas serão hasheadas pela aplicação)
-- Usuário Admin (já existe, vamos atualizar)
UPDATE users 
SET 
  username = 'admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'admin@qamanager.com';

-- Inserir novos usuários (senhas serão definidas pela aplicação)
INSERT INTO users (email, name, username, role, is_active) VALUES
  ('user1@qamanager.com', 'Usuário 1', 'user1', 'user', true),
  ('user2@qamanager.com', 'Usuário 2', 'user2', 'user', true)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 4. Verificar integridade referencial das tarefas
-- Garantir que todas as tarefas tenham user_id válido
UPDATE tasks 
SET user_id = (SELECT id FROM users WHERE email = 'admin@qamanager.com' LIMIT 1)
WHERE user_id IS NULL;

-- 5. Criar view para estatísticas por usuário
CREATE OR REPLACE VIEW user_task_stats AS
SELECT 
  u.id as user_id,
  u.username,
  u.name,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.completed = true THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.completed = false THEN 1 END) as open_tasks,
  ROUND(
    CASE 
      WHEN COUNT(t.id) > 0 
      THEN (COUNT(CASE WHEN t.completed = true THEN 1 END) * 100.0 / COUNT(t.id))
      ELSE 0 
    END, 2
  ) as completion_rate
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.name;

-- 6. Mostrar estatísticas atuais
SELECT * FROM user_task_stats ORDER BY username;

-- 7. Verificar estrutura final
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'tasks') 
ORDER BY table_name, ordinal_position;
