const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const DB_PATH = process.env.DB_PATH || './database.sqlite';
let db;

// Inicializar banco de dados
function init() {
  // Criar diretório se não existir
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Diretório criado: ${dbDir}`);
  }
  
  db = new Database(DB_PATH);
  
  // Criar tabelas
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user', -- 'user', 'admin'
      plan TEXT DEFAULT 'free', -- 'free', 'premium', 'enterprise'
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

  console.log('✅ Banco de dados inicializado');
}

// Adicionar transação
function addTransacao(tipo, valor, categoria, descricao, mensagemOriginal) {
  const stmt = db.prepare(`
    INSERT INTO transacoes (tipo, valor, categoria, descricao, data, mensagem_original)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const data = moment().format('YYYY-MM-DD HH:mm:ss');
  const result = stmt.run(tipo, valor, categoria, descricao, data, mensagemOriginal);
  
  return result.lastInsertRowid;
}

// Obter todas as transações
function getTransacoes(limit = 100) {
  const stmt = db.prepare(`
    SELECT * FROM transacoes 
    ORDER BY data DESC 
    LIMIT ?
  `);
  
  return stmt.all(limit);
}

// Obter transações por período
function getTransacoesPorPeriodo(dataInicio, dataFim) {
  const stmt = db.prepare(`
    SELECT * FROM transacoes 
    WHERE date(data) BETWEEN date(?) AND date(?)
    ORDER BY data DESC
  `);
  
  return stmt.all(dataInicio, dataFim);
}

// Obter resumo financeiro
function getResumo() {
  const stmt = db.prepare(`
    SELECT 
      tipo,
      SUM(valor) as total,
      COUNT(*) as quantidade
    FROM transacoes
    WHERE date(data) >= date('now', 'start of month')
    GROUP BY tipo
  `);
  
  const resultado = stmt.all();
  
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
function getResumoMensal(mes, ano) {
  const stmt = db.prepare(`
    SELECT 
      tipo,
      categoria,
      SUM(valor) as total,
      COUNT(*) as quantidade
    FROM transacoes
    WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?
    GROUP BY tipo, categoria
  `);
  
  return stmt.all(mes, ano);
}

// Adicionar alerta
function addAlerta(tipo, titulo, mensagem) {
  const stmt = db.prepare(`
    INSERT INTO alertas (tipo, titulo, mensagem, data)
    VALUES (?, ?, ?, ?)
  `);
  
  const data = moment().format('YYYY-MM-DD HH:mm:ss');
  const result = stmt.run(tipo, titulo, mensagem, data);
  
  return result.lastInsertRowid;
}

// Obter alertas
function getAlertas(limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM alertas 
    ORDER BY data DESC 
    LIMIT ?
  `);
  
  return stmt.all(limit);
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
function createUser(email, password, name, role = 'user', plan = 'free') {
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
      SUM(CASE WHEN plan = 'free' THEN 1 ELSE 0 END) as free_users,
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

module.exports = {
  init,
  addTransacao,
  getTransacoes,
  getTransacoesPorPeriodo,
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
  getAdminStats
};

