import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' ou 'payments'
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, usersRes, paymentsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/payments/pending')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPendingPayments(paymentsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados do admin');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprovePayment(paymentId, plan) {
    try {
      const transactionId = prompt('Digite o ID da transação PIX (opcional):');
      
      await axios.post(`/api/admin/payments/${paymentId}/approve`, {
        transaction_id: transactionId,
        plan: plan
      });
      
      await loadData();
      alert('Pagamento aprovado! Plano do usuário atualizado.');
    } catch (error) {
      alert('Erro ao aprovar pagamento');
    }
  }

  async function handleUpdatePlan(userId, newPlan) {
    try {
      await axios.put(`/api/admin/users/${userId}/plan`, { plan: newPlan });
      await loadData();
      setEditingUser(null);
      alert('Plano atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar plano');
    }
  }

  async function handleToggleActive(userId) {
    try {
      await axios.put(`/api/admin/users/${userId}/toggle-active`);
      await loadData();
    } catch (error) {
      alert('Erro ao alterar status do usuário');
    }
  }

  function getPlanBadgeClass(plan) {
    switch (plan) {
      case 'basico': return 'badge-basico';
      case 'premium': return 'badge-premium';
      case 'enterprise': return 'badge-enterprise';
      default: return 'badge-basico';
    }
  }

  function getPlanName(plan) {
    switch (plan) {
      case 'basico': return 'Básico';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return plan;
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Carregando dados do administrador...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>👑 Painel de Administrador</h1>
        <p>Bem-vindo, {user?.name}!</p>
      </div>

      {/* Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total de Usuários</h3>
            <p className="stat-number">{stats?.total_users || 0}</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Usuários Ativos</h3>
            <p className="stat-number">{stats?.active_users || 0}</p>
          </div>
        </div>

        <div className="stat-card basico">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Plano Básico</h3>
            <p className="stat-number">{stats?.basico_users || 0}</p>
          </div>
        </div>

        <div className="stat-card premium">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Plano Premium</h3>
            <p className="stat-number">{stats?.premium_users || 0}</p>
          </div>
        </div>

        <div className="stat-card enterprise">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Plano Enterprise</h3>
            <p className="stat-number">{stats?.enterprise_users || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuários ({users.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Pagamentos Pendentes {pendingPayments.length > 0 && <span className="badge-notification">{pendingPayments.length}</span>}
        </button>
      </div>

      {/* Pagamentos Pendentes */}
      {activeTab === 'payments' && (
        <div className="payments-section">
          <h2>💳 Pagamentos Pendentes</h2>

          {pendingPayments.length === 0 ? (
            <div className="empty-state">
              <p>✅ Nenhum pagamento pendente</p>
            </div>
          ) : (
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Email</th>
                    <th>Plano</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map(payment => (
                    <tr key={payment.id}>
                      <td>#{payment.id}</td>
                      <td><strong>{payment.name}</strong></td>
                      <td>{payment.email}</td>
                      <td>
                        <span className={`badge badge-${payment.plan}`}>
                          {payment.plan === 'basico' && 'Básico'}
                          {payment.plan === 'premium' && 'Premium'}
                          {payment.plan === 'enterprise' && 'Enterprise'}
                        </span>
                      </td>
                      <td className="payment-amount">R$ {payment.amount.toFixed(2)}</td>
                      <td>{new Date(payment.created_at).toLocaleString('pt-BR')}</td>
                      <td>
                        <button
                          className="btn-approve"
                          onClick={() => handleApprovePayment(payment.id, payment.plan)}
                        >
                          ✅ Aprovar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Lista de Usuários */}
      {activeTab === 'users' && (
        <div className="users-section">
          <h2>📋 Gerenciar Usuários</h2>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Último Login</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={!u.active ? 'inactive-user' : ''}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.role === 'admin' && <span className="badge-admin">👑 Admin</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {editingUser === u.id ? (
                      <select
                        value={u.plan}
                        onChange={(e) => handleUpdatePlan(u.id, e.target.value)}
                        className="plan-select"
                      >
                        <option value="basico">Básico</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    ) : (
                      <span className={`badge ${getPlanBadgeClass(u.plan)}`}>
                        {getPlanName(u.plan)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${u.active ? 'active' : 'inactive'}`}>
                      {u.active ? '✅ Ativo' : '❌ Inativo'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    {u.last_login 
                      ? new Date(u.last_login).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                        title="Editar plano"
                      >
                        {editingUser === u.id ? '✓' : '✏️'}
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn-toggle ${u.active ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => handleToggleActive(u.id)}
                          title={u.active ? 'Desativar' : 'Ativar'}
                        >
                          {u.active ? '🚫' : '✅'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Informações dos Planos */}
      <div className="plans-info">
        <h2>💰 Informações dos Planos</h2>
        
        <div className="plans-grid">
          <div className="plan-info-card basico-card">
            <h3>💰 Básico</h3>
            <p className="plan-price">R$ 15,00/mês</p>
            <ul>
              <li>100 transações/mês</li>
              <li>30 mensagens IA/dia</li>
              <li>Dashboard completo</li>
              <li>Alertas inteligentes</li>
            </ul>
          </div>

          <div className="plan-info-card premium-card">
            <h3>⭐ Premium</h3>
            <p className="plan-price">R$ 39,90/mês</p>
            <ul>
              <li>1.000 transações/mês</li>
              <li>200 mensagens IA/dia</li>
              <li>WhatsApp integrado</li>
              <li>Transcrição de áudio</li>
              <li>Análises avançadas</li>
            </ul>
          </div>

          <div className="plan-info-card enterprise-card">
            <h3>🏢 Enterprise</h3>
            <p className="plan-price">R$ 99,90/mês</p>
            <ul>
              <li>Transações ilimitadas</li>
              <li>Mensagens IA ilimitadas</li>
              <li>Todos os recursos Premium</li>
              <li>Suporte prioritário 24/7</li>
              <li>API personalizada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

