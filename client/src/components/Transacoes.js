import React, { useState } from 'react';
import './Transacoes.css';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function Transacoes({ transacoes }) {
  const [filtro, setFiltro] = useState('todas'); // todas, receitas, despesas
  const [busca, setBusca] = useState('');

  // Filtrar transações
  const transacoesFiltradas = transacoes.filter(t => {
    const matchFiltro = filtro === 'todas' || t.tipo === filtro.slice(0, -1);
    const matchBusca = busca === '' || 
      t.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      t.categoria.toLowerCase().includes(busca.toLowerCase());
    
    return matchFiltro && matchBusca;
  });

  // Agrupar por data
  const transacoesAgrupadas = {};
  transacoesFiltradas.forEach(t => {
    const data = moment(t.data).format('YYYY-MM-DD');
    if (!transacoesAgrupadas[data]) {
      transacoesAgrupadas[data] = [];
    }
    transacoesAgrupadas[data].push(t);
  });

  // Estatísticas
  const totalReceitas = transacoesFiltradas
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + t.valor, 0);
  
  const totalDespesas = transacoesFiltradas
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + t.valor, 0);

  return (
    <div className="transacoes">
      {/* Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total de Transações</div>
            <div className="stat-value">{transacoesFiltradas.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">Total Receitas</div>
            <div className="stat-value receitas">R$ {totalReceitas.toFixed(2)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <div className="stat-label">Total Despesas</div>
            <div className="stat-value despesas">R$ {totalDespesas.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="filtros">
          <div className="filtros-buttons">
            <button 
              className={`filtro-btn ${filtro === 'todas' ? 'active' : ''}`}
              onClick={() => setFiltro('todas')}
            >
              Todas
            </button>
            <button 
              className={`filtro-btn ${filtro === 'receitas' ? 'active' : ''}`}
              onClick={() => setFiltro('receitas')}
            >
              📈 Receitas
            </button>
            <button 
              className={`filtro-btn ${filtro === 'despesas' ? 'active' : ''}`}
              onClick={() => setFiltro('despesas')}
            >
              📉 Despesas
            </button>
          </div>
          
          <div className="busca">
            <input
              type="text"
              placeholder="🔍 Buscar transação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="busca-input"
            />
          </div>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="transacoes-lista">
        {Object.keys(transacoesAgrupadas).length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Nenhuma transação encontrada</h3>
              <p>Comece enviando uma mensagem pelo WhatsApp</p>
            </div>
          </div>
        ) : (
          Object.keys(transacoesAgrupadas)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(data => (
              <div key={data} className="card">
                <div className="grupo-data">
                  <h3 className="data-titulo">
                    {moment(data).calendar(null, {
                      sameDay: '[Hoje]',
                      lastDay: '[Ontem]',
                      lastWeek: 'dddd',
                      sameElse: 'DD [de] MMMM [de] YYYY'
                    })}
                  </h3>
                  <div className="transacoes-dia">
                    {transacoesAgrupadas[data].map((t, index) => (
                      <div key={index} className={`transacao-card ${t.tipo}`}>
                        <div className="transacao-esquerda">
                          <div className="transacao-icon">
                            {t.tipo === 'receita' ? '📈' : '📉'}
                          </div>
                          <div className="transacao-detalhes">
                            <div className="transacao-descricao">{t.descricao}</div>
                            <div className="transacao-info">
                              <span className="transacao-categoria">{t.categoria}</span>
                              <span className="transacao-hora">
                                {moment(t.data).format('HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`transacao-valor ${t.tipo}`}>
                          {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default Transacoes;

