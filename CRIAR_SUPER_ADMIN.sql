-- ==========================================
-- 🔐 TRANSFORMAR USUÁRIO EM SUPER ADMIN
-- ==========================================
-- Execute este SQL no Supabase Dashboard
-- SQL Editor > New Query > Cole e Execute

-- 1. Verificar usuário atual
SELECT id, email, name, role, plan, active 
FROM users 
WHERE email = 'jgpersonita@gmail.com';

-- 2. Transformar em SUPER ADMIN
UPDATE users 
SET 
  role = 'admin',          -- Define como ADMIN
  plan = 'enterprise',     -- Plano Enterprise
  active = true            -- Garante que está ativo
WHERE email = 'jgpersonita@gmail.com';

-- 3. Verificar mudança
SELECT id, email, name, role, plan, active 
FROM users 
WHERE email = 'jgpersonita@gmail.com';

-- ==========================================
-- ✅ PRONTO! USUÁRIO AGORA É SUPER ADMIN
-- ==========================================

-- PERMISSÕES DO SUPER ADMIN:
-- ✅ Acesso ao painel /admin
-- ✅ Ver todos os usuários
-- ✅ Aprovar pagamentos
-- ✅ Gerenciar planos de usuários
-- ✅ Ativar/desativar usuários
-- ✅ Ver estatísticas gerais
-- ✅ Acesso total ao sistema

-- OBSERVAÇÕES:
-- - Role 'admin' dá acesso ao painel administrativo
-- - Plan 'enterprise' dá todas as funcionalidades
-- - Active 'true' garante que pode fazer login

-- Se quiser criar OUTRO super admin, use:
/*
UPDATE users 
SET 
  role = 'admin',
  plan = 'enterprise',
  active = true
WHERE email = 'SEU_EMAIL@exemplo.com';
*/

