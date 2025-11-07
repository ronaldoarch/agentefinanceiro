import React from 'react';
import './Dashboard.css';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function Dashboard({ resumo, transacoes }) {
  if (!resumo) return null;

  // Preparar dados para gráfico de pizza
  const categoriasData = {};
  transacoes.forEach(t => {
    if (t.tipo === 'despesa') {
      categoriasData[t.categoria] = (categoriasData[t.categoria] || 0) + t.valor;
    }
  });

  const pieData = Object.entries(categoriasData).map(([nome, valor]) => ({
    name: nome,
    value: valor
  }));

  // Cores para o gráfico
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#A29BFE', '#FD79A8'];

  // Dados para gráfico de barras (últimos 7 dias)
  const ultimosDias = [];
  for (let i = 6; i >= 0; i--) {
    const data = moment().subtract(i, 'days').format('YYYY-MM-DD');
    const transacoesDia = transacoes.filter(t => 
      moment(t.data).format('YYYY-MM-DD') === data
    );
    
    const receitas = transacoesDia
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const despesas = transacoesDia
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);

    ultimosDias.push({
      dia: moment(data).format('ddd'),
      receitas,
      despesas
    });
  }

  return (
    <div className="dashboard">
      {/* Cards de resumo */}
      <div className="grid">
        <div className="summary-card receitas">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <div className="summary-label">Receitas</div>
            <div className="summary-value">R$ {resumo.receitas.toFixed(2)}</div>
            <div className="summary-period">{resumo.mes}</div>
          </div>
        </div>

        <div className="summary-card despesas">
          <div className="summary-icon">📉</div>
          <div className="summary-content">
            <div className="summary-label">Despesas</div>
            <div className="summary-value">R$ {resumo.despesas.toFixed(2)}</div>
            <div className="summary-period">{resumo.mes}</div>
          </div>
        </div>

        <div className={`summary-card saldo ${resumo.saldo >= 0 ? 'positivo' : 'negativo'}`}>
          <div className="summary-icon">{resumo.saldo >= 0 ? '💰' : '⚠️'}</div>
          <div className="summary-content">
            <div className="summary-label">Saldo</div>
            <div className="summary-value">R$ {resumo.saldo.toFixed(2)}</div>
            <div className="summary-period">{resumo.mes}</div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de barras */}
        <div className="card">
          <h3 className="card-title">📊 Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ultimosDias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `R$ ${value.toFixed(2)}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="receitas" fill="#22c55e" name="Receitas" radius={[8, 8, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de pizza */}
        <div className="card">
          <h3 className="card-title">🎯 Despesas por Categoria</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>📊 Nenhuma despesa registrada ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Últimas transações */}
      <div className="card">
        <h3 className="card-title">💳 Últimas Transações</h3>
        <div className="transactions-list">
          {transacoes.slice(0, 5).map((t, index) => (
            <div key={index} className="transaction-item">
              <div className="transaction-left">
                <div className="transaction-icon">
                  {t.tipo === 'receita' ? '📈' : '📉'}
                </div>
                <div className="transaction-info">
                  <div className="transaction-desc">{t.descricao}</div>
                  <div className="transaction-meta">
                    <span className="transaction-category">{t.categoria}</span>
                    <span className="transaction-date">
                      {moment(t.data).fromNow()}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`transaction-value ${t.tipo}`}>
                {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

