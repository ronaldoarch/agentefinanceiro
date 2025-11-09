-- ============================================
-- DESABILITAR ROW-LEVEL SECURITY (RLS)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Desabilitar RLS em TODAS as tabelas
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- Verificar status do RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resultado esperado: rowsecurity = false para todas as tabelas

