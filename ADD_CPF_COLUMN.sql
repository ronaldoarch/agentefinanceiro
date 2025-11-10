-- ============================================
-- ADICIONAR COLUNA CPF NA TABELA USERS
-- Execute no Supabase SQL Editor
-- ============================================

-- Adicionar coluna tax_id (CPF/CNPJ) na tabela users
ALTER TABLE users 
ADD COLUMN tax_id VARCHAR(20);

-- Adicionar coluna phone (telefone) na tabela users
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20);

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Sucesso! Agora os usuários podem cadastrar CPF e telefone

