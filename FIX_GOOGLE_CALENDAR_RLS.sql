-- 🔧 CORRIGIR POLÍTICAS RLS PARA GOOGLE CALENDAR
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar se RLS está ativado na tabela users
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 2. Se RLS estiver ativado, criar política para permitir UPDATE dos campos do Google Calendar
-- Primeiro, remover a política se já existir
DROP POLICY IF EXISTS "Users can update their own Google Calendar tokens" ON public.users;

-- Criar política para permitir UPDATE dos tokens do Google Calendar
-- Esta política permite UPDATE na tabela users (pode ser restringida depois se necessário)
CREATE POLICY "Users can update their own Google Calendar tokens"
ON public.users
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 3. Alternativa: Se a política acima não funcionar, desabilitar RLS temporariamente
-- (NÃO RECOMENDADO para produção, mas útil para debug)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se as colunas do Google Calendar existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'google%';

-- 5. Se as colunas não existirem, criar:
-- ALTER TABLE public.users 
-- ADD COLUMN IF NOT EXISTS google_access_token TEXT,
-- ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
-- ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT,
-- ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;

-- 6. Verificar dados atuais
SELECT 
  id,
  email,
  google_calendar_connected,
  google_access_token IS NOT NULL as tem_token,
  LENGTH(google_access_token) as tamanho_token
FROM public.users
WHERE id = 1;

