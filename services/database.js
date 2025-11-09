const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const DB_PATH = process.env.DB_PATH || './database.sqlite';
let db;

// Inicializar banco de dados
function init() {
  console.log('🔍 DB_PATH configurado:', DB_PATH);
  console.log('🔍 Diretório atual:', __dirname);
  
  // Criar diretório se não existir
  const dbDir = path.dirname(DB_PATH);
  console.log('🔍 Diretório do banco:', dbDir);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Diretório criado: ${dbDir}`);
  } else {
    console.log(`✅ Diretório já existe: ${dbDir}`);
  }
  
  // Verificar se banco existe antes
  const dbExists = fs.existsSync(DB_PATH);
  console.log(dbExists ? `✅ Banco de dados encontrado: ${DB_PATH}` : `🆕 Criando novo banco: ${DB_PATH}`);
  
  db = new Database(DB_PATH);
  
  // Verificar tamanho do arquivo
  try {
    const stats = fs.statSync(DB_PATH);
    console.log(`📊 Tamanho do banco: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (e) {
    console.log('⚠️ Não foi possível verificar tamanho do banco');
  }
  
  // Criar tabelas
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user', -- 'user', 'admin'
      plan TEXT DEFAULT 'basico', -- 'basico', 'premium', 'enterprise'
      whatsapp_number TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      user_id INTEGER NOT NULL,
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL, -- 'receita' ou 'despesa'
      valor REAL NOT NULL,
      categoria TEXT,
      descricao TEXT,
      data TEXT NOT NULL,
      origem TEXT DEFAULT 'whatsapp',
      mensagem_original TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alertas (
      user_id INTEGER NOT NULL,
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL, -- 'info', 'warning', 'danger'
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      lido INTEGER DEFAULT 0,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE NOT NULL,
      tipo TEXT NOT NULL, -- 'receita' ou 'despesa'
      icone TEXT,
      cor TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      user_id INTEGER NOT NULL,
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL, -- 'user' ou 'assistant'
      content TEXT NOT NULL,
      audio_transcription TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL, -- 'basico', 'premium', 'enterprise'
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      payment_method TEXT DEFAULT 'pix',
      transaction_id TEXT,
      approved_by INTEGER, -- admin user_id que aprovou
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      approved_at TEXT,
      expires_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      cancelled_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Inserir categorias padrão se não existirem
  const categoriasPadrao = [
    { nome: 'Alimentação', tipo: 'despesa', icone: '🍔', cor: '#FF6B6B' },
    { nome: 'Transporte', tipo: 'despesa', icone: '🚗', cor: '#4ECDC4' },
    { nome: 'Moradia', tipo: 'despesa', icone: '🏠', cor: '#45B7D1' },
    { nome: 'Saúde', tipo: 'despesa', icone: '🏥', cor: '#96CEB4' },
    { nome: 'Educação', tipo: 'despesa', icone: '📚', cor: '#FFEAA7' },
    { nome: 'Lazer', tipo: 'despesa', icone: '🎮', cor: '#DFE6E9' },
    { nome: 'Compras', tipo: 'despesa', icone: '🛒', cor: '#A29BFE' },
    { nome: 'Contas', tipo: 'despesa', icone: '📝', cor: '#FD79A8' },
    { nome: 'Salário', tipo: 'receita', icone: '💰', cor: '#00B894' },
    { nome: 'Freelance', tipo: 'receita', icone: '💼', cor: '#00CEC9' },
    { nome: 'Investimentos', tipo: 'receita', icone: '📈', cor: '#74B9FF' },
    { nome: 'Outros', tipo: 'despesa', icone: '📦', cor: '#B2BEC3' }
  ];

  const insertCategoria = db.prepare(`
    INSERT OR IGNORE INTO categorias (nome, tipo, icone, cor) 
    VALUES (?, ?, ?, ?)
  `);

  categoriasPadrao.forEach(cat => {
    insertCategoria.run(cat.nome, cat.tipo, cat.icone, cat.cor);
  });

  // Verificar quantos registros existem
  const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const countTransacoes = db.prepare('SELECT COUNT(*) as count FROM transacoes').get();
  const countChat = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get();
  
  console.log('✅ Banco de dados inicializado');
  console.log(`📊 Registros no banco:`);
  console.log(`   - Usuários: ${countUsers.count}`);
  console.log(`   - Transações: ${countTransacoes.count}`);
  console.log(`   - Mensagens de chat: ${countChat.count}`);
  console.log(`🔒 Caminho do banco: ${DB_PATH}`);
  console.log(`📁 Banco está em volume persistente? ${DB_PATH.includes('/app/data') ? '✅ SIM' : '❌ NÃO - DADOS VÃO SER PERDIDOS!'}`);
}

// Adicionar transação
function addTransacao(userId, tipo, valor, categoria, descricao, mensagemOriginal) {
  console.log(`💾 SALVANDO TRANSAÇÃO no banco: ${DB_PATH}`);
  console.log(`   User ID: ${userId}, Tipo: ${tipo}, Valor: R$ ${valor}`);
  
  const stmt = db.prepare(`
    INSERT INTO transacoes (user_id, tipo, valor, categoria, descricao, data, mensagem_original)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const data = moment().format('YYYY-MM-DD HH:mm:ss');
  const result = stmt.run(userId, tipo, valor, categoria, descricao, data, mensagemOriginal);
  
  console.log(`✅ TRANSAÇÃO SALVA! ID: ${result.lastInsertRowid}`);
  
  // Verificar se foi realmente salva
  const verificar = db.prepare('SELECT COUNT(*) as count FROM transacoes WHERE user_id = ?').get(userId);
  console.log(`📊 Total de transações do usuário ${userId}: ${verificar.count}`);
  
  return result.lastInsertRowid;
}

// Obter todas as transações
function getTransacoes(userId, limit = 100) {
  console.log(`🔍 BUSCANDO transações do usuário ${userId} no banco: ${DB_PATH}`);
  
  const stmt = db.prepare(`
    SELECT * FROM transacoes 
    WHERE user_id = ?
    ORDER BY data DESC 
    LIMIT ?
  `);
  
  const transacoes = stmt.all(userId, limit);
  console.log(`📊 Encontradas ${transacoes.length} transações para usuário ${userId}`);
  
  if (transacoes.length > 0) {
    console.log(`   Primeira transação: R$ ${transacoes[0].valor} - ${transacoes[0].descricao}`);
  }
  
  return transacoes;
}

// Obter transações por período
function getTransacoesPorPeriodo(userId, dataInicio, dataFim) {
  const stmt = db.prepare(`
    SELECT * FROM transacoes 
    WHERE user_id = ?
      AND date(data) BETWEEN date(?) AND date(?)
    ORDER BY data DESC
  `);
  
  return stmt.all(userId, dataInicio, dataFim);
}

// Deletar transação
function deleteTransacao(userId, transacaoId) {
  console.log(`🗑️ DELETANDO transação ID: ${transacaoId} do usuário ${userId}`);
  
  const stmt = db.prepare(`
    DELETE FROM transacoes 
    WHERE id = ? AND user_id = ?
  `);
  
  const result = stmt.run(transacaoId, userId);
  console.log(`✅ Transação deletada! Linhas afetadas: ${result.changes}`);
  
  return result.changes > 0;
}

// Deletar última transação do usuário (por valor aproximado)
function deleteLastTransacaoByValor(userId, valor) {
  console.log(`🗑️ Buscando transação de R$ ${valor} para deletar...`);
  
  // Buscar transação mais recente com valor aproximado
  const stmt = db.prepare(`
    SELECT id FROM transacoes 
    WHERE user_id = ? 
      AND ABS(valor - ?) < 0.01
    ORDER BY created_at DESC
    LIMIT 1
  `);
  
  const transacao = stmt.get(userId, valor);
  
  if (transacao) {
    return deleteTransacao(userId, transacao.id);
  }
  
  console.log(`⚠️ Transação de R$ ${valor} não encontrada`);
  return false;
}

// Obter resumo financeiro
function getResumo(userId) {
  const stmt = db.prepare(`
    SELECT 
      tipo,
      SUM(valor) as total,
      COUNT(*) as quantidade
    FROM transacoes
    WHERE user_id = ?
      AND date(data) >= date('now', 'start of month')
    GROUP BY tipo
  `);
  
  const resultado = stmt.all(userId);
  
  let receitas = 0;
  let despesas = 0;
  
  resultado.forEach(item => {
    if (item.tipo === 'receita') receitas = item.total;
    if (item.tipo === 'despesa') despesas = item.total;
  });
  
  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    mes: moment().format('MMMM YYYY')
  };
}

// Obter resumo mensal
function getResumoMensal(userId, mes, ano) {
  const stmt = db.prepare(`
    SELECT 
      tipo,
      categoria,
      SUM(valor) as total,
      COUNT(*) as quantidade
    FROM transacoes
    WHERE user_id = ?
      AND strftime('%m', data) = ? 
      AND strftime('%Y', data) = ?
    GROUP BY tipo, categoria
  `);
  
  return stmt.all(userId, mes, ano);
}

// Adicionar alerta
function addAlerta(userId, tipo, titulo, mensagem) {
  const stmt = db.prepare(`
    INSERT INTO alertas (user_id, tipo, titulo, mensagem, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const data = moment().format('YYYY-MM-DD HH:mm:ss');
  const result = stmt.run(userId, tipo, titulo, mensagem, data);
  
  return result.lastInsertRowid;
}

// Obter alertas
function getAlertas(userId, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM alertas 
    WHERE user_id = ?
    ORDER BY data DESC 
    LIMIT ?
  `);
  
  return stmt.all(userId, limit);
}

// Marcar alerta como lido
function marcarAlertaLido(id) {
  const stmt = db.prepare(`
    UPDATE alertas 
    SET lido = 1 
    WHERE id = ?
  `);
  
  return stmt.run(id);
}

// Obter categorias
function getCategorias() {
  const stmt = db.prepare(`SELECT * FROM categorias ORDER BY nome`);
  return stmt.all();
}

// Obter estatísticas por categoria
function getEstatisticasPorCategoria(mes, ano) {
  const stmt = db.prepare(`
    SELECT 
      categoria,
      tipo,
      SUM(valor) as total,
      COUNT(*) as quantidade
    FROM transacoes
    WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?
    GROUP BY categoria, tipo
    ORDER BY total DESC
  `);
  
  return stmt.all(mes, ano);
}

// ================== FUNÇÕES DE USUÁRIO ==================

// Criar usuário
function createUser(email, password, name, role = 'user', plan = 'basico') {
  const stmt = db.prepare(`
    INSERT INTO users (email, password, name, role, plan)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(email, password, name, role, plan);
  return result.lastInsertRowid;
}

// Buscar usuário por email
function getUserByEmail(email) {
  const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
  return stmt.get(email);
}

// Buscar usuário por ID
function getUserById(id) {
  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
  return stmt.get(id);
}

// Atualizar último login
function updateLastLogin(userId) {
  const stmt = db.prepare(`
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  return stmt.run(userId);
}

// Listar todos os usuários (para admin)
function getAllUsers() {
  const stmt = db.prepare(`
    SELECT id, email, name, role, plan, active, created_at, last_login 
    FROM users 
    ORDER BY created_at DESC
  `);
  return stmt.all();
}

// Atualizar plano do usuário
function updateUserPlan(userId, plan) {
  const stmt = db.prepare(`
    UPDATE users 
    SET plan = ? 
    WHERE id = ?
  `);
  return stmt.run(plan, userId);
}

// Desativar/Ativar usuário
function toggleUserActive(userId) {
  const stmt = db.prepare(`
    UPDATE users 
    SET active = NOT active 
    WHERE id = ?
  `);
  return stmt.run(userId);
}

// Estatísticas para admin
function getAdminStats() {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_users,
      SUM(CASE WHEN plan = 'basico' THEN 1 ELSE 0 END) as basico_users,
      SUM(CASE WHEN plan = 'premium' THEN 1 ELSE 0 END) as premium_users,
      SUM(CASE WHEN plan = 'enterprise' THEN 1 ELSE 0 END) as enterprise_users
    FROM users
  `);
  return stmt.get();
}

// Adicionar mensagem de chat
function addChatMessage(userId, role, content, audioTranscription = null) {
  const stmt = db.prepare(`
    INSERT INTO chat_messages (user_id, role, content, audio_transcription)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, role, content, audioTranscription);
  return result.lastInsertRowid;
}

// Obter histórico de chat
function getChatHistory(userId, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM chat_messages 
    WHERE user_id = ?
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  
  return stmt.all(userId, limit).reverse(); // Reverter para ordem cronológica
}

// Limpar histórico de chat
function clearChatHistory(userId) {
  const stmt = db.prepare(`DELETE FROM chat_messages WHERE user_id = ?`);
  return stmt.run(userId);
}

// ================== FUNÇÕES DE PAGAMENTO ==================

// Criar pagamento
function createPayment(userId, plan, amount) {
  const stmt = db.prepare(`
    INSERT INTO payments (user_id, plan, amount)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(userId, plan, amount);
  return result.lastInsertRowid;
}

// Aprovar pagamento
function approvePayment(paymentId, adminId, transactionId = null) {
  const stmt = db.prepare(`
    UPDATE payments 
    SET status = 'approved', 
        approved_by = ?, 
        approved_at = CURRENT_TIMESTAMP,
        transaction_id = ?
    WHERE id = ?
  `);
  
  return stmt.run(adminId, transactionId, paymentId);
}

// Listar pagamentos pendentes
function getPendingPayments() {
  const stmt = db.prepare(`
    SELECT p.*, u.name, u.email 
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'pending'
    ORDER BY p.created_at DESC
  `);
  
  return stmt.all();
}

// Listar todos os pagamentos
function getAllPayments(limit = 100) {
  const stmt = db.prepare(`
    SELECT p.*, u.name, u.email 
    FROM payments p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ?
  `);
  
  return stmt.all(limit);
}

// Criar/Atualizar assinatura
function createSubscription(userId, plan, expiresAt) {
  const stmt = db.prepare(`
    INSERT INTO subscriptions (user_id, plan, expires_at)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(userId, plan, expiresAt);
  return result.lastInsertRowid;
}

// Verificar assinatura ativa
function getActiveSubscription(userId) {
  const stmt = db.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? 
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ORDER BY created_at DESC
    LIMIT 1
  `);
  
  return stmt.get(userId);
}

module.exports = {
  init,
  addTransacao,
  getTransacoes,
  getTransacoesPorPeriodo,
  deleteTransacao,
  deleteLastTransacaoByValor,
  getResumo,
  getResumoMensal,
  addAlerta,
  getAlertas,
  marcarAlertaLido,
  getCategorias,
  getEstatisticasPorCategoria,
  addChatMessage,
  getChatHistory,
  clearChatHistory,
  // Funções de usuário
  createUser,
  getUserByEmail,
  getUserById,
  updateLastLogin,
  getAllUsers,
  updateUserPlan,
  toggleUserActive,
  getAdminStats,
  // Funções de pagamento
  createPayment,
  approvePayment,
  getPendingPayments,
  getAllPayments,
  createSubscription,
  getActiveSubscription
};

