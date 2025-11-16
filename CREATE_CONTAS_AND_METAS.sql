-- ============================================
-- TABELA: contas (Cartões de Crédito, Contas Bancárias, etc)
-- ============================================
CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- Ex: "Nubank", "Cartão Itaú", "Carteira"
  tipo TEXT NOT NULL DEFAULT 'cartao_credito', -- 'cartao_credito', 'conta_corrente', 'poupanca', 'carteira', 'outro'
  banco TEXT, -- Nome do banco (opcional)
  ultimos_4_digitos TEXT, -- Últimos 4 dígitos do cartão (opcional)
  limite DECIMAL(10,2), -- Limite do cartão (para cartões de crédito)
  saldo_inicial DECIMAL(10,2) DEFAULT 0, -- Saldo inicial da conta
  cor TEXT DEFAULT '#6366f1', -- Cor para identificação visual
  icone TEXT DEFAULT '💳', -- Ícone para identificação
  ativo BOOLEAN DEFAULT true, -- Se a conta está ativa
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_user_id ON contas(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_ativo ON contas(ativo);

-- ============================================
-- ADICIONAR COLUNA conta_id NA TABELA transacoes
-- ============================================
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS conta_id INTEGER REFERENCES contas(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_id ON transacoes(conta_id);

-- ============================================
-- TABELA: metas_financeiras
-- ============================================
CREATE TABLE IF NOT EXISTS metas_financeiras (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, -- Ex: "Economizar para viagem", "Gastar menos de R$ 500 em alimentação"
  tipo TEXT NOT NULL, -- 'economizar', 'gastar_menos', 'gastar_mais', 'receber_mais'
  categoria TEXT, -- Categoria específica (opcional, NULL = todas)
  valor_meta DECIMAL(10,2) NOT NULL, -- Valor da meta
  valor_atual DECIMAL(10,2) DEFAULT 0, -- Valor atual acumulado
  periodo TEXT NOT NULL DEFAULT 'mensal', -- 'diario', 'semanal', 'mensal', 'anual'
  data_inicio DATE NOT NULL,
  data_fim DATE, -- NULL = sem data de término
  conta_id INTEGER REFERENCES contas(id) ON DELETE SET NULL, -- Meta específica para uma conta (opcional)
  ativo BOOLEAN DEFAULT true,
  concluida BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas_financeiras(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_ativo ON metas_financeiras(ativo);
CREATE INDEX IF NOT EXISTS idx_metas_concluida ON metas_financeiras(concluida);

-- ============================================
-- TABELA: progresso_metas (Histórico de progresso)
-- ============================================
CREATE TABLE IF NOT EXISTS progresso_metas (
  id SERIAL PRIMARY KEY,
  meta_id INTEGER NOT NULL REFERENCES metas_financeiras(id) ON DELETE CASCADE,
  valor_anterior DECIMAL(10,2) NOT NULL,
  valor_novo DECIMAL(10,2) NOT NULL,
  diferenca DECIMAL(10,2) NOT NULL, -- Diferença (pode ser positiva ou negativa)
  data_registro TIMESTAMP DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_progresso_meta_id ON progresso_metas(meta_id);
CREATE INDEX IF NOT EXISTS idx_progresso_data ON progresso_metas(data_registro);

-- ============================================
-- RLS (Row Level Security) - Segurança
-- ============================================

-- Contas: Usuários só podem ver/editar suas próprias contas
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contas" ON contas;
CREATE POLICY "Users can view own contas" ON contas
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own contas" ON contas;
CREATE POLICY "Users can insert own contas" ON contas
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own contas" ON contas;
CREATE POLICY "Users can update own contas" ON contas
  FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete own contas" ON contas;
CREATE POLICY "Users can delete own contas" ON contas
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Metas: Usuários só podem ver/editar suas próprias metas
ALTER TABLE metas_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metas" ON metas_financeiras;
CREATE POLICY "Users can view own metas" ON metas_financeiras
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own metas" ON metas_financeiras;
CREATE POLICY "Users can insert own metas" ON metas_financeiras
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own metas" ON metas_financeiras;
CREATE POLICY "Users can update own metas" ON metas_financeiras
  FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete own metas" ON metas_financeiras;
CREATE POLICY "Users can delete own metas" ON metas_financeiras
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Progresso: Usuários só podem ver progresso de suas próprias metas
ALTER TABLE progresso_metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progresso" ON progresso_metas;
CREATE POLICY "Users can view own progresso" ON progresso_metas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM metas_financeiras 
      WHERE metas_financeiras.id = progresso_metas.meta_id 
      AND metas_financeiras.user_id::text = auth.uid()::text
    )
  );

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE contas IS 'Contas e cartões do usuário (cartões de crédito, contas bancárias, etc)';
COMMENT ON TABLE metas_financeiras IS 'Metas financeiras do usuário (economizar, gastar menos, etc)';
COMMENT ON TABLE progresso_metas IS 'Histórico de progresso das metas financeiras';

