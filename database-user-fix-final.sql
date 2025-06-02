-- Correção final do sistema de usuários
-- Garantir que o usuário admin original seja criado corretamente

-- 1. Limpar dados inconsistentes
DELETE FROM users WHERE email = 'admin@qamanager.com';

-- 2. Criar/atualizar o usuário admin original
INSERT INTO users (email, name, username, role, is_active, created_at, updated_at) VALUES
  ('carlos.oldenburg@videosoft.com.br', 'Carlos Oldenburg', 'admin', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = 'Carlos Oldenburg',
  username = 'admin',
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- 3. Criar os dois novos usuários
INSERT INTO users (email, name, username, role, is_active, created_at, updated_at) VALUES
  ('usuario1@qamanager.com', 'Usuário 1', 'usuario1', 'user', true, NOW(), NOW()),
  ('usuario2@qamanager.com', 'Usuário 2', 'usuario2', 'user', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  is_active = true,
  updated_at = NOW();

-- 4. Garantir que todas as tarefas existentes pertencem ao admin
UPDATE tasks 
SET user_id = (
  SELECT id FROM users 
  WHERE email = 'carlos.oldenburg@videosoft.com.br' 
  LIMIT 1
)
WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM users WHERE is_active = true);

-- 5. Verificar se os usuários foram criados corretamente
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
