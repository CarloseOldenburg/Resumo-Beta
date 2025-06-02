-- Correção simples do sistema de usuários
-- Usar apenas colunas que existem na tabela users

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Criar/atualizar o usuário admin original
INSERT INTO users (email, name, created_at, updated_at) VALUES
  ('carlos.oldenburg@videosoft.com.br', 'Carlos Oldenburg', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = 'Carlos Oldenburg',
  updated_at = NOW();

-- 3. Criar os dois novos usuários
INSERT INTO users (email, name, created_at, updated_at) VALUES
  ('usuario1@qamanager.com', 'Usuário 1', NOW(), NOW()),
  ('usuario2@qamanager.com', 'Usuário 2', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 4. Garantir que todas as tarefas existentes pertencem ao admin
UPDATE tasks 
SET user_id = (
  SELECT id FROM users 
  WHERE email = 'carlos.oldenburg@videosoft.com.br' 
  LIMIT 1
)
WHERE user_id IS NULL;

-- 5. Verificar usuários criados
SELECT 
  id,
  email,
  name,
  created_at
FROM users 
ORDER BY email;
