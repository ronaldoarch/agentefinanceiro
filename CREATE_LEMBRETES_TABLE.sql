-- ==========================================
-- 📋 TABELA DE LEMBRETES FINANCEIROS
-- ==========================================
-- Execute este SQL no Supabase Dashboard
-- SQL Editor > New Query > Cole e Execute

-- 1. Criar tabela de lembretes
CREATE TABLE IF NOT EXISTS lembretes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2),
  categoria VARCHAR(100) DEFAULT 'outros',
  data_vencimento TIMESTAMP NOT NULL,
  recorrencia VARCHAR(50) DEFAULT 'unico', -- unico, diario, semanal, mensal, anual
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, concluido, atrasado, cancelado
  notificar_whatsapp BOOLEAN DEFAULT true,
  dias_antecedencia INTEGER DEFAULT 1, -- quantos dias antes notificar
  ultima_notificacao TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lembretes_user_id ON lembretes(user_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_status ON lembretes(status);
CREATE INDEX IF NOT EXISTS idx_lembretes_data_vencimento ON lembretes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_lembretes_recorrencia ON lembretes(recorrencia);

-- 3. Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_lembretes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS lembretes_updated_at ON lembretes;
CREATE TRIGGER lembretes_updated_at
  BEFORE UPDATE ON lembretes
  FOR EACH ROW
  EXECUTE FUNCTION update_lembretes_timestamp();

-- 5. Desabilitar RLS (se estiver usando)
ALTER TABLE lembretes DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- ✅ TABELA CRIADA COM SUCESSO!
-- ==========================================

-- TESTE: Inserir um lembrete de exemplo
-- INSERT INTO lembretes (user_id, titulo, descricao, valor, categoria, data_vencimento, recorrencia) 
-- VALUES (1, 'Pagar Internet', 'Vencimento da internet', 99.90, 'contas', NOW() + INTERVAL '3 days', 'mensal');

-- CONSULTAR: Ver lembretes criados
-- SELECT * FROM lembretes ORDER BY data_vencimento ASC;

