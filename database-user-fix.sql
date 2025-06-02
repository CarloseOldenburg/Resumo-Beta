-- Correção do sistema de usuários
-- Manter usuário original e criar novos usuários

-- 1. Garantir que o usuário admin original existe e está correto
UPDATE users 
SET 
  email = 'carlos.oldenburg@videosoft.com.br',
  name = 'Carlos Oldenburg',
  username = 'admin',
  role = 'admin',
  is_active = true,
  updated_at = NOW()
WHERE email = 'admin@qamanager.com' OR username = 'admin';

-- Se não existir, criar o usuário admin original
INSERT INTO users (email, name, username, role, is_active) VALUES
  ('carlos.oldenburg@videosoft.com.br', 'Carlos Oldenburg', 'admin', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. Criar os dois novos usuários
INSERT INTO users (email, name, username, role, is_active) VALUES
  ('usuario1@qamanager.com', 'Usuário 1', 'usuario1', 'user', true),
  ('usuario2@qamanager.com', 'Usuário 2', 'usuario2', 'user', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. Garantir que todas as tarefas existentes pertencem ao admin
UPDATE tasks 
SET user_id = (
  SELECT id FROM users 
  WHERE email = 'carlos.oldenburg@videosoft.com.br' 
  LIMIT 1
)
WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM users WHERE is_active = true);

-- 4. Verificar usuários criados
SELECT 
  id,
  email,
  name,
  username,
  role,
  is_active,
  created_at
FROM users 
WHERE is_active = true
ORDER BY role DESC, username;

-- 5. Verificar associação das tarefas
SELECT 
  u.username,
  u.name,
  COUNT(t.id) as total_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.name
ORDER BY u.username;
