-- 🔧 CORRIGIR POLÍTICAS RLS PARA CONTAS E METAS
-- Execute este SQL no Supabase SQL Editor
-- 
-- PROBLEMA: As políticas RLS estavam usando auth.uid() mas o sistema usa autenticação JWT customizada no backend
-- SOLUÇÃO: Permitir todas as operações, já que a autenticação é validada no backend Node.js

-- ============================================
-- TABELA: contas
-- ============================================

-- Remover políticas antigas que usam auth.uid()
DROP POLICY IF EXISTS "Users can view own contas" ON contas;
DROP POLICY IF EXISTS "Users can insert own contas" ON contas;
DROP POLICY IF EXISTS "Users can update own contas" ON contas;
DROP POLICY IF EXISTS "Users can delete own contas" ON contas;

-- Criar políticas que permitem todas as operações
-- (A autenticação é validada no backend através do JWT)
CREATE POLICY "Allow all operations on contas"
ON contas
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- TABELA: metas_financeiras
-- ============================================

-- Remover políticas antigas que usam auth.uid()
DROP POLICY IF EXISTS "Users can view own metas" ON metas_financeiras;
DROP POLICY IF EXISTS "Users can insert own metas" ON metas_financeiras;
DROP POLICY IF EXISTS "Users can update own metas" ON metas_financeiras;
DROP POLICY IF EXISTS "Users can delete own metas" ON metas_financeiras;

-- Criar políticas que permitem todas as operações
-- (A autenticação é validada no backend através do JWT)
CREATE POLICY "Allow all operations on metas_financeiras"
ON metas_financeiras
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- TABELA: progresso_metas
-- ============================================

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view own progresso" ON progresso_metas;

-- Criar política que permite todas as operações
CREATE POLICY "Allow all operations on progresso_metas"
ON progresso_metas
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('contas', 'metas_financeiras', 'progresso_metas')
ORDER BY tablename, policyname;

-- Verificar se RLS está ativado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('contas', 'metas_financeiras', 'progresso_metas');

