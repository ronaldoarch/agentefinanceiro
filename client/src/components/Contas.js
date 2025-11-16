import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Contas.css';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function Contas() {
  const [contas, setContas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editingConta, setEditingConta] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estado do formulário
  const [form, setForm] = useState({
    nome: '',
    tipo: 'cartao_credito',
    banco: '',
    ultimos_4_digitos: '',
    limite: '',
    saldo_inicial: '0',
    cor: '#6366f1',
    icone: '💳'
  });

  const tiposConta = [
    { value: 'cartao_credito', label: '💳 Cartão de Crédito', icon: '💳' },
    { value: 'conta_corrente', label: '🏦 Conta Corrente', icon: '🏦' },
    { value: 'poupanca', label: '💰 Poupança', icon: '💰' },
    { value: 'carteira', label: '💵 Carteira', icon: '💵' },
    { value: 'outro', label: '📁 Outro', icon: '📁' }
  ];

  const cores = [
    { value: '#6366f1', label: 'Roxo' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f59e0b', label: 'Laranja' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#8b5cf6', label: 'Roxo Claro' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#ec4899', label: 'Rosa' }
  ];

  const icones = ['💳', '🏦', '💰', '💵', '💳', '🏛️', '💎', '🎯', '📊', '💼'];

  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    carregarContas();
  }, []);

  const carregarContas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/contas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContas(response.data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      alert('❌ Erro ao carregar contas: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.nome) {
      alert('Nome da conta é obrigatório!');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...form,
        limite: form.limite ? parseFloat(form.limite) : null,
        saldo_inicial: parseFloat(form.saldo_inicial) || 0
      };

      if (editingConta) {
        await axios.put(`${apiUrl}/api/contas/${editingConta.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Conta atualizada com sucesso!');
      } else {
        await axios.post(`${apiUrl}/api/contas`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ Conta criada com sucesso!');
      }
      
      setMostrarForm(false);
      setEditingConta(null);
      resetForm();
      carregarContas();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      alert('❌ Erro ao salvar conta: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conta) => {
    setEditingConta(conta);
    setForm({
      nome: conta.nome || '',
      tipo: conta.tipo || 'cartao_credito',
      banco: conta.banco || '',
      ultimos_4_digitos: conta.ultimos_4_digitos || '',
      limite: conta.limite || '',
      saldo_inicial: conta.saldo_inicial || '0',
      cor: conta.cor || '#6366f1',
      icone: conta.icone || '💳'
    });
    setMostrarForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta conta?')) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/contas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Conta deletada com sucesso!');
      carregarContas();
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      alert('❌ Erro ao deletar conta: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setForm({
      nome: '',
      tipo: 'cartao_credito',
      banco: '',
      ultimos_4_digitos: '',
      limite: '',
      saldo_inicial: '0',
      cor: '#6366f1',
      icone: '💳'
    });
  };

  const handleTipoChange = (tipo) => {
    setForm({ ...form, tipo });
    const tipoEncontrado = tiposConta.find(t => t.value === tipo);
    if (tipoEncontrado) {
      setForm({ ...form, tipo, icone: tipoEncontrado.icon });
    }
  };

  return (
    <div className="contas-container">
      <div className="contas-header">
        <h2>💳 Gerenciar Contas e Cartões</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            setEditingConta(null);
            resetForm();
            setMostrarForm(true);
          }}
        >
          ➕ Nova Conta
        </button>
      </div>

      {mostrarForm && (
        <div className="conta-form-container">
          <div className="conta-form">
            <div className="form-header">
              <h3>{editingConta ? '✏️ Editar Conta' : '➕ Nova Conta'}</h3>
              <button className="btn-close" onClick={() => {
                setMostrarForm(false);
                setEditingConta(null);
                resetForm();
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome da Conta *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Nubank, Cartão Itaú, Carteira"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => handleTipoChange(e.target.value)}
                  required
                >
                  {tiposConta.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Banco (opcional)</label>
                  <input
                    type="text"
                    value={form.banco}
                    onChange={(e) => setForm({ ...form, banco: e.target.value })}
                    placeholder="Ex: Nubank, Itaú, Inter"
                  />
                </div>

                <div className="form-group">
                  <label>Últimos 4 dígitos (opcional)</label>
                  <input
                    type="text"
                    value={form.ultimos_4_digitos}
                    onChange={(e) => setForm({ ...form, ultimos_4_digitos: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="1234"
                    maxLength="4"
                  />
                </div>
              </div>

              {form.tipo === 'cartao_credito' && (
                <div className="form-group">
                  <label>Limite do Cartão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.limite}
                    onChange={(e) => setForm({ ...form, limite: e.target.value })}
                    placeholder="5000.00"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.saldo_inicial}
                  onChange={(e) => setForm({ ...form, saldo_inicial: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cor</label>
                  <div className="color-picker">
                    {cores.map(cor => (
                      <button
                        key={cor.value}
                        type="button"
                        className={`color-option ${form.cor === cor.value ? 'selected' : ''}`}
                        style={{ backgroundColor: cor.value }}
                        onClick={() => setForm({ ...form, cor: cor.value })}
                        title={cor.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Ícone</label>
                  <div className="icon-picker">
                    {icones.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${form.icone === icon ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, icone: icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setMostrarForm(false);
                  setEditingConta(null);
                  resetForm();
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : (editingConta ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && !mostrarForm && (
        <div className="loading-contas">
          <div className="spinner"></div>
          <p>Carregando contas...</p>
        </div>
      )}

      {!loading && !mostrarForm && contas.length === 0 && (
        <div className="no-contas">
          <p>📭 Você ainda não tem contas cadastradas.</p>
          <p>Clique em "Nova Conta" para começar!</p>
        </div>
      )}

      {!loading && !mostrarForm && contas.length > 0 && (
        <div className="contas-grid">
          {contas.map(conta => (
            <div key={conta.id} className="conta-card" style={{ borderLeftColor: conta.cor }}>
              <div className="conta-header">
                <div className="conta-icon" style={{ color: conta.cor }}>
                  {conta.icone}
                </div>
                <div className="conta-info">
                  <h3>{conta.nome}</h3>
                  <p className="conta-tipo">
                    {tiposConta.find(t => t.value === conta.tipo)?.label || conta.tipo}
                  </p>
                </div>
              </div>

              <div className="conta-details">
                {conta.banco && (
                  <div className="conta-detail">
                    <span className="label">Banco:</span>
                    <span className="value">{conta.banco}</span>
                  </div>
                )}
                {conta.ultimos_4_digitos && (
                  <div className="conta-detail">
                    <span className="label">Final:</span>
                    <span className="value">**** {conta.ultimos_4_digitos}</span>
                  </div>
                )}
                {conta.limite && (
                  <div className="conta-detail">
                    <span className="label">Limite:</span>
                    <span className="value">R$ {parseFloat(conta.limite).toFixed(2)}</span>
                  </div>
                )}
                {conta.saldo_inicial !== undefined && (
                  <div className="conta-detail">
                    <span className="label">Saldo Inicial:</span>
                    <span className="value">R$ {parseFloat(conta.saldo_inicial || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="conta-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(conta)}
                >
                  ✏️ Editar
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(conta.id)}
                >
                  🗑️ Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Contas;

