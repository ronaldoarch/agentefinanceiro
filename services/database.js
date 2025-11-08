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
    CREATE TABLE IF NOT EXISTS transacoes (
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
  getEstatisticasPorCategoria
};

