import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function Dashboard({ resumo, transacoes }) {
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(moment().format('YYYY-MM'));
  const [loadingLembretes, setLoadingLembretes] = useState(true);
  
  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL || '';

  // Carregar lembretes
  useEffect(() => {
    const carregarLembretes = async () => {
      try {
        setLoadingLembretes(true);
        const response = await axios.get(`${apiUrl}/api/lembretes`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: 'pendente' }
        });
        setLembretes(response.data);
      } catch (error) {
        console.error('Erro ao carregar lembretes:', error);
      } finally {
        setLoadingLembretes(false);
      }
    };
    
    carregarLembretes();
  }, [apiUrl, token]);

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

  // Filtrar lembretes pelo mês selecionado
  const lembretesFiltrados = lembretes.filter(l => {
    const dataVencimento = moment(l.data_vencimento);
    return dataVencimento.format('YYYY-MM') === mesSelecionado;
  });

  // Calcular total a pagar no mês
  const totalAPagar = lembretesFiltrados.reduce((total, l) => {
    return total + (l.valor ? parseFloat(l.valor) : 0);
  }, 0);

  // Gerar lista de meses (últimos 3 e próximos 3)
  const mesesDisponiveis = [];
  for (let i = -3; i <= 3; i++) {
    const mes = moment().add(i, 'months');
    mesesDisponiveis.push({
      valor: mes.format('YYYY-MM'),
      label: mes.format('MMMM YYYY')
    });
  }

  // Função para verificar se lembrete está atrasado
  const isAtrasado = (dataVencimento) => {
    return moment(dataVencimento).isBefore(moment());
  };

  // Função para verificar se é urgente (próximos 3 dias)
  const isUrgente = (dataVencimento) => {
    const dias = moment(dataVencimento).diff(moment(), 'days');
    return dias >= 0 && dias <= 3;
  };

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

      {/* Grid para Últimas Transações e A Pagar */}
      <div className="bottom-grid">
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

        {/* Card A Pagar */}
        <div className="card a-pagar-card">
          <div className="card-header-with-filter">
            <h3 className="card-title">💸 A Pagar</h3>
            <select 
              className="mes-filtro"
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
            >
              {mesesDisponiveis.map(mes => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>

          {/* Total a pagar do mês */}
          <div className="total-a-pagar">
            <span className="total-label">Total do Mês:</span>
            <span className="total-valor">R$ {totalAPagar.toFixed(2)}</span>
          </div>

          {/* Lista de lembretes */}
          <div className="lembretes-list">
            {loadingLembretes ? (
              <div className="loading-lembretes">⏳ Carregando...</div>
            ) : lembretesFiltrados.length === 0 ? (
              <div className="no-lembretes">
                <p>✅ Nenhuma conta a pagar em {moment(mesSelecionado).format('MMMM YYYY')}</p>
              </div>
            ) : (
              lembretesFiltrados
                .sort((a, b) => moment(a.data_vencimento).diff(moment(b.data_vencimento)))
                .map((lembrete) => {
                  const atrasado = isAtrasado(lembrete.data_vencimento);
                  const urgente = isUrgente(lembrete.data_vencimento);
                  const diasRestantes = moment(lembrete.data_vencimento).diff(moment(), 'days');
                  
                  return (
                    <div 
                      key={lembrete.id} 
                      className={`lembrete-item ${atrasado ? 'atrasado' : urgente ? 'urgente' : ''}`}
                    >
                      <div className="lembrete-left">
                        <div className="lembrete-icon">
                          {atrasado ? '⚠️' : urgente ? '🔔' : '📅'}
                        </div>
                        <div className="lembrete-info">
                          <div className="lembrete-titulo">{lembrete.titulo}</div>
                          <div className="lembrete-meta">
                            <span className="lembrete-categoria">
                              {lembrete.categoria}
                            </span>
                            <span className="lembrete-data">
                              {moment(lembrete.data_vencimento).format('DD/MM/YYYY')}
                            </span>
                            <span className={`lembrete-status ${atrasado ? 'status-atrasado' : urgente ? 'status-urgente' : 'status-normal'}`}>
                              {atrasado 
                                ? `${Math.abs(diasRestantes)} dia(s) atrasado` 
                                : urgente 
                                ? diasRestantes === 0 
                                  ? 'Vence hoje!' 
                                  : `${diasRestantes} dia(s) restante(s)` 
                                : `${diasRestantes} dia(s)`}
                            </span>
                          </div>
                        </div>
                      </div>
                      {lembrete.valor && (
                        <div className="lembrete-valor">
                          R$ {parseFloat(lembrete.valor).toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

