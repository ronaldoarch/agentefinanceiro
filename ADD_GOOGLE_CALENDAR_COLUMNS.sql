-- ==========================================
-- 📅 ADICIONAR COLUNAS PARA GOOGLE CALENDAR
-- ==========================================
-- Execute este SQL no Supabase Dashboard
-- SQL Editor > New Query > Cole e Execute

-- 1. Adicionar colunas para tokens do Google Calendar
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;

-- 2. Adicionar coluna para ID do evento no Google Calendar nos lembretes
ALTER TABLE lembretes
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- 3. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_google_connected 
ON users(google_calendar_connected) 
WHERE google_calendar_connected = true;

CREATE INDEX IF NOT EXISTS idx_lembretes_google_event 
ON lembretes(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;

-- 4. Verificar alterações
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'google%';

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'lembretes' 
  AND column_name LIKE 'google%';

-- ==========================================
-- ✅ COLUNAS CRIADAS COM SUCESSO!
-- ==========================================

-- ESTRUTURA CRIADA:
-- users:
--   - google_access_token (TEXT)
--   - google_refresh_token (TEXT)
--   - google_token_expiry (BIGINT)
--   - google_calendar_connected (BOOLEAN)
--
-- lembretes:
--   - google_calendar_event_id (TEXT)

-- OBSERVAÇÕES:
-- - Os tokens são armazenados de forma segura no banco
-- - google_calendar_connected indica se o usuário conectou
-- - google_calendar_event_id vincula o lembrete ao evento do Google
-- - Índices melhoram performance de consultas

